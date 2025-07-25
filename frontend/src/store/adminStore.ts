import { create } from 'zustand'

interface AdminState {
  isLoading: boolean
  metrics: {
    occupancy: number
    occupied_beds: number
    total_beds: number
    revenue: number
  } | null
}

export const useAdminStore = create<AdminState>(() => ({
  isLoading: false,
  metrics: {
    occupancy: 75,
    occupied_beds: 18,
    total_beds: 24,
    revenue: 450
  }
}))