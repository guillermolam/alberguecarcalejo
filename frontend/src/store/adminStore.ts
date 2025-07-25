import { create } from 'zustand';

interface AdminMetrics {
  occupancy: number;
  occupied_beds: number;
  total_beds: number;
  monthly_revenue: number;
  revenue_growth: number;
  checkins_today: number;
  pending_checkins: number;
  active_pilgrims: number;
  nationalities: number;
}

interface AdminStore {
  metrics: AdminMetrics | null;
  isLoading: boolean;
  error: string | null;
  fetchMetrics: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  metrics: null,
  isLoading: false,
  error: null,

  fetchMetrics: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMetrics: AdminMetrics = {
        occupancy: 75,
        occupied_beds: 18,
        total_beds: 24,
        monthly_revenue: 2450,
        revenue_growth: 12,
        checkins_today: 5,
        pending_checkins: 2,
        active_pilgrims: 18,
        nationalities: 8,
      };

      set({ metrics: mockMetrics, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error fetching metrics',
        isLoading: false 
      });
    }
  },

  refreshMetrics: async () => {
    const { fetchMetrics } = get();
    await fetchMetrics();
  },
}));

// Initialize metrics on store creation
useAdminStore.getState().fetchMetrics();