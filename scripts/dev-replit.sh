#!/bin/bash

# Development server for Replit WASM microservices architecture
echo "🦀 Starting Rust WASM Microservices Development Server"
echo "📦 Frontend + WASM backend services architecture"
echo "✅ Legacy backend/ folder completely removed"
echo "🔧 All microservices under services/ with DDD structure"

# Set port as specified in configuration
export PORT=5173

# Check if WASM services are built
if [ ! -d "services/validation-service/target" ]; then
    echo "⚠️  WASM services not built. Building now..."
    bash scripts/build-wasm.sh
fi

# Start the development server
echo "🚀 Starting server on port $PORT..."
exec npm run dev