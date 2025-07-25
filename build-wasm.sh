#!/bin/bash

# Build WASM services for Rust microservices architecture
set -e

echo "🦀 Building Rust WASM microservices..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Navigate to services directory
cd backend/services

# Build each service as WASM
echo "📦 Building database service..."
cd database
wasm-pack build --target web --out-dir ../../pkg/database
cd ..

echo "📦 Building validation service..."
cd validation  
wasm-pack build --target web --out-dir ../../pkg/validation
cd ..

echo "📦 Building country service..."
cd country
wasm-pack build --target web --out-dir ../../pkg/country
cd ..

echo "📦 Building security service..."
cd security
wasm-pack build --target web --out-dir ../../pkg/security
cd ..

echo "📦 Building OCR service..."
cd ocr
wasm-pack build --target web --out-dir ../../pkg/ocr
cd ..

# Create unified package
echo "🔧 Creating unified WASM package..."
mkdir -p pkg

# Copy all generated files to unified package
cp -r ../pkg/*/pkg/* pkg/ 2>/dev/null || true

echo "✅ WASM services build completed!"
echo "📁 Output: backend/services/pkg/"

cd ../..

echo "🚀 Ready to deploy Rust WASM microservices architecture"