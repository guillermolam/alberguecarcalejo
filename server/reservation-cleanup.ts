import { db } from './db';
import { bookings, payments, beds } from '@shared/schema';
import { eq, lt, and } from 'drizzle-orm';

// Automated reservation cleanup service for expired bookings
export class ReservationCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Start automated cleanup process (runs every 5 minutes)
  startAutomatedCleanup() {
    console.log('🔄 Starting automated reservation cleanup service...');
    
    // Run immediately on startup
    this.processExpiredReservations();
    
    // Then run every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.processExpiredReservations();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('✅ Automated cleanup service started');
  }

  // Stop automated cleanup
  stopAutomatedCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Automated cleanup service stopped');
    }
  }

  // Process all expired reservations
  async processExpiredReservations() {
    try {
      const now = new Date();
      console.log(`🔍 Checking for expired reservations at ${now.toISOString()}`);

      // Find expired reservations that haven't been processed yet
      const expiredBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            lt(bookings.reservationExpiresAt, now),
            eq(bookings.status, 'reserved'),
            eq(bookings.autoCleanupProcessed, false)
          )
        );

      console.log(`🕒 Found ${expiredBookings.length} expired reservations to process`);

      for (const booking of expiredBookings) {
        await this.cancelExpiredReservation(booking.id);
      }

      if (expiredBookings.length > 0) {
        console.log(`✅ Processed ${expiredBookings.length} expired reservations`);
      }
    } catch (error) {
      console.error('❌ Error processing expired reservations:', error);
    }
  }

  // Cancel a specific expired reservation
  private async cancelExpiredReservation(bookingId: number) {
    try {
      console.log(`🚫 Cancelling expired reservation: ${bookingId}`);

      // Begin transaction-like operations
      await db.transaction(async (tx) => {
        // 1. Update booking status to expired
        await tx
          .update(bookings)
          .set({
            status: 'expired',
            autoCleanupProcessed: true,
            updatedAt: new Date()
          })
          .where(eq(bookings.id, bookingId));

        // 2. Cancel associated payment
        await tx
          .update(payments)
          .set({
            paymentStatus: 'cancelled',
            updatedAt: new Date()
          })
          .where(eq(payments.bookingId, bookingId));

        // 3. Release the reserved bed
        const [booking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, bookingId));

        if (booking && booking.bedAssignmentId) {
          await tx
            .update(beds)
            .set({
              status: 'available',
              isAvailable: true,
              reservedUntil: null,
              updatedAt: new Date()
            })
            .where(eq(beds.id, booking.bedAssignmentId));

          console.log(`🛏️  Released bed ${booking.bedAssignmentId} back to available inventory`);
        }
      });

      console.log(`✅ Successfully cancelled expired reservation ${bookingId}`);
    } catch (error) {
      console.error(`❌ Error cancelling reservation ${bookingId}:`, error);
    }
  }

  // Manual cleanup trigger (for testing or admin use)
  async manualCleanup(): Promise<number> {
    await this.processExpiredReservations();
    
    // Return count of processed reservations
    const now = new Date();
    const processedCount = await db
      .select()
      .from(bookings)
      .where(
        and(
          lt(bookings.reservationExpiresAt, now),
          eq(bookings.status, 'expired'),
          eq(bookings.autoCleanupProcessed, true)
        )
      );

    return processedCount.length;
  }

  // Get reservation expiry statistics
  async getExpiryStats() {
    const now = new Date();
    
    const [activeReservations] = await db
      .select({ count: bookings.id })
      .from(bookings)
      .where(eq(bookings.status, 'reserved'));

    const [expiredReservations] = await db
      .select({ count: bookings.id })
      .from(bookings)
      .where(eq(bookings.status, 'expired'));

    const [soonToExpire] = await db
      .select({ count: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'reserved'),
          lt(bookings.reservationExpiresAt, new Date(now.getTime() + 30 * 60 * 1000)) // Next 30 minutes
        )
      );

    return {
      activeReservations: activeReservations?.count || 0,
      expiredReservations: expiredReservations?.count || 0,
      soonToExpire: soonToExpire?.count || 0,
      lastCleanup: now.toISOString()
    };
  }
}

export const reservationCleanup = new ReservationCleanupService();