import { 
  users, pilgrims, bookings, beds, payments, governmentSubmissions,
  type User, type InsertUser, type Pilgrim, type InsertPilgrim,
  type Booking, type InsertBooking, type Bed, type InsertBed,
  type Payment, type InsertPayment, type GovernmentSubmission, type InsertGovernmentSubmission
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, not, inArray } from "drizzle-orm";
import { GDPRDataHandler } from "./encryption";
import { reservationCleanup } from "./reservation-cleanup";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Pilgrim management
  createPilgrim(pilgrim: InsertPilgrim): Promise<Pilgrim>;
  getPilgrim(id: number): Promise<Pilgrim | undefined>;
  getPilgrimByDocument(documentType: string, documentNumber: string): Promise<Pilgrim | undefined>;

  // Booking management
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByReference(referenceNumber: string): Promise<Booking | undefined>;
  getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]>;
  updateBookingStatus(id: number, status: string): Promise<void>;
  assignBedToBooking(bookingId: number, bedId: number): Promise<void>;

  // Bed management
  getAllBeds(): Promise<Bed[]>;
  getBed(id: number): Promise<Bed | undefined>;
  updateBedStatus(id: number, status: string): Promise<void>;
  getAvailableBeds(checkInDate: string, checkOutDate: string): Promise<Bed[]>;
  initializeBeds(): Promise<void>;

  // Payment management
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByBooking(bookingId: number): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string): Promise<void>;

  // Government submission management
  createGovernmentSubmission(submission: InsertGovernmentSubmission): Promise<GovernmentSubmission>;
  getGovernmentSubmission(id: number): Promise<GovernmentSubmission | undefined>;
  updateGovernmentSubmissionStatus(id: number, status: string, responseData?: any): Promise<void>;
  incrementSubmissionAttempts(id: number): Promise<void>;

  // Analytics
  getOccupancyStats(date: string): Promise<{ occupied: number; available: number; total: number }>;
  getRevenueStats(date: string): Promise<{ total: number; currency: string }>;
  getComplianceStats(): Promise<{ successRate: number; pendingSubmissions: number }>;
  
  // GDPR/Cleanup operations
  runReservationCleanup(): Promise<number>;
  getReservationStats(): Promise<any>;
  
  // Pricing management
  getPricing(): Promise<{dormitory: number | null, private: number | null, currency: string}>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createPilgrim(pilgrim: InsertPilgrim): Promise<Pilgrim> {
    // Encrypt sensitive data for GDPR/NIS2 compliance
    const encryptedData = GDPRDataHandler.encryptPilgrimData(pilgrim);
    
    const [result] = await db
      .insert(pilgrims)
      .values(encryptedData)
      .returning();
    return result;
  }

  async getPilgrim(id: number): Promise<Pilgrim | undefined> {
    const [pilgrim] = await db.select().from(pilgrims).where(eq(pilgrims.id, id));
    return pilgrim || undefined;
  }

  async getPilgrimByDocument(documentType: string, documentNumber: string): Promise<Pilgrim | undefined> {
    const [pilgrim] = await db.select().from(pilgrims).where(
      and(
        eq(pilgrims.documentType, documentType),
        eq(pilgrims.documentNumber, documentNumber)
      )
    );
    return pilgrim || undefined;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    // Calculate reservation expiry (2 hours from now)
    const reservationExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const paymentDeadline = reservationExpiresAt;
    
    const bookingWithExpiry = {
      ...booking,
      status: 'reserved',
      reservationExpiresAt,
      paymentDeadline,
      autoCleanupProcessed: false
    };
    
    const [result] = await db
      .insert(bookings)
      .values(bookingWithExpiry)
      .returning();
    
    // Reserve the bed if assigned
    if (booking.bedAssignmentId) {
      await db
        .update(beds)
        .set({
          status: 'reserved',
          isAvailable: false,
          reservedUntil: reservationExpiresAt,
          updatedAt: new Date()
        })
        .where(eq(beds.id, booking.bedAssignmentId));
    }
    
    return result;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingByReference(referenceNumber: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.referenceNumber, referenceNumber));
    return booking || undefined;
  }

  async getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(
      and(
        gte(bookings.checkInDate, startDate),
        lte(bookings.checkOutDate, endDate)
      )
    );
  }

  async updateBookingStatus(id: number, status: string): Promise<void> {
    await db.update(bookings).set({ status }).where(eq(bookings.id, id));
  }

  async assignBedToBooking(bookingId: number, bedId: number): Promise<void> {
    await db.update(bookings).set({ bedAssignmentId: bedId }).where(eq(bookings.id, bookingId));
  }

  async getAllBeds(): Promise<Bed[]> {
    return await db.select().from(beds).orderBy(asc(beds.roomNumber), asc(beds.bedNumber));
  }

  async getBed(id: number): Promise<Bed | undefined> {
    const [bed] = await db.select().from(beds).where(eq(beds.id, id));
    return bed || undefined;
  }

  async updateBedStatus(id: number, status: string): Promise<void> {
    await db.update(beds).set({ 
      status, 
      isAvailable: status === 'available',
      updatedAt: new Date()
    }).where(eq(beds.id, id));
  }

  async getAvailableBeds(checkInDate: string, checkOutDate: string): Promise<Bed[]> {
    // Get beds that are not occupied during the requested period
    const occupiedBeds = await db
      .select({ bedId: bookings.bedAssignmentId })
      .from(bookings)
      .where(
        and(
          lte(bookings.checkInDate, checkOutDate),
          gte(bookings.checkOutDate, checkInDate),
          // Include both confirmed bookings and active reservations
          inArray(bookings.status, ['confirmed', 'reserved'])
        )
      );

    const occupiedBedIds = occupiedBeds
      .map(b => b.bedId)
      .filter(id => id !== null && id !== undefined) as number[];

    if (occupiedBedIds.length === 0) {
      // No occupied beds, return all available beds
      return await db.select().from(beds).where(eq(beds.status, 'available'));
    }

    // Return beds that are available and not in the occupied list
    return await db.select().from(beds).where(
      and(
        eq(beds.status, 'available'),
        not(inArray(beds.id, occupiedBedIds))
      )
    );
  }

  async initializeBeds(): Promise<void> {
    const existingBeds = await db.select().from(beds).limit(1);
    if (existingBeds.length > 0) return;

    const bedsToCreate = [];
    
    // Room 1: 10 beds (dormitory beds at €15/night)
    for (let i = 1; i <= 10; i++) {
      bedsToCreate.push({
        bedNumber: i,
        roomNumber: 1,
        roomName: "Dormitorio 1",
        roomType: "dormitory",
        pricePerNight: "15.00", // Secure pricing stored in database
        currency: "EUR",
        isAvailable: true,
        status: "available"
      });
    }

    // Room 2: 10 beds (dormitory beds at €15/night)
    for (let i = 1; i <= 10; i++) {
      bedsToCreate.push({
        bedNumber: i,
        roomNumber: 2,
        roomName: "Dormitorio 2",
        roomType: "dormitory",
        pricePerNight: "15.00", // Secure pricing stored in database
        currency: "EUR",
        isAvailable: true,
        status: "available"
      });
    }

    // Room 3: 4 beds (dormitory beds at €15/night)
    for (let i = 1; i <= 4; i++) {
      bedsToCreate.push({
        bedNumber: i,
        roomNumber: 3,
        roomName: "Dormitorio 3",
        roomType: "dormitory",
        pricePerNight: "15.00", // Secure pricing stored in database
        currency: "EUR",
        isAvailable: true,
        status: "available"
      });
    }

    // Single room: 1 bed (private room at €35/night)
    bedsToCreate.push({
      bedNumber: 1,
      roomNumber: 4,
      roomName: "Habitación Individual",
      roomType: "private",
      pricePerNight: "35.00", // Higher price for private room
      currency: "EUR",
      isAvailable: true,
      status: "available"
    });

    await db.insert(beds).values(bedsToCreate);
    console.log("✅ Bed inventory initialized: 25 beds with secure pricing");
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    // Set payment deadline (2 hours from now)
    const paymentDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000);
    
    const paymentWithDeadline = {
      ...payment,
      paymentStatus: 'awaiting_payment',
      paymentDeadline
    };
    
    const [result] = await db
      .insert(payments)
      .values(paymentWithDeadline)
      .returning();
    return result;
  }

  async getPaymentsByBooking(bookingId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.bookingId, bookingId));
  }

  async updatePaymentStatus(id: number, status: string): Promise<void> {
    await db.update(payments).set({ paymentStatus: status }).where(eq(payments.id, id));
  }

  async createGovernmentSubmission(submission: InsertGovernmentSubmission): Promise<GovernmentSubmission> {
    const [result] = await db
      .insert(governmentSubmissions)
      .values(submission)
      .returning();
    return result;
  }

  async getGovernmentSubmission(id: number): Promise<GovernmentSubmission | undefined> {
    const [submission] = await db.select().from(governmentSubmissions).where(eq(governmentSubmissions.id, id));
    return submission || undefined;
  }

  async updateGovernmentSubmissionStatus(id: number, status: string, responseData?: any): Promise<void> {
    await db.update(governmentSubmissions).set({ 
      submissionStatus: status,
      responseData,
      lastAttempt: new Date()
    }).where(eq(governmentSubmissions.id, id));
  }

  async incrementSubmissionAttempts(id: number): Promise<void> {
    const [submission] = await db.select().from(governmentSubmissions).where(eq(governmentSubmissions.id, id));
    if (submission) {
      await db.update(governmentSubmissions).set({ 
        attempts: (submission.attempts || 0) + 1,
        lastAttempt: new Date()
      }).where(eq(governmentSubmissions.id, id));
    }
  }

  async getOccupancyStats(date: string): Promise<{ occupied: number; available: number; total: number }> {
    const totalBeds = await db.select().from(beds);
    const occupiedBookings = await db.select().from(bookings).where(
      and(
        lte(bookings.checkInDate, date),
        gte(bookings.checkOutDate, date),
        eq(bookings.status, 'confirmed')
      )
    );

    const total = totalBeds.length;
    const occupied = occupiedBookings.length;
    const available = total - occupied;

    return { occupied, available, total };
  }

  async getRevenueStats(date: string): Promise<{ total: number; currency: string }> {
    const paymentsToday = await db.select().from(payments).where(
      and(
        gte(payments.paymentDate, new Date(date + ' 00:00:00')),
        lte(payments.paymentDate, new Date(date + ' 23:59:59')),
        eq(payments.paymentStatus, 'completed')
      )
    );

    const total = paymentsToday.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    return { total, currency: 'EUR' };
  }

  async getComplianceStats(): Promise<{ successRate: number; pendingSubmissions: number }> {
    const allSubmissions = await db.select().from(governmentSubmissions);
    const successfulSubmissions = allSubmissions.filter(s => s.submissionStatus === 'success');
    const pendingSubmissions = allSubmissions.filter(s => s.submissionStatus === 'pending');

    const successRate = allSubmissions.length > 0 ? (successfulSubmissions.length / allSubmissions.length) * 100 : 0;
    
    return { 
      successRate: Math.round(successRate), 
      pendingSubmissions: pendingSubmissions.length 
    };
  }

  // Run database cleanup for expired reservations
  async runReservationCleanup(): Promise<number> {
    const result = await db.execute(sql`SELECT scheduled_reservation_cleanup()`);
    return result.rows[0]?.scheduled_reservation_cleanup || 0;
  }

  // Get reservation statistics
  async getReservationStats(): Promise<any> {
    return await reservationCleanup.getExpiryStats();
  }

  // GDPR: Get pilgrim data (decrypted)
  async getPilgrimDecrypted(id: number): Promise<Pilgrim | undefined> {
    const [pilgrim] = await db.select().from(pilgrims).where(eq(pilgrims.id, id));
    if (!pilgrim) return undefined;
    
    // Update last access date for GDPR compliance
    await db
      .update(pilgrims)
      .set({ lastAccessDate: new Date() })
      .where(eq(pilgrims.id, id));
    
    // Decrypt sensitive data before returning
    return GDPRDataHandler.decryptPilgrimData(pilgrim);
  }

  // Get secure pricing from database (prevents client-side tampering) - NO FALLBACKS
  async getPricing(): Promise<{dormitory: number | null, private: number | null, currency: string}> {
    // Get pricing from first available bed of each type (secure source)
    const dormitoryBed = await db
      .select({ pricePerNight: beds.pricePerNight, currency: beds.currency })
      .from(beds)
      .where(eq(beds.roomType, 'dormitory'))
      .limit(1);
    
    const privateBed = await db
      .select({ pricePerNight: beds.pricePerNight, currency: beds.currency })
      .from(beds)
      .where(eq(beds.roomType, 'private'))
      .limit(1);

    // Return null for unavailable prices - no hardcoded fallbacks
    return {
      dormitory: dormitoryBed.length > 0 && dormitoryBed[0].pricePerNight ? parseFloat(dormitoryBed[0].pricePerNight) : null,
      private: privateBed.length > 0 && privateBed[0].pricePerNight ? parseFloat(privateBed[0].pricePerNight) : null,
      currency: dormitoryBed.length > 0 ? dormitoryBed[0].currency || "EUR" : "EUR"
    };
  }
}

export const storage = new DatabaseStorage();
