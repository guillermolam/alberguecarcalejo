#!/bin/bash

# Deployment script for Albergue Del Carrascalejo Gateway
echo "🚀 Deploying Albergue Del Carrascalejo to Fermyon Spin Cloud..."

# Build frontend assets
echo "📦 Building frontend assets..."
cd ../frontend
npm run build
cd ../gateway

# Build WASM services
echo "🔨 Building WASM services..."
../build-wasm.sh

# Deploy to Fermyon Spin Cloud
echo "☁️  Deploying to alberguecarrascalejo.fermyon.app..."
spin deploy --environment production --confirm

echo "✅ Deployment completed!"
echo "🌐 App available at: https://alberguecarrascalejo.fermyon.app"