import { storage } from "../storage";

export interface AvailabilityResult {
  available: boolean;
  availableBeds: number;
  totalBeds: number;
  occupiedBeds: number;
  nextAvailableDate?: string;
  alternativeDates?: string[];
}

export class AvailabilityService {
  async checkAvailability(
    checkInDate: string,
    checkOutDate: string,
    numberOfPersons: number
  ): Promise<AvailabilityResult> {
    const availableBeds = await storage.getAvailableBeds(checkInDate, checkOutDate);
    const allBeds = await storage.getAllBeds();
    
    const totalBeds = allBeds.length;
    const availableCount = availableBeds.length;
    const occupiedCount = totalBeds - availableCount;
    
    const available = availableCount >= numberOfPersons;
    
    let nextAvailableDate: string | undefined;
    let alternativeDates: string[] = [];
    
    if (!available) {
      // Find next available date
      nextAvailableDate = await this.findNextAvailableDate(checkInDate, numberOfPersons);
      
      // Find alternative dates within the next 7 days
      alternativeDates = await this.findAlternativeDates(checkInDate, numberOfPersons, 7);
    }
    
    return {
      available,
      availableBeds: availableCount,
      totalBeds,
      occupiedBeds: occupiedCount,
      nextAvailableDate,
      alternativeDates
    };
  }

  private async findNextAvailableDate(startDate: string, numberOfPersons: number): Promise<string | undefined> {
    const startDateTime = new Date(startDate);
    
    // Check up to 30 days ahead
    for (let i = 1; i <= 30; i++) {
      const checkDate = new Date(startDateTime);
      checkDate.setDate(checkDate.getDate() + i);
      
      const checkDateStr = checkDate.toISOString().split('T')[0];
      const nextDay = new Date(checkDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      
      const availableBeds = await storage.getAvailableBeds(checkDateStr, nextDayStr);
      
      if (availableBeds.length >= numberOfPersons) {
        return checkDateStr;
      }
    }
    
    return undefined;
  }

  private async findAlternativeDates(startDate: string, numberOfPersons: number, daysToCheck: number): Promise<string[]> {
    const startDateTime = new Date(startDate);
    const alternatives: string[] = [];
    
    for (let i = 1; i <= daysToCheck; i++) {
      const checkDate = new Date(startDateTime);
      checkDate.setDate(checkDate.getDate() + i);
      
      const checkDateStr = checkDate.toISOString().split('T')[0];
      const nextDay = new Date(checkDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      
      const availableBeds = await storage.getAvailableBeds(checkDateStr, nextDayStr);
      
      if (availableBeds.length >= numberOfPersons) {
        alternatives.push(checkDateStr);
      }
    }
    
    return alternatives;
  }
}

export const availabilityService = new AvailabilityService();
