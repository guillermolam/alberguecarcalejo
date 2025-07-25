#!/bin/bash

echo "🦀 Starting Rust WASM Microservices Architecture"
echo "📦 Frontend-only server with WASM backend services"
echo "✅ Legacy backend/ folder completely removed"
echo "🔧 All microservices now under services/ with DDD structure"

# Set port to 80 as specified in the configuration
export PORT=80

# Start the development server
tsx server/index.ts