
#!/bin/bash

# Fast development startup with Bun
set -e

echo "⚡ Starting fast development with Bun..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing dependencies with Bun..."
  cd frontend && bun install && cd ..
fi

# Build WASM services in parallel if needed
if [ ! -f "services/booking-service/target/wasm32-wasi/release/booking_service.wasm" ]; then
  echo "🦀 Building WASM services..."
  ./scripts/build-wasm.sh &
fi

# Start development server
echo "🚀 Starting Vite dev server with Bun..."
cd frontend && bun run dev
