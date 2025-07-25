#!/bin/bash

# Development server for Replit WASM microservices architecture
echo "🦀 Starting Rust WASM Microservices Development Server"
echo "📦 Frontend-only server with WASM backend services"
echo "✅ Legacy backend/ folder completely removed"
echo "🔧 All microservices under services/ with DDD structure"

# Set port to 80 as specified in configuration
export PORT=80

# Start the development server
exec tsx server/index.ts