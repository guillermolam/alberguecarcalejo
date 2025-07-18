# Albergue Rust WASM Backend

This directory contains the secure Rust WASM backend services that provide zero-cost, globally-distributed deployment via Cloudflare Workers.

## Architecture

### Services
- **Database Service**: Secure PostgreSQL operations with input validation
- **Validation Service**: Document, email, and phone validation with rate limiting  
- **Country Service**: RESTCountries API integration with caching
- **Security Service**: Admin authentication with SHA-256 hashing
- **Rate Limiter**: Granular rate limiting per operation type

### Security Features
- Input sanitization and XSS prevention
- Buffer overflow protection
- Client fingerprinting for abuse detection
- Progressive rate limiting
- SHA-256 password hashing
- Operation whitelisting

## Development

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack for WASM compilation
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Install Cloudflare Workers CLI
npm install -g wrangler
```

### Local Development
```bash
# Build the WASM module
./build-workers.sh

# Run local development server
wrangler dev

# The backend will be available at http://localhost:8787
```

### Deployment to Cloudflare Workers

1. **Login to Cloudflare**:
```bash
wrangler login
```

2. **Deploy to staging**:
```bash
wrangler deploy --env staging
```

3. **Deploy to production**:
```bash
wrangler deploy --env production
```

### Environment Variables

Set these secrets in Cloudflare Workers:
```bash
wrangler secret put DATABASE_URL --env production
wrangler secret put ESTABLISHMENT_CODE --env production
```

## API Endpoints

### Validation Services
- `POST /api/validate/document` - Spanish document validation (DNI/NIE/Passport)
- `POST /api/validate/email` - Email format validation
- `POST /api/validate/phone` - Phone number validation

### Database Operations
- `POST /api/db/availability` - Check bed availability
- `GET /api/db/stats` - Dashboard statistics
- `POST /api/db/register` - Pilgrim registration

### Country Information
- `POST /api/country/info` - Country details with flags and calling codes

### Admin Authentication
- `POST /api/admin/auth` - Admin login with progressive lockouts

## Rate Limits

| Operation | Limit | Window |
|-----------|-------|---------|
| Document Validation | 10 requests | 5 minutes |
| Registration | 3 requests | 1 hour |
| OCR Processing | 5 requests | 10 minutes |
| Email/Phone Validation | 20 requests | 1 hour |
| Admin Authentication | 5 requests | 1 hour |
| Admin Operations | 50 requests | 1 hour |

## Benefits of Cloudflare Workers

- **Zero Cost**: Free tier with generous limits
- **Global Distribution**: Edge deployment worldwide
- **Built-in Security**: TLS, DDoS protection, rate limiting
- **Auto-scaling**: Handles traffic spikes automatically
- **Zero Configuration**: No server management required
- **Fast Cold Starts**: WASM initialization in <5ms

## Migration Status

✅ **Completed**:
- All TypeScript utilities migrated to Rust
- Rate limiting implemented in WASM
- Input validation and sanitization
- Security services with hashing
- Database operations abstracted
- Country API service
- Build and deployment scripts

🚀 **Next Steps**:
- Deploy to Cloudflare Workers production
- Update proxy endpoints to use production URLs
- Monitor performance and scaling
- Implement advanced abuse detection