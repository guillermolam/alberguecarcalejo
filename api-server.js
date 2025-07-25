#!/usr/bin/env node
import express from 'express';

const app = express();
const PORT = 3001;

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(express.json());

// Booking service endpoints with real data from backend service structure
app.get('/booking/dashboard/stats', (req, res) => {
  res.json({
    occupancy: {
      available: 24,
      occupied: 8,
      total: 32
    },
    today_bookings: 3,
    revenue: 4500
  });
});

app.get('/booking/pricing', (req, res) => {
  res.json({
    dormitory: 15,
    private_room: 35
  });
});

app.get('/booking/bookings', (req, res) => {
  res.json([
    {
      id: "1",
      guest_name: "Juan Pérez",
      guest_email: "juan@example.com",
      guest_phone: "+34666123456",
      room_type: "dorm-a",
      check_in: "2024-01-15",
      check_out: "2024-01-16",
      num_guests: 1,
      total_price: 1500,
      status: "confirmed",
      payment_status: "paid"
    }
  ]);
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Dashboard stats: http://localhost:${PORT}/booking/dashboard/stats`);
  console.log(`💰 Pricing data: http://localhost:${PORT}/booking/pricing`);
});