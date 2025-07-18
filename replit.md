# Albergue Del Carrascalejo - Pilgrim Registration System

## Overview

This is a modern web application for managing pilgrim registrations at Albergue Del Carrascalejo on the Camino de Santiago. The system provides automated registration, bed management, and compliance with Spanish government reporting requirements (Real Decreto 933/2021).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with complete migration to secure Rust-WASM backend services:

- **Frontend**: React with TypeScript, using Vite for development and build
- **Rust WASM Backend**: 
  - **Database Service**: Secure PostgreSQL operations with input validation
  - **Validation Service**: Document, email, and phone validation with rate limiting
  - **Country Service**: RESTCountries API integration with caching
  - **Security Service**: Admin authentication with SHA-256 hashing
  - **Rate Limiter**: Granular rate limiting per operation type
  - **Deployed on Cloudflare Workers**: Zero-cost, globally-distributed WASM deployment
- **Backend Proxy**: Minimal Express.js proxy layer routing to Rust WASM services
- **Database**: PostgreSQL with Drizzle ORM, accessed securely through Rust layer
- **UI Framework**: Shadcn/ui with Tailwind CSS
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application with component-based architecture
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Shadcn/ui**: Pre-built accessible UI components
- **Multi-language Support**: Internationalization with language selector
- **Mobile-First Design**: Responsive design optimized for mobile devices

### Backend Architecture
- **Rust WASM Services**: 
  - **Database Service**: Secure PostgreSQL operations with date validation and error handling
  - **Validation Service**: Spanish document validation (DNI/NIE/Passport) with checksums, email/phone validation
  - **Country Service**: RESTCountries API integration with local caching and fallback data
  - **Security Service**: Admin authentication with SHA-256 hashing and token generation
  - **Rate Limiter**: Granular limits per operation (10 validations/5min, 3 registrations/hour, 5 OCR/10min)
  - **Input Sanitization**: XSS prevention, buffer overflow protection, client fingerprinting
  - **Cloudflare Workers Deployment**: Zero-cost, globally-distributed WASM with built-in TLS and routing
- **Secure Bed Management Service**: TypeScript backend service with PostgreSQL integration
  - **Automatic Bed Assignment**: Assigns beds automatically after payment confirmation
  - **Real-time Availability**: Checks bed availability with date range validation
  - **Payment Integration**: Processes payments and assigns beds atomically
  - **Inventory Management**: Initializes and manages 25-bed inventory (Dormitorios A/B, Private rooms)
  - **Security**: All bed operations secured and validated before database updates
- **Express.js Proxy**: Minimal proxy layer routing requests to Rust WASM backend services
- **Secure Database Access**: All database operations validated and secured through backend services
- **Type-Safe Operations**: Serde serialization for request/response validation

### Database Design
The database schema supports:
- **Pilgrims**: Personal information and documents
- **Bookings**: Reservation management with status tracking
- **Beds**: Physical bed inventory and availability
- **Payments**: Financial transaction records
- **Government Submissions**: Compliance tracking for Spanish authorities

### Authentication & Security
- **Multi-layered Security**: Rust-WASM BFF modules provide enhanced input validation and rate limiting
- **Admin Authentication**: Session-based auth with SHA-256 hashing and progressive lockouts (5min after 3 failures, 30min after 5+ failures)
- **Rate Limiting**: Granular limits per operation type:
  - Document validation: 10 per 5 minutes
  - Registration: 3 per hour
  - OCR processing: 5 per 10 minutes
  - Admin auth: 5 per hour
  - Admin operations: 50 per hour
  - Admin exports: 10 per hour
- **Input Sanitization**: XSS prevention, SQL injection protection, buffer overflow safeguards
- **Document Validation**: Backend-verified Spanish DNI/NIE/Passport validation with checksums to prevent CSRF attacks
- **Client Fingerprinting**: Enhanced browser-based identification for abuse detection
- **Security Monitoring**: Automated behavior detection, developer tools detection, suspicious timing analysis
- **Data Protection**: Compliance with Spanish regulations and GDPR
- **Automatic Government Reporting**: Secure XML submissions with retry logic

## Data Flow

1. **Registration Process**:
   - Pilgrim enters stay dates → secure availability check via bed manager
   - Photo capture and OCR processing for document verification (independent front/back upload)
   - Form completion with personal details auto-populated from OCR
   - Payment information collection
   - **Automatic bed assignment after payment confirmation** via secure backend service
   - Atomic transaction: payment processing + bed assignment + booking confirmation
   - Automatic government submission

2. **Admin Management**:
   - Dashboard with occupancy statistics
   - Bed status management
   - Booking oversight
   - Compliance monitoring

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection pooling
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router
- **zod**: Runtime type validation

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: CSS framework
- **lucide-react**: Icon library
- **react-hook-form**: Form management

### Specialized Services
- **tesseract.js**: OCR for document processing
- **date-fns**: Date manipulation utilities
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- tsx for TypeScript execution in development
- Database migrations via Drizzle Kit

### Production Build
- Vite builds optimized static assets
- esbuild bundles server code for Node.js
- Single deployment artifact with both client and server

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Government API configuration via `ESTABLISHMENT_CODE`
- Replit-specific optimizations for cloud deployment

### Key Features
- **Secure Bed Management**: Backend service automatically assigns beds after payment confirmation
- **Automatic Bed Initialization**: Sets up 25-bed inventory (Dormitorios A/B, Private rooms) on first run
- **Payment-to-Bed Integration**: Atomic transactions ensuring payment success before bed assignment
- **Government Compliance**: Automated XML submission to Spanish authorities
- **Independent Document Upload**: Separate front/back upload areas for DNI/NIE processing
- **Enhanced OCR Integration**: Spanish document parsing with document support number extraction
- **Multi-language Support**: Interface available in 10+ languages with localized date formats
- **Real-time Availability**: Secure bed availability checking via backend service
- **Mobile Optimized**: Touch-friendly interface for tablet/phone use
- **Enhanced Phone Input**: Country-aware phone validation with flag display and separated local/country code input
- **Global Address Support**: Worldwide address autocomplete for international pilgrims
- **Country Information Service**: Rust-WASM microservice providing real-time country flags, calling codes via RESTCountries API
- **Modern Google Places Integration**: Migrated to PlaceAutocompleteElement (March 2025+ compliant) with legacy fallback

The application is designed as a self-contained kiosk system that can run on tablets or computers at the albergue entrance, allowing pilgrims to register themselves while ensuring compliance with Spanish hospitality regulations.