import { storage } from '../storage';

export interface AvailabilityResult {
  available: boolean;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  suggestedDates?: string[];
  message?: string;
}

class AvailabilityService {
  async checkAvailability(
    checkInDate: string,
    checkOutDate: string,
    numberOfPersons: number
  ): Promise<AvailabilityResult> {
    try {
      // Parse dates
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      
      // Validate dates
      if (checkIn >= checkOut) {
        throw new Error('Check-out date must be after check-in date');
      }
      
      if (checkIn < new Date()) {
        throw new Error('Check-in date cannot be in the past');
      }
      
      // Get all beds
      const allBeds = await storage.getAllBeds();
      const totalBeds = allBeds.length;
      
      // Get bookings that overlap with the requested dates
      const overlappingBookings = await storage.getBookingsByDateRange(checkInDate, checkOutDate);
      
      // Count available beds
      const occupiedBedIds = new Set(
        overlappingBookings
          .filter(booking => booking.status === 'confirmed' || booking.status === 'checked_in')
          .map(booking => booking.bedId)
          .filter(bedId => bedId !== null)
      );
      
      const availableBeds = allBeds.filter(bed => 
        bed.status === 'available' && !occupiedBedIds.has(bed.id)
      );
      
      const available = availableBeds.length >= numberOfPersons;
      
      let result: AvailabilityResult = {
        available,
        totalBeds,
        availableBeds: availableBeds.length,
        occupiedBeds: totalBeds - availableBeds.length
      };
      
      if (!available) {
        // Suggest alternative dates
        result.suggestedDates = await this.findAlternativeDates(checkInDate, numberOfPersons);
        result.message = 'No beds available for the selected dates. Please consider the suggested alternative dates.';
      } else {
        result.message = `${availableBeds.length} bed(s) available for your stay.`;
      }
      
      return result;
    } catch (error) {
      throw new Error(`Availability check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private async findAlternativeDates(originalCheckIn: string, numberOfPersons: number): Promise<string[]> {
    const alternatives: string[] = [];
    const startDate = new Date(originalCheckIn);
    
    // Check next 14 days for availability
    for (let i = 1; i <= 14; i++) {
      const alternativeDate = new Date(startDate);
      alternativeDate.setDate(startDate.getDate() + i);
      
      const nextDay = new Date(alternativeDate);
      nextDay.setDate(alternativeDate.getDate() + 1);
      
      try {
        const availability = await this.checkAvailability(
          alternativeDate.toISOString().split('T')[0],
          nextDay.toISOString().split('T')[0],
          numberOfPersons
        );
        
        if (availability.available) {
          alternatives.push(alternativeDate.toISOString().split('T')[0]);
          if (alternatives.length >= 3) break; // Return max 3 alternatives
        }
      } catch (error) {
        // Skip this date if there's an error
        continue;
      }
    }
    
    return alternatives;
  }
}

export const availabilityService = new AvailabilityService();