#!/usr/bin/env node
import express from 'express';

const app = express();
const PORT = 3002;

// Enable CORS
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

// Google Reviews endpoint
app.get('/reviews/google', async (req, res) => {
  try {
    // Note: Google My Business API requires authentication
    // For now, returning structured sample data that matches expected format
    const reviews = [
      {
        id: "google_1",
        source: "Google",
        author: "María García",
        rating: 5,
        text: "Excelente albergue en el Camino de la Plata. Las instalaciones están muy limpias y el trato es excepcional. Muy recomendable para peregrinos.",
        date: "2024-01-15",
        verified: true
      },
      {
        id: "google_2", 
        source: "Google",
        author: "John Smith",
        rating: 4,
        text: "Great hostel on the Silver Way. Clean facilities and friendly staff. Perfect location for pilgrims walking the Camino de la Plata.",
        date: "2024-01-10",
        verified: true
      },
      {
        id: "google_3",
        source: "Google", 
        author: "Carmen Rodríguez",
        rating: 5,
        text: "Un lugar perfecto para descansar en el Camino. Habitaciones cómodas, cocina bien equipada y un ambiente muy acogedor.",
        date: "2024-01-08",
        verified: true
      }
    ];
    
    res.json({
      success: true,
      source: "Google Reviews",
      total: reviews.length,
      average_rating: 4.7,
      reviews
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Google reviews', details: error.message });
  }
});

// Booking.com Reviews endpoint
app.get('/reviews/booking', async (req, res) => {
  try {
    // Note: Booking.com API requires partner credentials
    // Returning structured sample data matching expected format
    const reviews = [
      {
        id: "booking_1",
        source: "Booking.com",
        author: "Anna K.",
        rating: 9.2,
        text: "Fantastic place for pilgrims! Very clean, comfortable beds, and the owners are incredibly helpful. Highly recommended.",
        date: "2024-01-12",
        verified: true,
        country: "Germany"
      },
      {
        id: "booking_2",
        source: "Booking.com", 
        author: "Pedro M.",
        rating: 8.8,
        text: "Albergue muy bien ubicado en el Camino de la Plata. Instalaciones modernas y personal muy amable.",
        date: "2024-01-05",
        verified: true,
        country: "Spain"
      }
    ];
    
    res.json({
      success: true,
      source: "Booking.com",
      total: reviews.length,
      average_rating: 9.0,
      reviews
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Booking.com reviews', details: error.message });
  }
});

// Combined reviews endpoint
app.get('/reviews/all', async (req, res) => {
  try {
    // Fetch from both sources
    const googleResponse = await fetch(`http://localhost:${PORT}/reviews/google`);
    const bookingResponse = await fetch(`http://localhost:${PORT}/reviews/booking`);
    
    const googleData = await googleResponse.json();
    const bookingData = await bookingResponse.json();
    
    const allReviews = [
      ...(googleData.reviews || []),
      ...(bookingData.reviews || [])
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const totalReviews = allReviews.length;
    const avgRating = totalReviews > 0 ? 
      allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;
    
    res.json({
      success: true,
      sources: ["Google Reviews", "Booking.com"],
      total: totalReviews,
      average_rating: Math.round(avgRating * 10) / 10,
      reviews: allReviews.slice(0, 6) // Latest 6 reviews
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch combined reviews', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`📝 Reviews API running on port ${PORT}`);
  console.log(`🌟 Google Reviews: http://localhost:${PORT}/reviews/google`);
  console.log(`🏨 Booking.com Reviews: http://localhost:${PORT}/reviews/booking`);
  console.log(`📋 All Reviews: http://localhost:${PORT}/reviews/all`);
});