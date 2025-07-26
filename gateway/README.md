# Gateway - BFF (Backend for Frontend) Architecture

This gateway implements a microservices-based BFF pattern using Rust WASM components and Caddy for static file serving.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │   Caddy Proxy    │    │   Rust Microservices │
│   (Static)      │◄──►│   (:80)          │◄──►│   (WASM Components)  │
│                 │    │                  │    │                     │
│   React + Vite  │    │   /api/security  │    │   security-service  │
│   Tailwind CSS  │    │   /api/auth      │    │   auth-verify       │
│   TypeScript    │    │   /api/booking   │    │   booking-service   │
└─────────────────┘    │   /api/reviews   │    │   reviews-service   │
                       │   /api/rate-limit│    │   rate-limiter      │
                       └──────────────────┘    └─────────────────────┘
```

## Components

### 1. Security Service (`/api/security/*`)
- JWT token validation
- Auth0 integration
- User authentication state management

### 2. Rate Limiter Service (`/api/rate-limit/*`)
- Request rate limiting
- IP-based throttling
- Per-endpoint rate limits

### 3. Auth Verify Service (`/api/auth/*`)
- Auth0 login/logout/callback handling
- Token exchange
- Session management

### 4. Booking Service (`/api/booking/*`) 
- Hostel booking management
- Bed availability
- Pricing information
- Dashboard statistics

### 5. Reviews Service (`/api/reviews/*`)
- Google Reviews integration
- Booking.com reviews
- Review aggregation and statistics

## Configuration

### Spin Variables (spin.toml)
```toml
[variables]
auth0_domain = { required = true }
auth0_client_id = { required = true }
auth0_client_secret = { required = true }
```

### Environment Variables
```bash
SPIN_VARIABLE_AUTH0_DOMAIN=guillermolam.auth0.com
SPIN_VARIABLE_AUTH0_CLIENT_ID=ohunbmaWBOQyEd2ca1orhnFqN1DDPQBd
SPIN_VARIABLE_AUTH0_CLIENT_SECRET=<secret>
```

## Development

### Build All Services
```bash
# Build all Rust WASM components
cd gateway
spin build

# Start with Caddy proxy
caddy run --config Caddyfile
```

### Individual Service Development
```bash
# Build specific service
cd gateway/bff/security_service
cargo build --release --target wasm32-wasi

# Test individual component
spin up --component security-service
```

## Deployment

The gateway is designed for deployment to alberguecarrascalejo.fermyon.app via Fermyon Spin Cloud:

```bash
# Deploy to Fermyon Cloud
spin deploy --environment production
```

## Static File Serving

Caddy serves the React frontend from `frontend/dist/` and proxies API requests to the appropriate Rust microservices.

### Routes
- `/` → Static files (React SPA)
- `/api/security/*` → Security Service
- `/api/auth/*` → Auth Verify Service  
- `/api/booking/*` → Booking Service
- `/api/reviews/*` → Reviews Service
- `/api/rate-limit/*` → Rate Limiter Service

## Auth0 Integration

All services use Auth0 for authentication with the following configuration:
- Domain: guillermolam.auth0.com
- Application Type: Single Page Application
- Allowed URLs: https://alberguecarrascalejo.fermyon.app/*