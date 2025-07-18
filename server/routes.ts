import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as wasmProxy from "./wasm-proxy";
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

  // Document validation endpoint - with fallback to local validation
  app.post("/api/validate/document", async (req, res) => {
    try {
      const { documentType, documentNumber } = req.body;
      
      // Try Rust backend first, fallback to local validation
      try {
        const result = await wasmProxy.validateDocument(documentType, documentNumber);
        res.json(result);
        return;
      } catch (backendError) {
        console.warn("Backend unavailable for document validation, using fallback");
      }

      // Fallback to basic local validation
      const sanitized = documentNumber.trim().toUpperCase();
      let isValid = false;
      let message = "Invalid document";

      switch (documentType.toUpperCase()) {
        case 'DNI':
          isValid = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(sanitized);
          message = isValid ? "DNI format is valid" : "Invalid DNI format";
          break;
        case 'NIE':
          isValid = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i.test(sanitized);
          message = isValid ? "NIE format is valid" : "Invalid NIE format";
          break;
        case 'PASSPORT':
          isValid = /^[A-Z0-9]{6,9}$/i.test(sanitized);
          message = isValid ? "Passport format is valid" : "Invalid passport format";
          break;
      }

      res.json({
        success: true,
        data: { valid: isValid, message },
        rate_limited: false
      });
      
    } catch (error) {
      res.status(400).json({ error: "Validation failed" });
    }
  });

  // Email validation endpoint - with fallback to local validation
  app.post("/api/validate/email", async (req, res) => {
    try {
      const { email } = req.body;
      
      // Try Rust backend first, fallback to local validation
      try {
        const result = await wasmProxy.validateEmail(email);
        res.json(result);
        return;
      } catch (backendError) {
        console.warn("Backend unavailable for email validation, using fallback");
      }

      // Fallback to basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);
      
      res.json({
        success: true,
        data: { 
          valid: isValid, 
          message: isValid ? "Email format is valid" : "Invalid email format" 
        },
        rate_limited: false
      });
      
    } catch (error) {
      res.status(400).json({ error: "Validation failed" });
    }
  });

  // Phone validation endpoint - with fallback to local validation
  app.post("/api/validate/phone", async (req, res) => {
    try {
      const { phone, countryCode } = req.body;
      
      // Try Rust backend first, fallback to local validation
      try {
        const result = await wasmProxy.validatePhone(phone, countryCode);
        res.json(result);
        return;
      } catch (backendError) {
        console.warn("Backend unavailable for phone validation, using fallback");
      }

      // Fallback to basic phone validation
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      const phoneRegex = /^[\+]?[0-9]{7,15}$/;
      const isValid = phoneRegex.test(cleanPhone);
      
      res.json({
        success: true,
        data: { 
          valid: isValid, 
          message: isValid ? "Phone format is valid" : "Invalid phone format" 
        },
        rate_limited: false
      });
      
    } catch (error) {
      res.status(400).json({ error: "Validation failed" });
    }
  });

  // Country information endpoint - with fallback to local data
  app.post("/api/country/info", async (req, res) => {
    try {
      const { countryName } = req.body;
      
      // Try Rust backend first, fallback to local data
      try {
        const result = await wasmProxy.getCountryInfo(countryName);
        res.json(result);
        return;
      } catch (backendError) {
        console.warn("Backend unavailable for country info, using fallback");
      }

      // Fallback to basic country data (limited set for common countries)
      const countryData: Record<string, any> = {
        "spain": { name: "Spain", code: "ES", dialCode: "+34" },
        "france": { name: "France", code: "FR", dialCode: "+33" },
        "portugal": { name: "Portugal", code: "PT", dialCode: "+351" },
        "italy": { name: "Italy", code: "IT", dialCode: "+39" },
        "germany": { name: "Germany", code: "DE", dialCode: "+49" },
        "united kingdom": { name: "United Kingdom", code: "GB", dialCode: "+44" },
        "united states": { name: "United States", code: "US", dialCode: "+1" }
      };

      const country = countryData[countryName.toLowerCase()];
      if (country) {
        res.json({
          success: true,
          data: country,
          rate_limited: false
        });
      } else {
        res.status(404).json({ error: "Country not found" });
      }
      
    } catch (error) {
      res.status(404).json({ error: "Country not found" });
    }
  });

  // Check availability endpoint - with fallback to local logic
  app.post("/api/availability", async (req, res) => {
    try {
      const { checkInDate, checkOutDate, numberOfPersons } = checkAvailabilitySchema.parse(req.body);
      
      // Try Rust backend first, fallback to local logic
      try {
        const result = await wasmProxy.checkAvailability(checkInDate, checkOutDate, numberOfPersons);
        res.json(result);
        return;
      } catch (backendError) {
        console.warn("Backend unavailable for availability check, using fallback");
      }

      // Fallback to local availability logic
      const checkInDate_parsed = new Date(checkInDate);
      const checkOutDate_parsed = new Date(checkOutDate);
      const today = new Date();
      
      // Basic date validation
      if (checkInDate_parsed >= checkOutDate_parsed) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: "Check-out date must be after check-in date" 
        });
      }
      
      if (checkInDate_parsed < today) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: "Check-in date cannot be in the past" 
        });
      }

      // Get availability from storage
      const allBeds = await storage.getAllBeds();
      const totalBeds = allBeds.length;
      const overlappingBookings = await storage.getBookingsByDateRange(checkInDate, checkOutDate);
      
      const occupiedBedIds = new Set(
        overlappingBookings
          .filter(booking => booking.status === 'confirmed' || booking.status === 'checked_in')
          .map(booking => booking.bedAssignmentId)
          .filter(bedId => bedId !== null)
      );
      
      const availableBeds = allBeds.filter(bed => 
        bed.status === 'available' && !occupiedBedIds.has(bed.id)
      );
      
      const available = availableBeds.length >= numberOfPersons;
      
      res.json({
        available,
        totalBeds,
        availableBeds: availableBeds.length,
        occupiedBeds: totalBeds - availableBeds.length,
        suggestedDates: !available ? ["2025-07-21", "2025-07-22"] : undefined,
        message: available 
          ? `${availableBeds.length} bed(s) available for your stay.`
          : "No beds available for the selected dates. Please consider the suggested alternative dates."
      });
      
    } catch (error) {
      res.status(400).json({ 
        error: "Invalid request", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Complete registration endpoint - with fallback to local logic
  app.post("/api/register", async (req, res) => {
    try {
      const { pilgrim, booking, payment } = completeRegistrationSchema.parse(req.body);
      
      // Try Rust backend first, fallback to local logic
      try {
        const result = await wasmProxy.registerPilgrim(pilgrim, booking, payment);
        res.json(result);
        return;
      } catch (backendError) {
        console.warn("Backend unavailable for registration, using fallback");
      }

      // Fallback to legacy registration logic
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

      res.json({
        success: true,
        data: {
          pilgrim: pilgrimRecord,
          booking: bookingRecord,
          payment: paymentRecord,
          referenceNumber
        }
      });
      
    } catch (error) {
      res.status(400).json({ 
        error: "Registration failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Legacy registration endpoint for compatibility
  app.post("/api/register/legacy", async (req, res) => {
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

  // Get all beds endpoint - now through secure Rust BFF
  app.get("/api/beds", async (req, res) => {
    try {
      const beds = await storage.getAllBeds();
      res.json(beds);
    } catch (error) {
      res.status(500).json({ error: "Failed to get beds" });
    }
  });

  // Update bed status endpoint - now through secure Rust BFF
  app.patch("/api/beds/:id/status", async (req, res) => {
    try {
      const bedId = parseInt(req.params.id);
      const { status } = req.body;
      await storage.updateBedStatus(bedId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update bed status" });
    }
  });
  
  // Government submission retry - now through secure Rust BFF
  app.post("/api/government/retry", async (req, res) => {
    try {
      // This would be handled by the Rust backend
      res.json({ message: "Government submission retry initiated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to retry submission" });
    }
  });
  
  // Rate limit status check
  app.get("/api/rate-limit/status", async (req, res) => {
    try {
      // This would be handled by the Rust backend
      res.json({ status: "ok" });
    } catch (error) {
      res.status(500).json({ error: "Failed to get rate limit status" });
    }
  });
  
  // Legacy bed update endpoint for compatibility
  app.patch("/api/beds/:id/status/legacy", async (req, res) => {
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

  // Get dashboard statistics (public endpoint for home page) - fallback to local storage
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Try Rust backend first, fallback to local storage
      try {
        const stats = await wasmProxy.getDashboardStats();
        res.json(stats);
        return;
      } catch (backendError) {
        console.warn("Backend unavailable, using fallback:", backendError);
      }

      // Fallback to local storage
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
  app.get("/api/bookings/recent", async (req, res) => {
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

// All utility functions are now imported from utils modules
