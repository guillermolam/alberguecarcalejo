import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8002;

app.use(cors());
app.use(express.json());

// Mock booking data
const bookingData = {
  dashboard: {
    stats: {
      totalBeds: 24,
      occupiedBeds: 15,
      availableBeds: 9,
      totalRevenue: 450,
      averageRating: 4.6,
      dormitories: [
        { name: "Dormitorio 1", beds: 8, occupied: 5, available: 3 },
        { name: "Dormitorio 2", beds: 8, occupied: 6, available: 2 },
        { name: "Dormitorio 3", beds: 8, occupied: 4, available: 4 }
      ]
    }
  },
  pricing: {
    dormitory: 15,
    currency: "EUR",
    lastUpdated: "2024-03-20"
  }
};

// Booking endpoints
app.get('/dashboard/stats', (req, res) => {
  console.log('📊 Booking service: /dashboard/stats called');
  res.json(bookingData.dashboard.stats);
});

app.get('/pricing', (req, res) => {
  console.log('💰 Booking service: /pricing called');
  res.json(bookingData.pricing);
});

app.get('/health', (req, res) => {
  res.json({ service: 'booking-service', status: 'ok', port: PORT });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`📋 Booking service running on port ${PORT}`);
});