import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { availabilityService } from "./services/availability";
import { xmlGenerator } from "./services/xml-generator";
import { governmentApiService } from "./services/government-api";
import { requireAuth, requireBFFAuth } from "./middleware/auth";
import { 
  insertPilgrimSchema, 
  insertBookingSchema, 
  insertPaymentSchema 
} from "@shared/schema";
import { z } from "zod";

const checkAvailabilitySchema = z.object({
  checkInDate: z.string(),
  checkOutDate: z.string(),
  numberOfPersons: z.number().min(1).max(1) // Only individual registrations
});

const completeRegistrationSchema = z.object({
  pilgrim: insertPilgrimSchema,
  booking: insertBookingSchema.omit({ pilgrimId: true }),
  payment: insertPaymentSchema.omit({ bookingId: true })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize beds on startup
  await storage.initializeBeds();

  // Check availability endpoint
  app.post("/api/availability", async (req, res) => {
    try {
      const { checkInDate, checkOutDate, numberOfPersons } = checkAvailabilitySchema.parse(req.body);
      
      const availability = await availabilityService.checkAvailability(
        checkInDate,
        checkOutDate,
        numberOfPersons
      );

      res.json(availability);
    } catch (error) {
      res.status(400).json({ 
        error: "Invalid request", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Complete registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { pilgrim, booking, payment } = completeRegistrationSchema.parse(req.body);

      // Check if pilgrim already exists
      const existingPilgrim = await storage.getPilgrimByDocument(
        pilgrim.documentType,
        pilgrim.documentNumber
      );

      let pilgrimRecord;
      if (existingPilgrim) {
        pilgrimRecord = existingPilgrim;
      } else {
        pilgrimRecord = await storage.createPilgrim(pilgrim);
      }

      // Generate unique reference number
      const referenceNumber = `ALB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create booking
      const bookingRecord = await storage.createBooking({
        ...booking,
        pilgrimId: pilgrimRecord.id,
        referenceNumber
      });

      // Create payment record
      const paymentRecord = await storage.createPayment({
        ...payment,
        bookingId: bookingRecord.id,
        receiptNumber: `REC-${bookingRecord.id}-${Date.now()}`
      });

      // Generate XML for government submission
      const xmlContent = xmlGenerator.generateParteViajeros(pilgrimRecord, bookingRecord, paymentRecord);

      // Create government submission record
      const submissionRecord = await storage.createGovernmentSubmission({
        bookingId: bookingRecord.id,
        xmlContent,
        submissionStatus: "pending",
        attempts: 0
      });

      // Attempt to submit to government API
      try {
        const submissionResult = await governmentApiService.submitParteViajeros(xmlContent);
        
        if (submissionResult.success) {
          await storage.updateGovernmentSubmissionStatus(
            submissionRecord.id,
            "success",
            submissionResult.response
          );
        } else {
          await storage.updateGovernmentSubmissionStatus(
            submissionRecord.id,
            "failed",
            submissionResult.error
          );
        }
      } catch (submissionError) {
        await storage.incrementSubmissionAttempts(submissionRecord.id);
        console.error("Government API submission failed:", submissionError);
      }

      res.json({
        success: true,
        referenceNumber,
        bookingId: bookingRecord.id,
        paymentId: paymentRecord.id
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        error: "Registration failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get all beds endpoint
  app.get("/api/beds", async (req, res) => {
    try {
      const beds = await storage.getAllBeds();
      res.json(beds);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to fetch beds", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Update bed status endpoint
  app.patch("/api/beds/:id/status", async (req, res) => {
    try {
      const bedId = parseInt(req.params.id);
      const { status } = z.object({ status: z.string() }).parse(req.body);

      await storage.updateBedStatus(bedId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ 
        error: "Failed to update bed status", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get dashboard statistics (protected by BFF)
  app.get("/api/dashboard/stats", requireBFFAuth, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const occupancyStats = await storage.getOccupancyStats(today);
      const revenueStats = await storage.getRevenueStats(today);
      const complianceStats = await storage.getComplianceStats();

      res.json({
        occupancy: occupancyStats,
        revenue: revenueStats,
        compliance: complianceStats
      });
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to fetch dashboard stats", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get recent bookings (protected by BFF)
  app.get("/api/bookings/recent", requireBFFAuth, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const bookings = await storage.getBookingsByDateRange(today, tomorrow);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to fetch recent bookings", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Manual check-in endpoint
  app.post("/api/checkin/:bookingId", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const { bedId } = z.object({ bedId: z.number() }).parse(req.body);

      await storage.assignBedToBooking(bookingId, bedId);
      await storage.updateBookingStatus(bookingId, "checked_in");
      await storage.updateBedStatus(bedId, "occupied");

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ 
        error: "Check-in failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Manual check-out endpoint
  app.post("/api/checkout/:bookingId", async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      await storage.updateBookingStatus(bookingId, "checked_out");
      
      if (booking.bedAssignmentId) {
        await storage.updateBedStatus(booking.bedAssignmentId, "available");
      }

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ 
        error: "Check-out failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
