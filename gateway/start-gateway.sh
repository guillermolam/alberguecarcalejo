#!/bin/bash

# Start standalone Spin gateway 
echo "🚀 Starting standalone Spin Gateway..."

# Build the BFF WASM component
echo "🔧 Building BFF WASM component..."
cd bff
cargo build --release --target wasm32-wasi
cd ..

# Start Spin gateway on port 8000
echo "🌟 Starting Spin gateway on port 8000..."
spin up --listen 0.0.0.0:8000