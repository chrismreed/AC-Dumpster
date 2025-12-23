# Alley Cat Dumpster Rental System

## Overview
This is a comprehensive dumpster rental management system built with React (TypeScript) frontend and Express.js backend. The application serves both customer-facing booking functionality and administrative management capabilities. It integrates with Stripe for payments, Google Maps for location services, and uses PostgreSQL with Drizzle ORM for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration
- **Styling**: Tailwind CSS with custom theme (primary color: #f7c948)
- **UI Components**: Radix UI components with shadcn/ui styling
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and bcrypt
- **Session Management**: Express session with database store
- **Payment Processing**: Stripe integration with webhook support
- **API Design**: RESTful endpoints with proper error handling

## Key Components

### Database Schema
The system uses the following main entities:
- **Users**: Admin authentication system
- **Dumpsters**: Container types with specifications
- **DumpsterPricing**: Flexible pricing by duration
- **ServiceZones**: Geofenced service areas with custom pricing
- **Hubs**: Storage/dispatch locations
- **Bookings**: Customer orders with full lifecycle tracking
- **AddOns**: Additional services (same-day delivery, etc.)
- **PaymentLinks**: Stripe payment integration
- **AdditionalCharges**: Post-booking charges
- **CustomerAccounts**: Commercial customer portal login (email + access code)
- **SwapRequests**: Customer pickup/swap/early-completion requests
- **CustomerCredits**: Early-return credits for future bookings

### Customer Booking Flow
1. **Dumpster Selection**: Choose size and rental duration
2. **Delivery Details**: Address, date, and placement preferences
3. **Add-ons**: Optional services with zone-based availability
4. **Review & Payment**: Contact details and Stripe payment processing

### Admin Management System
- **Dashboard**: Booking overview and statistics
- **Inventory Management**: Dumpster types and pricing
- **Service Zone Management**: Geofenced areas with custom pricing
- **Hub Management**: Storage location configuration
- **Booking Management**: Order processing and status updates
- **Swap Requests**: Customer pickup/swap request management with credit issuance
- **Payment Management**: Stripe integration with additional charges
- **Business Settings**: White-label configuration for business name, contact info, and email sender

### Customer Portal (Commercial Accounts)
- **Login**: Email + 6-digit access code authentication (no passwords)
- **Dashboard**: View active and past rental bookings
- **Swap Requests**: Request pickup, dumpster swap, or early completion
- **Credits**: View available credits from early returns for use on future bookings

## Data Flow

### Booking Process
1. Customer selects dumpster size and rental duration
2. System validates service area and calculates delivery fees
3. Customer provides delivery details and selects add-ons
4. System calculates total price with zone-based adjustments
5. Customer completes payment via Stripe
6. Booking is created with "pending" status
7. Admin receives notification and can manage order

### Pricing Calculation
- Base pricing varies by dumpster size and rental duration
- Zone-based delivery fees calculated via Google Maps API
- Distance-based tiered pricing (0-15 min: $0, 16-30 min: $25, etc.)
- Add-on services with zone-specific availability
- Additional charges can be added post-booking

### Payment Processing
- Stripe integration for secure payment processing
- Webhook endpoint for automatic payment status updates
- Additional charge system for post-booking fees
- Payment link generation for customer billing

## External Dependencies

### Payment Processing
- **Stripe**: Payment processing with webhook notifications
- **Environment Variables**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### Location Services
- **Google Maps API**: Address validation, geofencing, distance calculation
- **Environment Variables**: `VITE_GOOGLE_MAPS_API_KEY`
- **Services**: Places API, Distance Matrix API, Static Maps API

### Database
- **Neon Database**: PostgreSQL hosting with serverless connection
- **Environment Variables**: `DATABASE_URL`

### Authentication
- **Session Management**: Database-backed session store
- **Environment Variables**: `SESSION_SECRET`

### Email Service
- **Brevo (formerly Sendinblue)**: Transactional email via REST API
- **Environment Variables**: `BREVO_API_KEY`, `BREVO_FROM_EMAIL` (optional), `BREVO_FROM_NAME` (optional)
- **Features**: Booking confirmation emails sent automatically when bookings are created

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reloading
- **Production**: Node.js server with built static assets
- **Database**: Automated migrations with Drizzle Kit

### Build Process
1. Frontend assets built with Vite
2. Backend compiled with esbuild
3. Database schema pushed with Drizzle migrations
4. Static files served from Express server

### Required Environment Variables
```
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_GOOGLE_MAPS_API_KEY=AIza...
SESSION_SECRET=...
BREVO_API_KEY=xkeysib-...
```

## Changelog
- December 23, 2025. Added configurable swap/pickup pricing with Stripe payment link integration for swap request fees
- December 22, 2025. Added Customer Portal with login, dashboard, swap requests, and early-completion credits
- December 22, 2025. Added Admin Swap Requests page for managing customer pickup/swap requests
- December 20, 2025. Added Business Settings page for white-label configuration (business name, sender email, contact info)
- July 06, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.
Privacy protection: Use only first names in customer testimonials and reviews.
Google Reviews: Refresh automatically every week for fresh customer feedback.