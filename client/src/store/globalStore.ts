import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface GlobalState {
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
}

export const useGlobalStore = create<GlobalState>()(
  devtools(
    (set) => ({
      currentRoute: '/',
      setCurrentRoute: (route) => set({ currentRoute: route }),
    }),
    {
      name: 'global-store',
    }
  )
);