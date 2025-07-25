import React from 'react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn('min-h-screen bg-background text-foreground', className)}>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};