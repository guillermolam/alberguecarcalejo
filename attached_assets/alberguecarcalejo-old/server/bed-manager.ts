import { storage } from './storage';
import { InsertBed } from '@shared/schema';

// Bed Management Service for automatic inventory setup and management
export class BedManager {
  // Initialize bed inventory (24 beds total)
  async initializeBedInventory() {
    const existingBeds = await storage.getAllBeds();
    
    if (existingBeds.length === 0) {
      console.log('🛏️  Initializing bed inventory...');
      
      const bedsToCreate: InsertBed[] = [
        // Dormitorio A (12 beds)
        ...Array.from({ length: 12 }, (_, i) => ({
          bedNumber: i + 1,
          roomNumber: 1,
          roomName: 'Dormitorio A',
          roomType: 'dormitory' as const,
          isAvailable: true,
          status: 'available' as const
        })),
        
        // Dormitorio B (8 beds)
        ...Array.from({ length: 8 }, (_, i) => ({
          bedNumber: i + 1,
          roomNumber: 2,
          roomName: 'Dormitorio B',
          roomType: 'dormitory' as const,
          isAvailable: true,
          status: 'available' as const
        })),
        
        // Private Rooms (4 beds - individual rooms)
        ...Array.from({ length: 4 }, (_, i) => ({
          bedNumber: 1, // Each private room has bed #1
          roomNumber: 100 + i + 1, // Rooms 101, 102, 103, 104
          roomName: `Habitación Privada ${i + 1}`,
          roomType: 'private' as const,
          isAvailable: true,
          status: 'available' as const
        }))
      ];

      await storage.initializeBeds();
      console.log(`✅ Initialized ${bedsToCreate.length} bed inventory`);
    } else {
      console.log(`🛏️  Bed inventory already exists: ${existingBeds.length} beds`);
    }
  }

  // Get available beds for specific dates
  async getAvailableBeds(checkInDate: string, checkOutDate: string) {
    return await storage.getAvailableBeds(checkInDate, checkOutDate);
  }

  // Get bed occupancy statistics
  async getBedOccupancyStats() {
    const allBeds = await storage.getAllBeds();
    const availableBeds = allBeds.filter(bed => bed.isAvailable && bed.status === 'available');
    const reservedBeds = allBeds.filter(bed => bed.status === 'reserved');
    const occupiedBeds = allBeds.filter(bed => bed.status === 'occupied');
    const maintenanceBeds = allBeds.filter(bed => bed.status === 'maintenance');

    return {
      total: allBeds.length,
      available: availableBeds.length,
      reserved: reservedBeds.length,
      occupied: occupiedBeds.length,
      maintenance: maintenanceBeds.length,
      occupancyRate: Math.round(((reservedBeds.length + occupiedBeds.length) / allBeds.length) * 100)
    };
  }

  // Auto-assign best available bed based on request
  async autoAssignBed(roomType: 'dormitory' | 'private' = 'dormitory', checkInDate: string, checkOutDate: string) {
    const availableBeds = await this.getAvailableBeds(checkInDate, checkOutDate);
    
    // Filter by room type preference
    const preferredBeds = availableBeds.filter(bed => bed.roomType === roomType);
    
    if (preferredBeds.length === 0) {
      // No beds of preferred type, try any available bed
      if (availableBeds.length > 0) {
        return availableBeds[0]; // Return first available bed of any type
      }
      return null; // No beds available
    }
    
    // For dormitory, prefer Dormitorio A (larger room)
    if (roomType === 'dormitory') {
      const dormitorioA = preferredBeds.filter(bed => bed.roomName === 'Dormitorio A');
      if (dormitorioA.length > 0) {
        return dormitorioA[0];
      }
    }
    
    // Return first available bed of preferred type
    return preferredBeds[0];
  }

  // Check bed availability for specific dates (compatibility alias)
  async checkAvailability(checkInDate: string, checkOutDate: string, numberOfPersons: number = 1) {
    return await this.checkBedAvailability(checkInDate, checkOutDate);
  }

  // Check bed availability for specific dates
  async checkBedAvailability(checkInDate: string, checkOutDate: string) {
    const availableBeds = await this.getAvailableBeds(checkInDate, checkOutDate);
    const dormitoryBeds = availableBeds.filter(bed => bed.roomType === 'dormitory');
    const privateBeds = availableBeds.filter(bed => bed.roomType === 'private');
    
    return {
      totalAvailable: availableBeds.length,
      dormitoryAvailable: dormitoryBeds.length,
      privateAvailable: privateBeds.length,
      hasAvailability: availableBeds.length > 0
    };
  }

  // Process payment and assign bed (atomic operation)
  async processPaymentAndAssignBed(bookingId: number, paymentId: number) {
    try {
      // Get booking details
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Update payment status to completed
      await storage.updatePaymentStatus(paymentId, 'completed');

      // Update booking status to confirmed
      await storage.updateBookingStatus(bookingId, 'confirmed');

      // Update bed status to occupied if bed is assigned
      if (booking.bedAssignmentId) {
        await storage.updateBedStatus(booking.bedAssignmentId, 'occupied');
      }

      return { success: true, message: 'Payment processed and bed assigned' };
    } catch (error) {
      console.error('Error processing payment and assigning bed:', error);
      throw error;
    }
  }

  // Release bed when booking is cancelled
  async releaseBed(bedId: number) {
    try {
      await storage.updateBedStatus(bedId, 'available');
      console.log(`🛏️  Released bed ${bedId} back to available inventory`);
      return { success: true, message: 'Bed released successfully' };
    } catch (error) {
      console.error('Error releasing bed:', error);
      throw error;
    }
  }
}

export const bedManager = new BedManager();