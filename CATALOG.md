# Catalog (Proposed & Applied Changes)

This document tracks all proposed and applied changes to the ByteStart Subscription Platform.

> **⚠️ NOTE:** Proposed changes listed here are NOT "live" while they are being worked on. They only become live and official once the corresponding test cases in `[TestCases.md](./TestCases.md)` are executed and passed.

---

## 🔴 Documentation Rule

> **⚠️ CRITICAL: NO ADDITIONAL .MD FILES**
> 
> All project documentation MUST be tracked in exactly **3 files only**:
> 1. **AGENT.md** - Architecture, setup, rules, API reference
> 2. **TestCases.md** - QA test scenarios and coverage tracking
> 3. **CATALOG.md** - Version history and changelog
> 
> **DO NOT create** README.md, CHANGELOG.md, API.md, NOTES.md, TODO.md, or any other .md files.  
> All updates must be consolidated into these 3 core documentation files.

---

## 📚 Related Documentation
- **[AGENT.md](./AGENT.md)** - Architecture, rules, and AI agent guide
- **[TestCases.md](./TestCases.md)** - QA test scenarios and coverage
- **GitHub**: [ChiragDhawan630/bytestartsubs](https://github.com/ChiragDhawan630/bytestartsubs)

---

## [4.0.0] - 2026-01-02 - **NestJS/Next.js Migration (LIVE ✅)**

### Summary
Complete architecture migration from Express.js monolith to NestJS/Next.js monorepo with comprehensive QA testing and Docker deployment setup.

### Added

#### Architecture & Structure
- **Monorepo Structure**: `apps/api` (NestJS backend) and `apps/web` (Next.js frontend)
- **Prisma ORM**: PostgreSQL integration with type-safe client (v6.2.1)
- **Global ValidationPipe**: Automatic DTO validation with `class-validator`
- **Global HttpExceptionFilter**: Consistent error response format with timestamps

#### Backend Modules (NestJS)
- **AuthModule**: Google OAuth + JWT authentication with Passport.js
  - JWT Strategy for protected routes
  - Google OAuth Strategy for user authentication
- **UsersModule**: User profile management
  - GET/PATCH `/users/profile`
  - User data updates
- **AdminModule**: Admin dashboard functionality
  - Stats endpoint (total users, subscriptions, revenue)
  - User management (CRUD operations)
  - Plan management (CRUD operations)
- **SubscriptionsModule**: Razorpay subscription management
  - POST `/subscriptions/create`
  - POST `/subscriptions/verify`
  - GET `/subscriptions/my-subscriptions`
- **InvoicesModule**: Invoice generation and delivery
  - PDF generation with PDFKit
  - Email delivery with Nodemailer
  - Download and send endpoints
- **PublicModule**: Unauthenticated endpoints
  - GET `/public/plans` - Active subscription plans
  - GET `/public/settings` - Public site settings

#### Frontend (Next.js)
- **App Router**: Next.js 14 with App Router
- **Landing Page**: Public-facing homepage with plans display
- **Auth Pages**: Login/Register with Google OAuth
- **User Dashboard**: Subscription management, profile settings
- **Admin Dashboard**: User management, plan management, stats
- **Vanilla CSS Design System**: Custom styling without frameworks

#### Testing & QA
- **40 E2E Tests Passing**: Comprehensive test coverage across 8 test files
  - `auth.e2e-spec.ts` (7 tests) - JWT validation, protected routes
  - `admin.e2e-spec.ts` (8 tests) - Admin endpoint authentication
  - `subscriptions.e2e-spec.ts` (4 tests) - Subscription routes
  - `invoices.e2e-spec.ts` (3 tests) - Invoice routes
  - `validation.e2e-spec.ts` (9 tests) - ValidationPipe behavior
  - `database.e2e-spec.ts` (6 tests) - Database integrity
  - `plans.e2e-spec.ts` (2 tests) - Public endpoints
  - `app.e2e-spec.ts` (1 test) - Health check
- **TestCases.md**: 230 documented test scenarios across 18 categories
  - Added sections: Webhooks, Customers, Categories, Activity Logs, Error Logs, Database Integrity

#### Deployment & Infrastructure
- **Docker Support**: Multi-stage production builds
  - `apps/api/Dockerfile` - NestJS API optimized build
  - `apps/web/Dockerfile` - Next.js standalone build
  - `docker-compose.yaml` - Full stack orchestration (API + Web + PostgreSQL)
- **DOCKER.md**: Complete deployment guide
- **.dockerignore**: Optimized for monorepo structure

#### Documentation
- **AGENT.md**: Complete architecture guide with critical rules for AI agents
- **TestCases.md**: 230 test scenarios with execution tracking
- **DOCKER.md**: Production deployment guide
- **Walkthrough.md**: Migration progress documentation

### Changed
- **Database**: PostgreSQL (previously SQLite in legacy)
- **ORM**: Prisma (previously raw SQL)
- **Authentication**: JWT tokens (previously session-based)
- **Validation**: Global ValidationPipe (previously manual)
- **Error Handling**: Global HttpExceptionFilter (previously ad-hoc)
- **Project Structure**: Monorepo with separate API/Web (previously single app)

### Fixed
- **Prisma Compatibility**: Downgraded to v6.2.1 to resolve compatibility issues
- **Environment Loading**: Fixed malformed `.env` file preventing DATABASE_URL parsing
- **InvoicesController**: Added missing `AuthGuard` decorator
- **UsersModule**: Added PrismaModule import for dependency injection

### Removed (Deprecated)
- **Legacy Express App**: Moved to `legacy_src/` directory
  - `legacy_src/AGENT_LEGACY.md`
  - `legacy_src/TestCases_LEGACY.md`
  - `legacy_src/CATALOG_LEGACY.md`

### Verified
All test cases passing, production Docker builds functional, documentation complete.

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 4.0.0 | 2026-01-02 | NestJS/Next.js Migration Complete |
| 3.x.x | 2025-12-24 to 2026-01-01 | Legacy Express.js application |

---

*Document maintained by ByteStart Engineering Team*  
*Last Updated: January 2, 2026*

