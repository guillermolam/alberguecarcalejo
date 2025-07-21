# Albergue Del Carrascalejo - Pilgrim Registration System

## Overview

This is a modern web application for managing pilgrim registrations at Albergue Del Carrascalejo on the Camino de Santiago. The system provides automated registration, bed management, and compliance with Spanish government reporting requirements (Real Decreto 933/2021).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a zero-cost, modern full-stack architecture optimized for low volume (24 users/day):

- **Frontend**: React with TypeScript, using Vite for development and build
- **Zero-Cost OCR Service**: 
  - **AWS Lambda Function**: Rust-based Spanish document OCR service (DEPLOYED)
  - **Function URL**: https://ypeekiyyo4wb4mvzg3vsa2yy2m0lhmew.lambda-url.eu-west-3.on.aws/
  - **Tesseract Integration**: Spanish DNI/NIE validation with checksum verification
  - **MRZ Parsing**: International passport processing
  - **Cost Optimization**: 256MB memory, 30s timeout, fits AWS free tier
  - **Processing**: <$0/month for 720 requests (24 users/day)
  - **Status**: CONFIGURED - VITE_LAMBDA_OCR_URL and VITE_GOOGLE_PLACES_API_KEY configured
  - **SAM Template**: Updated template provided in `lambda-sam-template.yaml`
  - **Code Structure**: Complete Lambda architecture documented in `lambda-code-structure.md`
- **Secure Backend Services**: 
  - **Database Service**: Secure PostgreSQL operations with input validation
  - **Validation Service**: Document, email, and phone validation with rate limiting
  - **Country Service**: RESTCountries API integration with caching
  - **Security Service**: Admin authentication with SHA-256 hashing
  - **Rate Limiter**: Granular rate limiting per operation type
- **Backend Proxy**: Express.js proxy layer with bed management and payment processing
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
  - **Inventory Management**: Initializes and manages 24-bed inventory (Dormitorios A/B, Private rooms)
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
- **Dynamic Pricing System**: Database-driven pricing with dormitory beds (€15/night) and private rooms (€35/night)
- **Zero-Cost OCR Processing**: AWS Lambda function for Spanish DNI/NIE and passport processing (<$0/month for 24 users/day)
- **Advanced Document Validation**: Checksum verification for DNI/NIE using mod-23 algorithm
- **International Passport Support**: MRZ (Machine Readable Zone) parsing for worldwide passports
- **Intelligent Document Classification**: Automatic document type detection and routing
- **Smart Rotation Detection**: Multi-algorithm rotation correction system with binarization/thresholding for optimal OCR accuracy
  - **Projection Method**: Variance-based rotation detection using document projections
  - **Text Orientation**: Gradient-based text line detection for proper alignment
  - **Edge Detection**: Sobel filter-based edge analysis for document orientation
  - **Hough Transform**: Line detection for precise angle correction
  - **Preprocessing Pipeline**: Gaussian blur and binarization before rotation detection
  - **Confidence Scoring**: Weighted algorithm selection based on detection confidence
- **Secure Bed Management**: Backend service automatically assigns beds after payment confirmation
- **Automatic Bed Initialization**: Sets up 24-bed inventory (Dormitorios A/B, Private rooms) on first run
- **Payment-to-Bed Integration**: Atomic transactions ensuring payment success before bed assignment
- **Government Compliance**: Automated XML submission to Spanish authorities
- **Independent Document Upload**: Separate front/back upload areas for DNI/NIE processing with responsive layout
- **Multi-Document Support**: Handles DNI, NIE, Passport, and Other Documents with file type validation
- **Multi-language Support**: Interface available in 10+ languages with localized date formats
- **Real-time Availability**: Secure bed availability checking via backend service
- **Mobile Optimized**: Touch-friendly interface for tablet/phone use with side-by-side desktop layout
- **Enhanced Phone Input**: Country-aware phone validation with flag display and separated local/country code input
- **Global Address Support**: Worldwide address autocomplete for international pilgrims
- **Country Information Service**: RESTCountries API integration with local caching and fallback data
- **Modern Google Places Integration**: PlaceAutocompleteElement (March 2025+ compliant) with legacy fallback
- **Google Places API Integration**: BFF-integrated Google Places API with server-side key management and fallback support
- **Collapsible Smart Cards**: Progressive form disclosure with OCR confidence-based card states
  - **Personal Information Card**: User icon, confidence-based collapse behavior (≥90% = collapsed with checkmark)
  - **Address Information Card**: Map pin icon, Google Places autocomplete integration
  - **Contact Information Card**: Phone icon, split country code/phone number fields
  - **Payment Information Card**: Credit card icon, always visible for checkout flow
- **Field-Level Security**: Individual padlock controls for OCR-populated fields with manual override capability
- **Intelligent Birth Date Processing**: Automatic DD/MM/YYYY to YYYY-MM-DD conversion for date inputs
- **Advanced Form Validation**: Email validation, phone validation with country codes, file size limits

The application is designed as a self-contained kiosk system that can run on tablets or computers at the albergue entrance, allowing pilgrims to register themselves while ensuring compliance with Spanish hospitality regulations.