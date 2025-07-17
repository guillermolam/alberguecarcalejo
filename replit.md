# Albergue Del Carrascalejo - Pilgrim Registration System

## Overview

This is a modern web application for managing pilgrim registrations at Albergue Del Carrascalejo on the Camino de Santiago. The system provides automated registration, bed management, and compliance with Spanish government reporting requirements (Real Decreto 933/2021).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with a clear separation between client and server components:

- **Frontend**: React with TypeScript, using Vite for development and build
- **Backend**: Express.js with TypeScript
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
- **Express.js Server**: RESTful API with middleware for logging and error handling
- **Service Layer**: Separated business logic into dedicated services
- **Storage Layer**: Abstract storage interface with Drizzle ORM implementation
- **Type-Safe Database**: Shared schema definitions between client and server

### Database Design
The database schema supports:
- **Pilgrims**: Personal information and documents
- **Bookings**: Reservation management with status tracking
- **Beds**: Physical bed inventory and availability
- **Payments**: Financial transaction records
- **Government Submissions**: Compliance tracking for Spanish authorities

### Authentication & Security
- No authentication system currently implemented (designed for kiosk use)
- Data protection compliance with Spanish regulations
- Automatic government reporting via XML submissions

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
- **OCR Integration**: Document scanning for faster registration
- **Multi-language Support**: Interface available in 10+ languages
- **Real-time Availability**: Live bed availability checking
- **Mobile Optimized**: Touch-friendly interface for tablet/phone use

The application is designed as a self-contained kiosk system that can run on tablets or computers at the albergue entrance, allowing pilgrims to register themselves while ensuring compliance with Spanish hospitality regulations.