import React from 'react'
import { Router, Route, Switch } from 'wouter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './App.css'

// Import components
import HomePage from './pages/HomePage'
import InfoCardsPage from './pages/InfoCardsPage'
import BookingPage from './pages/BookingPage'
import AdminPage from './pages/AdminPage'

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
          <main className="container mx-auto px-4 py-8">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/info" component={InfoCardsPage} />
              <Route path="/booking" component={BookingPage} />
              <Route path="/admin" component={AdminPage} />
              <Route>
                <div className="text-center py-20">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    Página no encontrada
                  </h1>
                  <p className="text-gray-600">
                    La página que buscas no existe.
                  </p>
                  <a 
                    href="/" 
                    className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Volver al inicio
                  </a>
                </div>
              </Route>
            </Switch>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App