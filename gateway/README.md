# Gateway Service

The API Gateway for the Albergue del Carrascalejo hostel management system, built with Fermyon Spin and Rust.

## Architecture

This gateway serves as the single entry point for all client requests, providing:

- **Authentication & Authorization**: JWT token validation and role-based access control
- **Request Routing**: Intelligent routing to appropriate microservices
- **Static File Serving**: Frontend asset delivery (development mode)
- **Health Monitoring**: System health checks and monitoring endpoints
- **Rate Limiting**: Request throttling and abuse prevention

## API Routes

### Public Routes
- `GET /health` - Health check endpoint
- `GET /` - Frontend application (index.html)
- `GET /assets/*` - Static assets (CSS, JS, images)

### Authenticated Routes
- `POST /api/bookings` → `booking-service`
- `POST /api/validate` → `validation-service`
- `GET /api/countries` → `country-service`
- `POST /api/security/*` → `security-service`

### Admin Routes (requires admin role)
- `GET /admin/*` → `booking-service` (admin context)
- `PATCH /admin/bookings/*` → `booking-service`
- `POST /admin/payments/*` → `booking-service`

## Development

### Prerequisites
- Rust 1.75+
- `wasm32-wasi` target: `rustup target add wasm32-wasi`
- Spin CLI: `curl -fsSL https://developer.fermyon.com/downloads/install.sh | bash`

### Building
```bash
# Build the gateway WASM component
cargo build --target wasm32-wasi --release

# Build and run with Spin
spin build
spin up --listen 0.0.0.0:8000
```

### Testing
```bash
# Run unit tests
cargo test

# Integration tests with running services
cargo test --test gateway_integration
```

### Environment Variables
- `JWT_SECRET` - Secret key for JWT token validation (default: "dev-secret-key")
- `RUST_LOG` - Log level (default: "info")

## Production Deployment

The gateway is deployed as a Spin application to Fermyon Cloud:

```bash
# Deploy to production
spin build --up
spin deploy
```

## Security

- All API routes require valid JWT authentication
- Admin routes require additional role validation
- Request/response logging for audit trails
- Rate limiting to prevent abuse
- CORS headers for browser security

## Monitoring

Health check endpoint provides service status:
```bash
curl http://gateway-url/health
```

Response includes:
- Service status and version
- Component health status
- System timestamp
- Performance metrics