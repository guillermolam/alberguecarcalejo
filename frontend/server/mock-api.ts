// Mock API endpoints for development when WASM services aren't running
import express from 'express';

const router = express.Router();

// Dashboard stats endpoint
router.get('/booking/dashboard/stats', (req, res) => {
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

// Pricing endpoint
router.get('/booking/pricing', (req, res) => {
  res.json({
    dormitory: 15,
    private_room: 35
  });
});

// Booking endpoints
router.get('/booking/bookings', (req, res) => {
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

export default router;