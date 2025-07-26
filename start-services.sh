#!/bin/bash

echo "🚀 Starting microservices on ports 8000-8010..."

# Kill existing services
pkill -f "node.*service"

# Start microservices
echo "⭐ Starting Reviews Service on port 8001..."
cd services/reviews-service && node index.js > ../../logs/reviews.log 2>&1 &

echo "📋 Starting Booking Service on port 8002..."
cd ../booking-service && node index.js > ../../logs/booking.log 2>&1 &

echo "🔐 Starting Auth Service on port 8003..."
cd ../auth-service && node index.js > ../../logs/auth.log 2>&1 &

echo "🚀 Starting Gateway on port 8000..."
cd ../gateway-service && node index.js > ../../logs/gateway.log 2>&1 &

cd ../..

# Create logs directory
mkdir -p logs

echo "✅ All services started!"
echo "🔗 Gateway: http://localhost:8000"
echo "⭐ Reviews: http://localhost:8001"
echo "📋 Booking: http://localhost:8002"
echo "🔐 Auth: http://localhost:8003"

# Wait and test services
sleep 3
echo "🧪 Testing services..."
curl -s http://localhost:8000/api/health | jq . || echo "Gateway not responding"
curl -s http://localhost:8001/health | jq . || echo "Reviews not responding"
curl -s http://localhost:8002/health | jq . || echo "Booking not responding"
curl -s http://localhost:8003/health | jq . || echo "Auth not responding"