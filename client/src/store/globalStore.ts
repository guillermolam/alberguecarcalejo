import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Global application state
interface GlobalState {
  // Language and internationalization
  language: string;
  setLanguage: (language: string) => void;
  
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // User session
  isAuthenticated: boolean;
  userRole: 'guest' | 'admin' | 'owner';
  setAuthentication: (isAuth: boolean, role?: string) => void;
  
  // Navigation
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Loading states
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (isLoading: boolean, message?: string) => void;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  autoHide?: boolean;
}

export const useGlobalStore = create<GlobalState>()(
  devtools(
    persist(
      (set, get) => ({
        // Language state
        language: 'es',
        setLanguage: (language: string) => {
          set({ language });
          // Update document lang attribute for accessibility
          if (typeof document !== 'undefined') {
            document.documentElement.lang = language;
          }
        },
        
        // Theme state
        theme: 'light',
        toggleTheme: () => {
          const newTheme = get().theme === 'light' ? 'dark' : 'light';
          set({ theme: newTheme });
          // Update CSS class for theme switching
          if (typeof document !== 'undefined') {
            document.documentElement.className = newTheme;
          }
        },
        
        // Authentication state
        isAuthenticated: false,
        userRole: 'guest',
        setAuthentication: (isAuth: boolean, role = 'guest') => {
          set({ 
            isAuthenticated: isAuth, 
            userRole: role as 'guest' | 'admin' | 'owner'
          });
        },
        
        // Navigation state
        currentRoute: '/',
        setCurrentRoute: (route: string) => set({ currentRoute: route }),
        
        // Notifications state
        notifications: [],
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
          };
          
          set((state) => ({
            notifications: [...state.notifications, newNotification]
          }));
          
          // Auto-hide notification after 5 seconds if autoHide is true
          if (notification.autoHide !== false) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, 5000);
          }
        },
        removeNotification: (id: string) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }));
        },
        clearNotifications: () => set({ notifications: [] }),
        
        // Loading state
        isLoading: false,
        loadingMessage: '',
        setLoading: (isLoading: boolean, message = '') => {
          set({ isLoading, loadingMessage: message });
        },
      }),
      {
        name: 'albergue-global-store',
        partialize: (state) => ({
          language: state.language,
          theme: state.theme,
          isAuthenticated: state.isAuthenticated,
          userRole: state.userRole,
        }),
      }
    ),
    { name: 'GlobalStore' }
  )
);

// Convenience hooks for specific parts of the store
export const useLanguage = () => {
  const language = useGlobalStore((state) => state.language);
  const setLanguage = useGlobalStore((state) => state.setLanguage);
  return { language, setLanguage };
};

export const useTheme = () => {
  const theme = useGlobalStore((state) => state.theme);
  const toggleTheme = useGlobalStore((state) => state.toggleTheme);
  return { theme, toggleTheme };
};

export const useAuth = () => {
  const isAuthenticated = useGlobalStore((state) => state.isAuthenticated);
  const userRole = useGlobalStore((state) => state.userRole);
  const setAuthentication = useGlobalStore((state) => state.setAuthentication);
  return { isAuthenticated, userRole, setAuthentication };
};

export const useNotifications = () => {
  const notifications = useGlobalStore((state) => state.notifications);
  const addNotification = useGlobalStore((state) => state.addNotification);
  const removeNotification = useGlobalStore((state) => state.removeNotification);
  const clearNotifications = useGlobalStore((state) => state.clearNotifications);
  return { notifications, addNotification, removeNotification, clearNotifications };
};

export const useLoading = () => {
  const isLoading = useGlobalStore((state) => state.isLoading);
  const loadingMessage = useGlobalStore((state) => state.loadingMessage);
  const setLoading = useGlobalStore((state) => state.setLoading);
  return { isLoading, loadingMessage, setLoading };
};