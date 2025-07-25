import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/contexts/i18n-context";
import { AppLayout } from "@/components/shared/layout/AppLayout";
import Home from "@/customer";
import Admin from "@/admin";
import NotFound from "@/pages/not-found";
import TestWASM from "@/pages/test-wasm";
import { useEffect } from "react";
import { useGlobalStore } from "@/store/globalStore";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/test-wasm" component={TestWASM} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const setCurrentRoute = useGlobalStore((state) => state.setCurrentRoute);
  
  useEffect(() => {
    // WASM services will be initialized when needed
    console.log('🦀 Rust WASM microservices architecture loaded');
    
    // Track route changes for analytics/state management
    const handleRouteChange = () => {
      setCurrentRoute(window.location.pathname);
    };
    
    handleRouteChange(); // Set initial route
    window.addEventListener('popstate', handleRouteChange);
    
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [setCurrentRoute]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <AppLayout>
            <Toaster />
            <Router />
          </AppLayout>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
