import { create } from 'zustand';

interface BookingData {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  documentType: string;
  documentNumber: string;
  checkIn: string;
  checkOut: string;
  bedType: string;
}

interface BookingStore {
  isLoading: boolean;
  error: string | null;
  currentBooking: BookingData | null;
  createBooking: (data: BookingData) => Promise<void>;
  checkAvailability: (checkIn: string, checkOut: string, bedType: string) => Promise<boolean>;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  isLoading: false,
  error: null,
  currentBooking: null,

  createBooking: async (data: BookingData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation
      if (!data.name || !data.email || !data.checkIn || !data.checkOut) {
        throw new Error('Campos requeridos faltantes');
      }

      // Simulate successful booking creation
      console.log('Booking created:', data);
      
      set({ 
        currentBooking: data, 
        isLoading: false,
        error: null 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error creating booking',
        isLoading: false 
      });
      throw error;
    }
  },

  checkAvailability: async (checkIn: string, checkOut: string, bedType: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock availability check - always return true for demo
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error checking availability',
        isLoading: false 
      });
      return false;
    }
  },

  clearBooking: () => {
    set({ currentBooking: null, error: null });
  },
}));