import { db } from "./db";
import { beds, bookings, pilgrims, payments } from "@shared/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export interface BedAssignmentRequest {
  bookingId: number;
  checkInDate: string;
  checkOutDate: string;
  numberOfPersons: number;
}

export interface BedAssignmentResult {
  success: boolean;
  bedId?: number;
  bedNumber?: number;
  roomNumber?: number;
  roomName?: string;
  error?: string;
}

export class BedManager {
  /**
   * Initialize bed inventory if it doesn't exist
   */
  async initializeBeds(): Promise<void> {
    const existingBeds = await db.select().from(beds).limit(1);
    
    if (existingBeds.length === 0) {
      // Create default bed inventory for Albergue Del Carrascalejo
      const bedsToCreate = [];
      
      // Room 1: Dormitory A (10 beds)
      for (let i = 1; i <= 10; i++) {
        bedsToCreate.push({
          bedNumber: i,
          roomNumber: 1,
          roomName: "Dormitorio A",
          isAvailable: true,
          status: "available" as const
        });
      }
      
      // Room 2: Dormitory B (8 beds)
      for (let i = 11; i <= 18; i++) {
        bedsToCreate.push({
          bedNumber: i,
          roomNumber: 2,
          roomName: "Dormitorio B",
          isAvailable: true,
          status: "available" as const
        });
      }
      
      // Room 3: Private rooms (7 beds)
      for (let i = 19; i <= 25; i++) {
        bedsToCreate.push({
          bedNumber: i,
          roomNumber: 3,
          roomName: `Habitación Privada ${i - 18}`,
          isAvailable: true,
          status: "available" as const
        });
      }
      
      await db.insert(beds).values(bedsToCreate);
      console.log(`Initialized ${bedsToCreate.length} beds for Albergue Del Carrascalejo`);
    }
  }

  /**
   * Get available beds for a date range
   */
  async getAvailableBeds(checkInDate: string, checkOutDate: string): Promise<any[]> {
    return await db
      .select({
        id: beds.id,
        bedNumber: beds.bedNumber,
        roomNumber: beds.roomNumber,
        roomName: beds.roomName,
        status: beds.status
      })
      .from(beds)
      .leftJoin(
        bookings,
        and(
          eq(beds.id, bookings.bedAssignmentId),
          // Check for date overlap
          sql`(${bookings.checkInDate} <= ${checkOutDate} AND ${bookings.checkOutDate} >= ${checkInDate})`
        )
      )
      .where(
        and(
          eq(beds.isAvailable, true),
          eq(beds.status, "available"),
          isNull(bookings.id) // No conflicting booking
        )
      )
      .orderBy(beds.bedNumber);
  }

  /**
   * Automatically assign a bed to a confirmed booking
   */
  async assignBedToBooking(request: BedAssignmentRequest): Promise<BedAssignmentResult> {
    try {
      await this.initializeBeds();

      // Get available beds for the date range
      const availableBeds = await this.getAvailableBeds(request.checkInDate, request.checkOutDate);
      
      if (availableBeds.length === 0) {
        return {
          success: false,
          error: "No beds available for the selected dates"
        };
      }

      // Select the first available bed (could be enhanced with room preferences)
      const selectedBed = availableBeds[0];

      // Update the booking with bed assignment
      await db
        .update(bookings)
        .set({
          bedAssignmentId: selectedBed.id,
          status: "confirmed",
          updatedAt: new Date()
        })
        .where(eq(bookings.id, request.bookingId));

      return {
        success: true,
        bedId: selectedBed.id,
        bedNumber: selectedBed.bedNumber,
        roomNumber: selectedBed.roomNumber,
        roomName: selectedBed.roomName
      };

    } catch (error) {
      console.error("Error assigning bed:", error);
      return {
        success: false,
        error: "Failed to assign bed due to system error"
      };
    }
  }

  /**
   * Release a bed when booking is cancelled or checked out
   */
  async releaseBed(bookingId: number): Promise<boolean> {
    try {
      await db
        .update(bookings)
        .set({
          bedAssignmentId: null,
          status: "cancelled",
          updatedAt: new Date()
        })
        .where(eq(bookings.id, bookingId));

      return true;
    } catch (error) {
      console.error("Error releasing bed:", error);
      return false;
    }
  }

  /**
   * Get bed occupancy statistics
   */
  async getBedOccupancyStats(date?: string): Promise<{
    total: number;
    occupied: number;
    available: number;
    maintenance: number;
    occupancyRate: number;
  }> {
    await this.initializeBeds();

    const currentDate = date || new Date().toISOString().split('T')[0];
    
    // Get total beds
    const totalBeds = await db
      .select({ count: sql<number>`count(*)` })
      .from(beds);

    // Get occupied beds for the current date
    const occupiedBeds = await db
      .select({ count: sql<number>`count(*)` })
      .from(beds)
      .innerJoin(
        bookings,
        and(
          eq(beds.id, bookings.bedAssignmentId),
          sql`${bookings.checkInDate} <= ${currentDate} AND ${bookings.checkOutDate} > ${currentDate}`,
          eq(bookings.status, "confirmed")
        )
      );

    // Get maintenance beds
    const maintenanceBeds = await db
      .select({ count: sql<number>`count(*)` })
      .from(beds)
      .where(eq(beds.status, "maintenance"));

    const total = totalBeds[0].count;
    const occupied = occupiedBeds[0].count;
    const maintenance = maintenanceBeds[0].count;
    const available = total - occupied - maintenance;
    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

    return {
      total,
      occupied,
      available,
      maintenance,
      occupancyRate
    };
  }

  /**
   * Check bed availability for a specific date range
   */
  async checkAvailability(checkInDate: string, checkOutDate: string, numberOfPersons: number = 1): Promise<{
    available: boolean;
    availableBeds: number;
    totalBeds: number;
  }> {
    await this.initializeBeds();

    const availableBeds = await this.getAvailableBeds(checkInDate, checkOutDate);
    const stats = await this.getBedOccupancyStats();

    return {
      available: availableBeds.length >= numberOfPersons,
      availableBeds: availableBeds.length,
      totalBeds: stats.total
    };
  }

  /**
   * Process payment and automatically assign bed
   */
  async processPaymentAndAssignBed(bookingId: number, paymentData: {
    amount: number;
    paymentType: string;
    receiptNumber?: string;
  }): Promise<{
    success: boolean;
    bedAssignment?: BedAssignmentResult;
    paymentId?: number;
    error?: string;
  }> {
    try {
      // Get booking details
      const booking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

      if (booking.length === 0) {
        return { success: false, error: "Booking not found" };
      }

      const bookingData = booking[0];

      // Create payment record
      const paymentResult = await db
        .insert(payments)
        .values({
          bookingId,
          amount: paymentData.amount.toString(),
          paymentType: paymentData.paymentType,
          paymentStatus: "completed",
          currency: "EUR",
          receiptNumber: paymentData.receiptNumber,
          paymentDate: new Date()
        })
        .returning({ id: payments.id });

      const paymentId = paymentResult[0].id;

      // Assign bed automatically after payment confirmation
      const bedAssignment = await this.assignBedToBooking({
        bookingId,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        numberOfPersons: bookingData.numberOfPersons
      });

      if (!bedAssignment.success) {
        // Rollback payment if bed assignment fails
        await db
          .update(payments)
          .set({ paymentStatus: "failed" })
          .where(eq(payments.id, paymentId));

        return {
          success: false,
          error: bedAssignment.error
        };
      }

      return {
        success: true,
        bedAssignment,
        paymentId
      };

    } catch (error) {
      console.error("Error processing payment and bed assignment:", error);
      return {
        success: false,
        error: "Failed to process payment and assign bed"
      };
    }
  }
}

export const bedManager = new BedManager();