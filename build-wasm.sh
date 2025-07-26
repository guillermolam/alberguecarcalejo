#!/bin/bash

# Build script for Rust WASM microservices
echo "🔨 Building Rust WASM microservices..."

# Install wasm32-wasi target if not already installed
echo "📦 Installing wasm32-wasi target..."
rustup target add wasm32-wasi 2>/dev/null || echo "Target already installed"

# Build each service
services=(
  "services/reviews-service"
  "gateway/bff/security_service" 
  "gateway/bff/rate_limiter_service"
  "gateway/bff/auth_verify"
  "gateway/bff/booking_service"
)

for service in "${services[@]}"; do
  if [ -d "$service" ]; then
    echo "🔨 Building $service..."
    cd "$service"
    cargo build --release --target wasm32-wasi
    if [ $? -eq 0 ]; then
      echo "✅ $service built successfully"
    else
      echo "❌ Failed to build $service"
    fi
    cd - > /dev/null
  else
    echo "⚠️  Directory $service not found"
  fi
done

echo "🎉 WASM build process completed!"