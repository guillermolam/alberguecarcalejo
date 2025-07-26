
# Environment Variables Configuration

This document lists all environment variables used across the Albergue Del Carrascalejo application.

## Required Variables

### Database Configuration
- `DATABASE_URL` - PostgreSQL connection string (required)
- `NEON_DATABASE_URL` - Neon database connection string (required)

### Auth0 Configuration
- `AUTH0_DOMAIN` - Auth0 tenant domain (required)
- `AUTH0_CLIENT_ID` - Auth0 client ID (required)
- `AUTH0_CLIENT_SECRET` - Auth0 client secret (required)

### Security
- `ENCRYPTION_KEY` - AES-256-GCM encryption key, 32 bytes base64 encoded (required)
- `JWT_SECRET` - JWT signing secret (required)

## Optional Variables

### External Services
- `TWILIO_ACCOUNT_SID` - Twilio account SID for SMS
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_FROM_NUMBER` - Twilio from phone number
- `TWILIO_WHATSAPP_FROM` - WhatsApp from number
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `TELEGRAM_CHAT_ID` - Default Telegram chat ID

### Email Configuration
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_FROM_EMAIL` - From email address
- `SMTP_FROM_NAME` - From name

### Location Services
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `MAPBOX_ACCESS_TOKEN` - Mapbox access token

### Service Configuration
- `RATE_LIMIT_REQUESTS` - Rate limit requests per minute (default: 100)
- `RATE_LIMIT_WINDOW_SECONDS` - Rate limit window in seconds (default: 60)
- `RATE_LIMIT_BURST` - Burst limit for rate limiting (default: 20)
- `LOG_LEVEL` - Application log level (default: info)
- `BOOKING_TIMEOUT_HOURS` - Booking timeout in hours (default: 2)
- `TOKEN_EXPIRY_HOURS` - JWT token expiry in hours (default: 24)
- `SESSION_TIMEOUT_MINUTES` - Session timeout in minutes (default: 60)
- `CACHE_TTL_SECONDS` - Cache TTL in seconds (default: 3600)

### Development Configuration
- `SPIN_LISTEN_ADDRESS` - Gateway listen address (default: 0.0.0.0:3000)
- `GATEWAY_PORT` - Gateway port (default: 3000)

## Setting Variables in Replit

1. Go to your Repl's Secrets tab
2. Add each required variable with its value
3. Optional variables can be added as needed

## Setting Variables in Fermyon Cloud

Using the Fermyon Cloud CLI:

```bash
# Set required variables
spin cloud variables set auth0_domain "your-tenant.auth0.com"
spin cloud variables set auth0_client_id "your_client_id"
spin cloud variables set auth0_client_secret "your_client_secret"
spin cloud variables set database_url "postgresql://..."
spin cloud variables set neon_database_url "postgresql://..."
spin cloud variables set encryption_key "base64_encoded_32_byte_key"
spin cloud variables set jwt_secret "your_jwt_secret"

# Set optional variables as needed
spin cloud variables set twilio_account_sid "your_twilio_sid"
spin cloud variables set telegram_bot_token "your_bot_token"
```

## Variable Naming Convention

All environment variables use SCREAMING_SNAKE_CASE in code and configuration files, but are referenced in lowercase with underscores in spin.toml files as per Fermyon Cloud requirements.

Example:
- Environment variable: `AUTH0_DOMAIN`
- Spin variable: `auth0_domain`
- Template reference: `{{ auth0_domain }}`

