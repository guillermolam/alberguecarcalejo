import { create } from 'zustand'

interface BookingState {
  isLoading: boolean
  createBooking: (data: any) => Promise<void>
  checkAvailability: (dates: { checkIn: Date; checkOut: Date }) => Promise<boolean>
}

export const useBookingStore = create<BookingState>((set) => ({
  isLoading: false,
  createBooking: async (data) => {
    set({ isLoading: true })
    try {
      // TODO: Implement with WASM booking service
      console.log('Creating booking:', data)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
    } finally {
      set({ isLoading: false })
    }
  },
  checkAvailability: async (dates) => {
    set({ isLoading: true })
    try {
      // TODO: Implement with WASM booking service
      console.log('Checking availability:', dates)
      await new Promise(resolve => setTimeout(resolve, 500)) // Mock delay
      return true // Mock response
    } finally {
      set({ isLoading: false })
    }
  }
}))