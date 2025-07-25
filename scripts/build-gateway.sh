#!/bin/bash
set -e

echo "🔨 Building Gateway and All Services..."

# Ensure wasm32-wasi target is installed
rustup target add wasm32-wasi

# Build all workspace members
echo "Building workspace..."
cargo build --workspace --target wasm32-wasi --release

# Build the gateway specifically
echo "Building gateway component..."
cd gateway
cargo build --target wasm32-wasi --release
cd ..

# Run Spin build to prepare deployment
if command -v spin &> /dev/null; then
    echo "Building Spin application..."
    cd gateway
    spin build
    cd ..
    echo "✅ Gateway and services built successfully!"
else
    echo "⚠️  Spin CLI not found. Install with: curl -fsSL https://developer.fermyon.com/downloads/install.sh | bash"
    echo "✅ WASM binaries built successfully!"
fi