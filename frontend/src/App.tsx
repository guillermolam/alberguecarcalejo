import { Router, Route } from 'wouter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BookingPage } from './pages/BookingPage'
import { AdminDashboard } from './pages/AdminDashboard'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Route path="/" component={BookingPage} />
        <Route path="/admin" component={AdminDashboard} />
      </Router>
    </QueryClientProvider>
  )
}

export default App