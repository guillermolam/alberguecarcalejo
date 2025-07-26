
# Albergue Management System - Spin WASM Architecture

A modern hostel management system built with **Fermyon Spin** framework, using Rust WASM microservices and React frontend.

## 🏗️ Architecture

- **Backend**: 100% Rust WASM microservices running on Fermyon Spin
- **Frontend**: React with Vite (static file serving only)
- **Database**: PostgreSQL with migrations
- **Gateway**: Spin BFF (Backend for Frontend) pattern

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Rust with `wasm32-unknown-unknown` target
- Spin CLI (`spin` command)
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install Spin CLI
curl -fsSL https://developer.fermyon.com/downloads/install.sh | bash

# Build WASM services
npm run build:wasm

# Start Spin gateway (serves all backend APIs)
spin up --listen 0.0.0.0:8000

# In another terminal, start frontend dev server
npm run dev:frontend
```

### Environment Variables

Copy `.env.spin.example` to `.env.spin` and configure:

```bash
NEON_DATABASE_URL=postgresql://...
VITE_LAMBDA_OCR_URL=https://...
VITE_GOOGLE_PLACES_API_KEY=...
```

## 🦀 Spin Services

All backend logic runs as Rust WASM components in Spin:

- **Gateway BFF** (`gateway/bff/`) - Request routing and authentication
- **Booking Service** (`services/booking-service/`) - Reservation management
- **Reviews Service** (`services/reviews-service/`) - Customer reviews
- **Security Service** (`services/security-service/`) - Rate limiting & security
- **Validation Service** (`services/validation-service/`) - Document validation

## 🔧 Development

### Build WASM Services
```bash
./scripts/build-wasm.sh
```

### Start Development
```bash
# Start Spin gateway (port 8000)
spin up --listen 0.0.0.0:8000

# Start frontend dev server (port 5173)
npm run dev:frontend
```

### Database Migrations
```bash
# Run migrations
sqlx migrate run --database-url $NEON_DATABASE_URL
```

## 📦 Project Structure

```
├── gateway/                 # Spin gateway configuration
│   ├── spin.toml           # Spin app manifest
│   └── bff/                # Gateway BFF service
├── services/               # Rust WASM microservices
│   ├── booking-service/
│   ├── reviews-service/
│   ├── security-service/
│   └── validation-service/
├── frontend/               # React frontend (Vite)
│   ├── src/
│   └── server/            # Vite dev server config
└── database/              # SQL migrations
```

## 🚫 No Express.js

This project uses **Fermyon Spin** framework exclusively. All backend logic runs as Rust WASM components. Express.js is not used anywhere in the architecture.

- ✅ Spin WASM services for all APIs
- ✅ Vite dev server for frontend static files
- ❌ No Express.js servers
- ❌ No Node.js backend services

## 🌐 API Endpoints

All APIs are served by Spin WASM services on port 8000:

- `GET /api/booking/dashboard/stats` - Dashboard statistics
- `GET /api/booking/pricing` - Room pricing
- `GET /api/reviews/all` - Customer reviews
- `POST /api/security/validate` - Document validation

## 🔒 Security

- Rate limiting via Rust WASM service
- Input validation in WASM components
- CORS handled by Spin gateway
- No server-side session state

## 📝 Testing

```bash
# Unit tests
cargo test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## 🚀 Deployment

Deploy to Fermyon Cloud:

```bash
# Login to Fermyon Cloud
spin login

# Deploy
spin deploy
```

Or deploy to Replit using the Spin runtime.
