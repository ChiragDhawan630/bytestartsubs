# Catalog (Proposed & Applied Changes)

This document tracks all proposed and applied changes to the ByteStart Subscription Platform.

> **⚠️ NOTE:** Proposed changes listed here are NOT "live" while they are being worked on. They only become live and official once the corresponding test cases in `[TestCases.md](./TestCases.md)` are executed and passed.

---

## 📚 Related Documentation
- **[AGENT.md](./AGENT.md)** - Architecture, rules, and AI agent guide
- **[TestCases.md](./TestCases.md)** - QA test scenarios and coverage
- **GitHub**: [ChiragDhawan630/bytestartsubs](https://github.com/ChiragDhawan630/bytestartsubs)

---

## [3.1.2] - 2026-01-02

### Fixed
- **API**: Fixed `500 Internal Server Error` on `/api/plans` due to incorrect SQLite syntax (`is_active = 1`) in PostgreSQL environment. Updated query to use `is_active = TRUE`.

---

## [3.1.1] - 2026-01-02

### Fixed
- **Plans Database Schema**: Added missing `price_color` column to `plans` table (Schema v6 migration).
- **Homepage UI**: Fixed "Could not connect to server" error when no plans exist; now shows a friendly "No Plans Available Yet" message.

### Changed
- **Database Migration**: Updated `migrate.js` to include version 6 migration for `price_color` column backfill.

---

## [3.1.0] - 2026-01-02

### Added
- **Docker Support**: Added `Dockerfile`, `compose.yaml`, and `.dockerignore` for containerized deployment.
- **Coolify/aaPanel Compatibility**: Compose file designed for easy deployment on managed Docker platforms.
- **Health Checks**: App container includes health check endpoint for orchestrator monitoring.
- **Non-root User**: Docker image runs as non-root user for enhanced security.
- **GitHub Actions CI/CD**: Automated Docker image builds and push to `ghcr.io` on push/release.

### Documentation
- Updated `AGENT.md` with Docker deployment instructions.

---

## [3.0.0] - 2026-01-02

### Added
- **PostgreSQL Support**: Migrated from SQLite to PostgreSQL for better scalability and deployment flexibility.
- **Neon Integration**: Recommended managed PostgreSQL provider for development and production.
- **Connection Pooling**: Implemented via `pg.Pool` for better concurrent request handling.

### Changed
- **Database Driver**: Replaced `sqlite3` with `pg` package.
- **Query Syntax**: All queries updated to PostgreSQL syntax ($1, $2 placeholders, STRING_AGG, ILIKE, etc.)
- **Schema Definitions**: Updated all DDL to PostgreSQL (SERIAL, TIMESTAMP, NUMERIC, BOOLEAN).
- **Migration System**: Updated to use `information_schema` instead of SQLite's PRAGMA.

### Removed
- **SQLite**: Removed SQLite3 dependency and file-based database support.

---

## [2.4.0] - 2026-01-02

### Added
- **Site Settings Routes**: Implemented missing routes for `/settings` and `/env` in `adminRoutes.js`.
- **Robust Seeding**: Enhanced `migrate.js` to backfill missing or empty setting values with defaults from `schema.js` on startup.
- **Enhanced Settings Seeds**: Added `sale_banner_text`, `homepage_title`, `support_email`, and more to the default seeds.

### Fixed
- **Homepage UI**: Improved contrast for the "Renewed [period]" label in dark mode (subsequently removed as home became light-only).
- **Site Settings Initialization**: Ensured all default settings keys exist in the database after migration.

### Changed
- **Home UI Theme Policy**: Removed dark mode option from the homepage (`index.html`) to maintain a consistent light-mode-only landing experience. Dark mode remains available on the profile page.

---

## [2.3.0] - 2026-01-01

### Added
- **Automatic Razorpay Sync**: Integrated `node-cron` to sync plans and subscriptions every 6 hours.
- **Startup Sync**: The application now performs a full Razorpay sync on every startup to ensure data consistency.
- **Centralized Sync Service**: Created `src/services/syncService.js` to handle data reconciliation.

### Fixed
- **Admin Sync logic**: Refactored `adminController.js` to use the new `syncService`.

---

## [2.2.0] - 2026-01-01

### Fixed
- **Inaccurate Subscription Renewal Dates**: Replaced hardcoded frontend calculations with actual `renewal_date` (`current_end`) synced directly from Razorpay API.
- **User Dashboard Plan Details**: User subscriptions now correctly show plan names and billing cycles by joining with the `plans` table.

### Added
- **Database migration system v4**: Added `renewal_date` column to `subscriptions` table.

---

## [2.1.0] - 2026-01-01

### Added
- **Email Templates Management**: Admins can now create and edit email templates for invoices and subscriptions.
- **Unified "Approve & Send"**: Consolidated invoice approval flow for both manual and automated invoices with template selection and live preview.
- **Database migration system v3**: Added `email_templates` table and default seeding.

### Changed
- Refactored `admin-modals.js` and `admin-render.js` to support the new unified approval flow.
- Enhanced `db/migrate.js` for better robustness and concurrent execution support.

---

## [2.0.0] - 2026-01-01

### Added
- User address fields (`address`, `city`, `state`, `pincode`) for invoice billing
- `gstin` and `theme` columns to users table
- "Create User" button in Admin Panel → Users tab
- User profile sync to customers table for invoices
- Database migration system v2

### Fixed
- "Bill To" section truncation in invoice PDFs (increased width, proper text wrapping)
- "Edit User" modal not loading user data (`globalUsers` not being set)
- Template literal escaping issues in admin settings UI

### Changed
- User edit modal now includes email, address, city, state, pincode fields
- User profile updates now sync to linked customer records

### Documentation
- Consolidated all docs into AGENT.md, TestCases.md, CHANGELOG.md
- Added deprecation notices to legacy files (dist/database.js, qa/fix_data.js)

---

## [1.0.0] - 2025-12-24

### Added
- Initial MVC architecture refactor
- Admin panel with Plans, Categories, Users, Invoices management
- Invoice PDF generation with PDFKit
- Email sending with Nodemailer
- Razorpay subscription integration
- Google OAuth authentication
- Dev mode with mock logins
- Jest test framework setup
- Database migration system v1

### Database Tables
- users, subscriptions, plans, categories
- customers, invoices, invoice_items
- settings, activity_logs, error_logs
- schema_version

---

## How to Update This File

When making changes, add an entry under the appropriate section:

```markdown
## [X.X.X] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Modified feature description

### Fixed
- Bug fix description

### Removed
- Removed feature description
```

**Version Numbering:**
- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, minor improvements

---

*Last updated: 2026-01-01*
