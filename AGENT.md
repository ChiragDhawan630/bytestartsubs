# ByteStart Subscription Platform - Agent Documentation

This document provides all critical information for AI agents working on this project.

## 🔗 Quick Links
- **GitHub**: [ChiragDhawan630/bytestartsubs](https://github.com/ChiragDhawan630/bytestartsubs)
- **Docker Image**: `ghcr.io/chiragdhawan630/bytestartsubs:latest`

## 📚 Related Documentation
- **[TestCases.md](./TestCases.md)** - QA test scenarios and coverage status
- **[CATALOG.md](./CATALOG.md)** - Version history and proposed changes (The "Catalog")

---

## 📋 Project Overview

A robust, MVC-structured Node.js application for managing subscriptions, invoices, and plans with Razorpay integration.

### Key Features
- **User Dashboard**: View & manage subscriptions, profile, and theme.
- **Admin Panel**: Comprehensive dashboard (`/bytestart`) for managing users, plans, categories, and settings.
- **Payments**: Seamless integration with Razorpay for subscription payments.
- **Invoicing**: Automated PDF invoice generation and emailing.
- **Dev Mode**: Built-in developer support with mock logins.

---

## 🏗️ Architecture

### MVC Structure
```
src/
├── config/         # Database, Environment, Passport configs
├── controllers/    # Business logic (Admin, User, Invoice, etc.)
├── middleware/     # Auth, Rate Limiting, Logging
├── routes/         # API Route definitions
├── services/       # Razorpay, Email, Invoice services
├── utils/          # Helpers (Logger, EnvHelper)
└── app.js          # Express App setup

db/
├── schema.js       # Centralized table definitions
└── migrate.js      # Migration runner

public/
├── js/             # Frontend JavaScript
└── css/            # Stylesheets
```

### Database
- **Engine**: PostgreSQL (via Neon or self-hosted)
- **Connection**: Via `DATABASE_URL` environment variable
- **Driver**: `pg` (Node.js PostgreSQL client)

### Technologies
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Payment**: Razorpay
- **Utilities**: PDFKit, Nodemailer, Passport.js

---

## 🚀 Setup & Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Ensure `.env` file is present in the root directory.
   - Required keys listed below.

3. **Run the Server**
   - **Development**: `npm run dev` (Auto-restarts on change)
   - **Production**: `npm start`

4. **Running Tests**
   ```bash
   npm test
   ```

### 🐳 Docker Deployment

**Build & Run Locally:**
```bash
docker compose up -d          # Start app + PostgreSQL
docker compose logs -f app    # View logs
docker compose down           # Stop all
```

**Coolify / aaPanel Setup:**
1. Push code to Git repo (GitHub, GitLab, etc.)
2. In Coolify/aaPanel, create new service from Docker Compose
3. Set environment variables in the panel:
   - `DB_PASSWORD` - PostgreSQL password
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
   - `SESSION_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
   - `ADMIN_EMAIL`, `ADMIN_PASS`
4. Deploy - the app will auto-migrate the database on startup

**Key Files:**
| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build, Alpine-based (~180MB) |
| `compose.yaml` | App + PostgreSQL orchestration |
| `.dockerignore` | Excludes dev files from build |

**GitHub Actions (CI/CD):**

Images are automatically built and pushed to `ghcr.io` on:
- Push to `main`/`master` branch
- Release published
- Manual trigger via GitHub Actions UI

Image available at: `ghcr.io/<your-username>/bytestart:latest`

---

## 🔧 Environment Variables

Required in `.env`:
```env
APP_ENV=dev|prod
PORT=3000

# Database (PostgreSQL) - Automatic environment selection
DATABASE_URL_DEV=postgresql://postgres:1234@localhost:5432/bytestart_dev
DATABASE_URL_PROD=postgresql://user:password@host:5432/database
DATABASE_SSL=false  # Set to 'true' for Neon/cloud

# Coolify/aaPanel: Set DATABASE_URL directly in environment settings
# The app will use DATABASE_URL if set, otherwise falls back to DEV/PROD above

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

---

## ⚠️ CRITICAL RULES FOR AI AGENTS

### 1. Database Migrations

**NEVER modify the database schema directly with one-off scripts.**

Always use the migration system:

1. **Update `db/schema.js`** - Add/modify table definitions
2. **Increment `CURRENT_VERSION`** in schema.js
3. **Add migration case** in `db/migrate.js`
4. **Test** with `npm run dev`

#### Migration Process - Step by Step

**Step 1: Update the Schema Definition**
```javascript
// In db/schema.js - TABLES object
users: `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        // existing columns...
        new_column TEXT,  // <-- Add new column here
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`,
```

**Step 2: Increment the Version Number**
```javascript
// At bottom of db/schema.js
const CURRENT_VERSION = 3;  // Was 2, now 3
```

**Step 3: Add Migration Logic**
```javascript
// In db/migrate.js - applyMigration function
case 3:
    console.log('[Migrate] Adding new_column to users...');
    await new Promise((resolve, reject) => {
        db.run('ALTER TABLE users ADD COLUMN new_column TEXT', (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    break;
```

**Step 4: Test**
```bash
npm run dev
# Check logs for: [Migrate] ✓ Applied migration v3
```

#### Migration Best Practices

✅ **DO:**
- Always modify both `schema.js` AND `migrate.js`
- Make migrations idempotent (safe to run multiple times)
- Check if columns exist before adding them
- Test migrations on a dev database first

❌ **DON'T:**
- Create one-off scripts that directly ALTER tables
- Modify the database schema outside of the migration system
- Skip version numbers
- Delete or modify existing migrations

### 2. Code Style
- Use `const` and arrow functions
- Follow existing patterns in each file
- Add JSDoc comments for public functions

### 3. Testing
- Test files are in `src/tests/`
- Run with `npm test`
- **CRITICAL:** When making changes, you MUST add or update corresponding test cases in `[TestCases.md](./TestCases.md)`. This includes adding new scenarios for any new functionality implemented. Documentation and testing coverage must stay in sync with development.

### 4. Documentation & Cataloging
- **CATALOG UPDATE:** You MUST update `[CATALOG.md](./CATALOG.md)` after completing any changes to the codebase. Log what was added, changed, fixed, or removed.
- **NO NEW `.md` FILES:** Do not create any additional Markdown files. All documentation must exist within `AGENT.md`, `TestCases.md`, or `CATALOG.md`.
- **The Catalog (CATALOG.md):** All proposed changes and ongoing work must be logged in `[CATALOG.md](./CATALOG.md)`.
- **"Live" Status:** Entries in the Catalog are considered "Work in Progress" and NOT live while they are being developed.
- **Going Live:** Changes recorded in the Catalog only go "Live" (are finalized and officially part of the platform) once the corresponding Test Cases in `TestCases.md` have been executed and passed.

---

## 📂 Key Files Reference

| File | Purpose |
|------|---------|
| `src/app.js` | Express application setup |
| `server.js` | Entry point, starts server |
| `db/schema.js` | All table definitions |
| `db/migrate.js` | Migration runner |
| `src/controllers/adminController.js` | Admin API logic |
| `src/controllers/userController.js` | User API logic |
| `src/controllers/invoiceController.js` | Invoice/PDF logic |
| `src/services/invoiceService.js` | PDF generation |
| `src/services/emailService.js` | Email sending |
| `admin.html` | Admin panel SPA |
| `public/js/admin.js` | Admin panel core JS |
| `public/js/admin-modals.js` | Admin modal functions |
| `public/js/admin-render.js` | Admin rendering functions |

---

## 🤖 Common Tasks

### Adding a New API Endpoint
1. Add route in `src/routes/` (adminRoutes.js, userRoutes.js, etc.)
2. Add controller function in `src/controllers/`
3. Export function from controller
4. Wire up route to controller function

### Adding a Database Column
1. Update `db/schema.js` TABLES object
2. Increment CURRENT_VERSION in schema.js
3. Add migration case in `db/migrate.js`
4. Update any controllers that use the table

### Creating a Test
1. Add test file in `src/tests/`
2. Follow Jest patterns
3. Update TestCases.md with scenario

---

## 📊 API Endpoints

### Public
- `GET /api/plans` - List all plans
- `GET /api/categories` - List categories
- `GET /api/policy/:type` - Get policy content

### User (Authenticated)
- `GET /api/user` - Get current user
- `GET /api/my-subscriptions` - User's subscriptions
- `POST /api/subscription/create` - Create subscription

### Admin (Admin Auth Required)
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `POST /api/admin/users/:id` - Update user
- `GET /api/admin/plans` - List plans
- `POST /api/admin/plans` - Create plan
- `PUT /api/admin/plans/:id` - Update plan
- `GET /api/admin/invoices` - List invoices
- `POST /api/admin/invoices/:id/pdf` - Generate PDF
- `GET /api/admin/settings` - Get settings
- `POST /api/admin/settings` - Update settings

---

## 📋 Current Database Schema

**Version: 5** (as of 2026-01-02 - PostgreSQL Migration)

| Table | Key Columns |
|-------|-------------|
| users | id, email, name, phone, gstin, address, city, state, pincode, theme |
| subscriptions | id, user_id, razorpay_sub_id, plan_id, status, renewal_date |
| plans | id, name, price_discounted, razorpay_plan_id, category, is_active |
| categories | id, name, icon, tagline, display_order |
| customers | id, name, email, gstin, address, city, state, pincode |
| invoices | id, invoice_number, customer_id, total, status |
| invoice_items | id, invoice_id, description, quantity, rate, amount |
| settings | key, value |
| email_templates | id, name, subject, body, created_at |
| activity_logs | id, user_id, action, details, timestamp |
| error_logs | id, error_type, message, resolved, created_at |
| schema_version | version, applied_at, description |

### Migration History

| Version | Description | Date |
|---------|-------------|------|
| 1 | Initial schema - all base tables | 2025-12-24 |
| 2 | Added address fields to users table (address, city, state, pincode, gstin, theme) | 2026-01-01 |
| 3 | Added email_templates table and seed data | 2026-01-01 |
| 4 | Added renewal_date to subscriptions table | 2026-01-01 |
| 5 | **PostgreSQL Migration** - Migrated from SQLite to PostgreSQL | 2026-01-02 |

---

## ⚠️ Legacy Files (DO NOT USE)

These files are deprecated and remain only for reference:
- `dist/database.js` - Old database init
- `qa/fix_data.js` - Old migration script

---

## 📝 Documentation Files

- **`AGENT.md`** - This file (AI agent reference)
- **`TestCases.md`** - QA test scenarios and coverage
- **`CATALOG.md`** - Proposed changes and version history (The "Catalog")

---

*Last updated: 2026-01-02*
