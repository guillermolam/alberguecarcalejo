# Albergue Del Carrascalejo - Pilgrim Registration System

## Overview

This is a modern web application for managing pilgrim registrations at Albergue Del Carrascalejo on the Camino de Santiago. The system provides automated registration, bed management, and compliance with Spanish government reporting requirements (Real Decreto 933/2021).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with enhanced security through a Rust-WASM Backend-for-Frontend (BFF) layer:

- **Frontend**: React with TypeScript, using Vite for development and build
- **BFF Layer**: 
  - **Registration BFF**: Rust-WASM module with rate limiting
  - **Admin BFF**: Rust-WASM module with authentication
  - **Country BFF**: New Rust-WASM microservice for country information via RESTCountries API
- **Backend**: Express.js with TypeScript, integrated with BFF for country data
- **Database**: PostgreSQL with Drizzle ORM
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
- **BFF Security Layer**: 
  - **Registration BFF**: Rust-WASM module with rate limiting (10 document validations/5min, 3 registrations/hour, 5 OCR/10min)
  - **Admin BFF**: Rust-WASM module with authentication and stricter rate limits (5 auth attempts/hour, 50 operations/hour, 10 exports/hour)
  - **Country BFF**: Rust-WASM microservice for secure RESTCountries API integration with caching (1-hour cache, 10 requests/minute rate limit)
  - **Database Layer**: Secure database abstraction within Rust BFF with SQL injection protection and operation whitelisting
  - **Authentication**: SHA-256 hashing, progressive lockouts, session management all handled in Rust
  - **Input Validation**: Spanish document validation (DNI/NIE/Passport), XSS prevention, buffer overflow protection
  - **Security Features**: Client fingerprinting, progressive lockouts, operation whitelisting, export restrictions
  - **Abuse Detection**: Pattern recognition for bot behavior, developer tools detection, timing analysis
- **Express.js Proxy**: Minimal proxy layer routing requests to secure Rust BFF modules
- **No Direct Database Access**: All database operations secured through Rust BFF validation
- **Type-Safe Database**: Shared schema definitions between client and server

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
   - Pilgrim enters stay dates → availability check
   - Photo capture and OCR processing for document verification
   - Form completion with personal details
   - Payment information collection
   - Bed assignment and booking creation
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
- **Automatic Bed Initialization**: Sets up bed inventory on first run
- **Government Compliance**: Automated XML submission to Spanish authorities
- **OCR Integration**: Document scanning for faster registration with gender parsing
- **Multi-language Support**: Interface available in 10+ languages with localized date formats
- **Real-time Availability**: Live bed availability checking
- **Mobile Optimized**: Touch-friendly interface for tablet/phone use
- **Enhanced Phone Input**: Country-aware phone validation with flag display and separated local/country code input
- **Global Address Support**: Worldwide address autocomplete for international pilgrims
- **Country Information Service**: Rust-WASM microservice providing real-time country flags, calling codes via RESTCountries API
- **Modern Google Places Integration**: Migrated to PlaceAutocompleteElement (March 2025+ compliant) with legacy fallback

The application is designed as a self-contained kiosk system that can run on tablets or computers at the albergue entrance, allowing pilgrims to register themselves while ensuring compliance with Spanish hospitality regulations.