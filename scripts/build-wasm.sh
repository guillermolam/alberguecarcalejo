#!/bin/bash

# Build all WASM microservices for the DDD monorepo with Bun
set -e

echo "🦀 Building Rust WASM microservices with Bun support..."

# Ensure WASM targets are installed
rustup target add wasm32-unknown-unknown
rustup target add wasm32-wasi

# Install bun dependencies if needed
if command -v bun &> /dev/null; then
  echo "📦 Installing frontend dependencies with Bun..."
  cd frontend && bun install && cd ..
fi

# Build all services in workspace from root directory
echo "📦 Building validation-service..."
cargo build --release --target wasm32-wasi --package validation-service

echo "📦 Building booking-service..."
cargo build --release --target wasm32-wasi --package booking-service

echo "📦 Building gateway..."
cargo build --release --target wasm32-wasi --package gateway

echo "✅ All WASM services built successfully!"
echo "🎯 Output location: services/*/target/wasm32-wasi/release/"
echo "📁 Gateway output: gateway/target/wasm32-wasi/release/"

# Ensure spin.toml can find the WASM files
echo "🔧 Verifying WASM outputs for Spin deployment..."
ls -la services/*/target/wasm32-wasi/release/*.wasm 2>/dev/null || echo "⚠️  Some service WASM files may be missing"
ls -la gateway/target/wasm32-wasi/release/*.wasm 2>/dev/null || echo "⚠️  Gateway WASM file may be missing"

echo "🚀 Ready for Spin deployment: spin up --listen 0.0.0.0:80"