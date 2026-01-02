# ByteStart Subscription Platform - Agent Documentation

## 🔴 Critical Rules for AI Agents

### 📋 Documentation Consolidation Rule

> **⚠️ CRITICAL: NO ADDITIONAL .MD FILES**
> 
> All project documentation MUST be tracked in exactly **3 files only**:
> 1. **AGENT.md** - Architecture, setup, rules, API reference
> 2. **TestCases.md** - QA test scenarios and coverage tracking
> 3. **CATALOG.md** - Version history and changelog
> 
> **DO NOT create any additional .md files** such as:
> - ❌ README.md (use AGENT.md instead)
> - ❌ CHANGELOG.md (use CATALOG.md instead)
> - ❌ API.md (use AGENT.md instead)
> - ❌ NOTES.md, TODO.md, or any other .md files
> 
> **Exception:** Documentation that is inherently part of the codebase structure:
> - ✅ DOCKER.md (deployment guide)
> - ✅ MIGRATION_SUMMARY.md (one-time migration artifact)
> - ✅ Walkthrough artifacts in `.gemini/antigravity/brain/` Documentation

> **Architecture:** NestJS Backend (Prisma ORM) + Next.js Frontend (Monorepo)  
> **Database:** PostgreSQL  
> **Last Updated:** January 2, 2026 (v4.0.0)

## 🔗 Quick Links
- **GitHub:** [ChiragDhawan630/bytestartsubs](https://github.com/ChiragDhawan630/bytestartsubs)
- **Docker Image:** `ghcr.io/chiragdhawan630/bytestartsubs:latest`

## 📚 Related Documentation
- **[TestCases.md](./TestCases.md)** - QA test scenarios and coverage status
- **[CATALOG.md](./CATALOG.md)** - Version history and proposed changes
- **Legacy:** `legacy_src/AGENT_LEGACY.md`, `legacy_src/TestCases_LEGACY.md`

---

## 📋 Project Overview

A **monorepo** containing:
- **`apps/api`** - NestJS REST API backend
- **`apps/web`** - Next.js frontend application
- **`legacy_src`** - Deprecated Express.js codebase (reference only)

### Key Features
- **User Dashboard:** View & manage subscriptions, profile
- **Admin Panel:** Comprehensive dashboard for users, plans, invoices, settings
- **Payments:** Razorpay subscription integration
- **Invoicing:** PDF generation and email delivery
- **Authentication:** Google OAuth with JWT tokens

---

## 🏗️ Architecture

### Monorepo Structure
```
bytestartsubs/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Database schema
│   │   ├── src/
│   │   │   ├── admin/          # Admin module
│   │   │   ├── auth/           # Authentication module
│   │   │   ├── common/         # Shared utilities
│   │   │   │   └── filters/    # Exception filters
│   │   │   ├── invoices/       # Invoice module
│   │   │   ├── prisma/         # Database service
│   │   │   ├── public/         # Public endpoints
│   │   │   ├── subscriptions/  # Subscription module
│   │   │   ├── users/          # User module
│   │   │   ├── app.module.ts   # Root module
│   │   │   └── main.ts         # Application entry
│   │   └── test/               # E2E tests
│   │
│   └── web/                    # Next.js Frontend
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   │   ├── (auth)/     # Auth pages (login, register)
│       │   │   ├── admin/      # Admin dashboard
│       │   │   ├── auth/       # OAuth callback
│       │   │   └── dashboard/  # User dashboard
│       │   ├── components/     # React components
│       │   └── lib/            # Utilities (API client)
│       └── public/             # Static assets
│
├── legacy_src/                 # Deprecated Express.js code
├── .env                        # Environment variables
├── AGENT.md                    # This file
├── TestCases.md                # QA documentation
└── CATALOG.md                  # Version history
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend Framework** | NestJS 11.x |
| **Database** | PostgreSQL |
| **ORM** | Prisma 6.2.1 |
| **Authentication** | Passport.js (Google OAuth), JWT |
| **Frontend** | Next.js 14 (App Router) |
| **Styling** | Vanilla CSS (custom design system) |
| **API Client** | Axios |
| **Payments** | Razorpay |
| **PDF Generation** | PDFKit |
| **Email** | Nodemailer |

---

## 🗄️ Database Schema

**Database:** PostgreSQL  
**ORM:** Prisma  
**Schema Location:** `apps/api/prisma/schema.prisma`

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | id, email, name, google_id, phone, gstin |
| `subscriptions` | User subscriptions | id, user_id, plan_id, razorpay_sub_id, status |
| `plans` | Subscription plans | id, name, price_original, price_discounted, billing_cycle |
| `invoices` | Invoice records | id, invoice_number, customer_id, total, status |
| `invoice_items` | Invoice line items | id, invoice_id, description, quantity, rate |
| `customers` | Manual invoice customers | id, name, email, gstin, address |
| `settings` | System key-value config | key, value |
| `email_templates` | Email templates | id, name, subject, body |
| `activity_logs` | Audit trail | id, user_id, action, details, timestamp |
| `error_logs` | Error tracking | id, error_type, message, resolved |
| `categories` | Plan categories | id, name, icon, display_order |
| `schema_version` | Migration tracking | version, applied_at |

---

## 🔧 Environment Configuration

Create `.env` in the project root:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:1234@localhost:5432/bytestart_dev

# Authentication
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3001

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🚀 Setup & Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/ChiragDhawan630/bytestartsubs.git
cd bytestartsubs

# Install backend dependencies
cd apps/api
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations (if using Prisma migrations)
npx prisma db push

# Start backend (development)
npm run start:dev
# Backend runs on http://localhost:3000

# In another terminal, install frontend
cd apps/web
npm install

# Start frontend (development)
npm run dev
# Frontend runs on http://localhost:3001
```

### Running Tests

```bash
# Backend E2E tests
cd apps/api
npm run test:e2e

# Backend unit tests
npm test

# Build production
npm run build
```

---

## 📡 API Endpoints

### Public (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/public/plans` | List active subscription plans |
| GET | `/public/settings` | Get public site settings |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | OAuth callback |

### User (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get current user profile |
| PATCH | `/users/profile` | Update user profile |
| GET | `/subscriptions/my-subscriptions` | User's subscriptions |
| POST | `/subscriptions` | Create subscription |
| POST | `/subscriptions/verify` | Verify payment |

### Admin (Admin JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/users` | List users (paginated) |
| POST | `/admin/users` | Create user |
| PATCH | `/admin/users/:id` | Update user |
| DELETE | `/admin/users/:id` | Delete user |
| GET | `/admin/plans` | List all plans |
| POST | `/admin/plans` | Create plan |
| PATCH | `/admin/plans/:id` | Update plan |
| DELETE | `/admin/plans/:id` | Delete plan |
| GET | `/admin/settings` | Get all settings |
| PATCH | `/admin/settings` | Update settings |
| GET | `/admin/email-templates` | List email templates |
| GET | `/admin/email-templates/:id` | Get single template |
| PATCH | `/admin/email-templates/:id` | Update template |

### Invoices (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invoices` | List all invoices |
| GET | `/invoices/:id` | Get invoice details |
| GET | `/invoices/:id/download` | Download PDF |
| POST | `/invoices/:id/send` | Email invoice |

---

## ⚠️ CRITICAL RULES FOR AI AGENTS

### 1. Database Migrations (Prisma)

**ALWAYS modify database through Prisma schema:**

1. Update `apps/api/prisma/schema.prisma`
2. Run `npx prisma generate` to update client
3. Run `npx prisma db push` for development
4. Use `npx prisma migrate` for production

**NEVER:**
- Write raw SQL to modify schema
- Bypass Prisma for schema changes
- Modify generated client files

### 2. Module Architecture (NestJS)

When adding new functionality:

1. **Create Module:** `nest g module <name>`
2. **Create Service:** `nest g service <name>`
3. **Create Controller:** `nest g controller <name>`
4. **Create DTOs:** Define validation classes
5. **Wire Dependencies:** Import PrismaModule if needed

### 3. Global Pipes & Filters

The following are configured globally in `main.ts`:

```typescript
// Validation (auto-validates DTOs)
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,      // Strip unknown properties
  transform: true,      // Auto-transform types
  forbidNonWhitelisted: true,  // Reject unknown fields
}));

// Exception handling (consistent error format)
app.useGlobalFilters(new HttpExceptionFilter());
```

### 4. DTO Validation

All DTOs should use `class-validator` decorators:

```typescript
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
```

### 5. Authentication

- **NEVER trust user-provided IDs in request body**
- **ALWAYS extract user ID from JWT payload:**

```typescript
@Get('profile')
@UseGuards(AuthGuard('jwt'))
getProfile(@Req() req: Request) {
  const userId = req.user.userId; // From JWT, NOT body
}
```

### 6. Testing Requirements

- **CRITICAL:** Update `TestCases.md` when adding features
- **E2E Tests:** Add to `apps/api/test/`
- **Run tests before committing:** `npm run test:e2e`

### 7. Documentation

- **CATALOG.md:** Log all changes after implementation
- **AGENT.md:** Update if architecture changes
- **NO NEW `.md` FILES:** Use existing documentation files

---

## 📂 Key Files Reference

### Backend (apps/api)

| File | Purpose |
|------|---------|
| `src/main.ts` | Application entry, global pipes/filters |
| `src/app.module.ts` | Root module, imports all modules |
| `prisma/schema.prisma` | Database schema |
| `src/common/filters/http-exception.filter.ts` | Global error handler |
| `src/auth/jwt.strategy.ts` | JWT authentication |
| `src/auth/google.strategy.ts` | Google OAuth |
| `src/prisma/prisma.service.ts` | Database service |

### Frontend (apps/web)

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout |
| `src/app/page.tsx` | Landing page |
| `src/app/globals.css` | Design system |
| `src/lib/api.ts` | Axios API client |
| `src/app/auth/callback/page.tsx` | OAuth callback |
| `src/app/dashboard/page.tsx` | User dashboard |
| `src/app/admin/page.tsx` | Admin dashboard |

---

## 🔐 Security Considerations

1. **JWT Storage:** Frontend stores in `localStorage`
2. **401 Handling:** Axios interceptor clears token on 401
3. **CORS:** Enabled in `main.ts` with `app.enableCors()`
4. **Validation:** All inputs validated via DTOs
5. **SQL Injection:** Prevented by Prisma parameterization
6. **XSS:** React auto-escapes, avoid `dangerouslySetInnerHTML`

---

## 🐳 Docker Deployment

```bash
# Build and run
docker compose up -d

# View logs
docker compose logs -f api

# Stop
docker compose down
```

The `compose.yaml` includes:
- NestJS API service
- PostgreSQL database
- Volume persistence for data

---

## 📝 Common Tasks

### Adding a New Admin Endpoint

1. Add method to `admin.service.ts`
2. Add endpoint to `admin.controller.ts`
3. Create DTO if needed in `admin/dto/`
4. Add test case to `TestCases.md`
5. Log change in `CATALOG.md`

### Adding a New Database Table

1. Add model to `prisma/schema.prisma`
2. Run `npx prisma generate`
3. Run `npx prisma db push`
4. Create NestJS module for the table
5. Update documentation

### Frontend API Integration

1. Add TypeScript interface for response
2. Create API call in component or lib
3. Handle loading and error states
4. Use Axios client from `src/lib/api.ts`

---

## 🔄 Migration from Legacy

The legacy Express.js codebase is preserved in `legacy_src/` for reference. Key differences:

| Aspect | Legacy (Express) | Current (NestJS) |
|--------|-----------------|------------------|
| Database | SQLite → PostgreSQL | PostgreSQL |
| ORM | Raw SQL | Prisma |
| Auth | Session-based | JWT |
| Validation | Manual | class-validator |
| Structure | MVC | Modular (NestJS) |
| Frontend | EJS/HTML | Next.js |

---

*Document maintained by ByteStart Engineering Team*  
*Last Updated: January 2, 2026*
