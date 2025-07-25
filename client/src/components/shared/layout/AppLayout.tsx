import React, { ReactNode } from 'react';
import { useGlobalStore, useNotifications } from '@/store/globalStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  showHeader = true,
  showFooter = true,
  className = '',
}) => {
  const isLoading = useGlobalStore((state) => state.isLoading);
  const loadingMessage = useGlobalStore((state) => state.loadingMessage);
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-900 dark:text-gray-100">
                {loadingMessage || 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {showHeader && (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <img 
                  src="https://le-de.cdn-website.com/4e684d9f728943a6941686bc89abe581/dms3rep/multi/opt/logoalbergue__msi___jpeg-1920w.jpeg"
                  alt="Albergue Del Carrascalejo"
                  className="h-10 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Albergue Del Carrascalejo
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Theme toggle, language selector, etc. can be added here */}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Notification Toast Container */}
      <div className="fixed top-4 right-4 z-40 space-y-2">
        {notifications.map((notification) => (
          <Alert
            key={notification.id}
            className={`max-w-md shadow-lg border-l-4 ${
              notification.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
              notification.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
              notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
              'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm">
                  {notification.title}
                </h4>
                <AlertDescription className="text-sm mt-1">
                  {notification.message}
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2"
                onClick={() => removeNotification(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        ))}
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>© 2025 Albergue Del Carrascalejo - Camino de Santiago</p>
              <p className="mt-1">
                Developed with Rust WASM microservices architecture
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};