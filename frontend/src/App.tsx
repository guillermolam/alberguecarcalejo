import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import HomePage from "./pages/HomePage";
import InfoCardsPage from "./pages/InfoCardsPage";
import BookingPage from "./pages/BookingPage";
import AdminPage from "./pages/AdminPage";
import { Toaster } from "./components/ui/toaster";
import Navigation from "./components/Navigation";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/info" component={InfoCardsPage} />
            <Route path="/booking" component={BookingPage} />
            <Route path="/admin" component={AdminPage} />
            <Route>
              <div className="text-center py-20">
                <h1 className="text-2xl font-bold mb-4">Página no encontrada</h1>
                <p className="text-muted-foreground">La página que buscas no existe.</p>
              </div>
            </Route>
          </Switch>
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;