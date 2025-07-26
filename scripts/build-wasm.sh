#!/bin/bash
set -e

echo "Building WASM services..."

# Build gateway BFF component
echo "Building gateway BFF..."
cd gateway/bff
cargo build --target wasm32-wasi --release
cd ../..

# Build individual services
echo "Building booking service..."
if [ -d "services/booking-service" ]; then
    cd services/booking-service
    cargo build --target wasm32-wasi --release
    cd ../..
fi

echo "Building reviews service..."
if [ -d "services/reviews-service" ]; then
    cd services/reviews-service
    cargo build --target wasm32-wasi --release
    cd ../..
fi

echo "Building backend services..."
if [ -d "backend" ]; then
    cd backend
    # Build all backend services
    for service in */; do
        if [ -f "$service/Cargo.toml" ]; then
            echo "Building $service..."
            cd "$service"
            cargo build --target wasm32-wasi --release
            cd ..
        fi
    done
    cd ..
fi

echo "WASM build complete!"