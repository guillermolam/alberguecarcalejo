# Albergue Management System

A sophisticated hostel management system leveraging Domain-Driven Design with Rust WASM microservices, focusing on robust document processing and internationalization.

## Architecture

- **Frontend**: React SPA with TypeScript and Vite
- **Backend**: Rust WASM microservices with hexagonal architecture
- **Gateway**: Spin JS component for routing and Auth0 JWT validation
- **Database**: NeonDB (serverless Postgres)
- **State Management**: Zustand for global state
- **Styling**: Tailwind CSS with responsive design

## Quick Start

```bash
# Install dependencies
npm install

# Build WASM services
./build-wasm.sh

# Start development server
spin up --listen 0.0.0.0:80
```

## Project Structure

```
├── frontend/           # React SPA application
├── services/          # Rust WASM microservices
├── gateway/           # Spin JS gateway component
├── shared/            # Common DTOs and types
├── database/          # Migration files
├── tests/             # Test suites and documentation
├── scripts/           # Build and deployment scripts
└── .github/           # CI/CD workflows
```

## Services

- **validation-service**: Document processing and OCR
- **booking-service**: Reservation management
- **country-service**: Country and nationality data
- **security-service**: Authentication and authorization
- **rate-limiter-service**: API rate limiting

For detailed architecture information, see `replit.md`.