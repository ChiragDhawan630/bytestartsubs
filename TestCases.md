# ByteStart Platform - Test Cases & QA Documentation

> **Total Test Scenarios:** 130+ test cases covering failure points, edge cases, and security boundaries.  
> **Last Updated:** January 2, 2026 (v3.0.0 - PostgreSQL Migration)

## 📚 Related Documentation
- **[AGENT.md](./AGENT.md)** - Architecture, rules, and AI agent guide
- **[CATALOG.md](./CATALOG.md)** - Version history and proposed changes (The "Catalog")

---

## 📋 Table of Contents

1. [Authentication & Security](#1-authentication--security-15-scenarios)
2. [User Profile & Settings](#2-user-profile--settings-10-scenarios)
3. [Subscriptions & Payments](#3-subscriptions--payments-15-scenarios)
4. [Admin - Dashboard & Stats](#4-admin---dashboard--stats-5-scenarios)
5. [Admin - User Management](#5-admin---user-management-10-scenarios)
6. [Admin - Plans & Categories](#6-admin---plans--categories-15-scenarios)
7. [Admin - Settings & Environment](#7-admin---settings--environment-10-scenarios)
8. [Admin - Invoice Settings](#8-admin---invoice-settings-17-scenarios)
9. [Admin - Customers](#9-admin---customers-8-scenarios)
10. [Invoices](#10-invoices-10-scenarios)
11. [System & Infrastructure](#11-system--infrastructure-12-scenarios)
12. [PostgreSQL Migration](#12-postgresql-migration-8-scenarios)

---

## Test Status Legend

| Symbol | Meaning |
|:------:|:--------|
| ✅ | Completed & Passing |
| ⏳ | Pending / Not Implemented |
| ⏭️ | Skipped (Known limitation) |

---

## 1. Authentication & Security (15 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| 1 | **Admin Login - Empty Credentials** | 400 Bad Request | ✅ |
| 2 | **Admin Login - Invalid Email Format** (`admin@`) | 400 'Invalid email' | ✅ |
| 3 | **Admin Login - Wrong Password** | 401 Unauthorized | ✅ |
| 4 | **Admin Login - Non-existent Admin** | 401 Unauthorized | ✅ |
| 5 | **Rate Limiting - Admin Login** (6 failed in 1 min) | 429 Too Many Requests | ✅ |
| 6 | **Dev Login - Production Mode** | 404/403 Forbidden | ⏳ |
| 7 | **Dev Login - Empty Email** | 400 Bad Request | ✅ |
| 8 | **Google OAuth - Canceled Flow** | Handle error/redirect | ⏳ |
| 9 | **Session - Expired Cookie** | 401/Redirect | ⏳ |
| 10 | **Session - Tampered Cookie** | 401/Redirect | ⏳ |
| 11 | **CSRF - Cross-Origin Post** | CORS error / 403 | ⏳ |
| 12 | **Middleware - IsAdmin Bypass** (Normal user → admin) | 403 Forbidden | ✅ |
| 13 | **Middleware - Unauthenticated Admin Access** | 401/Redirect | ✅ |
| 14 | **SQL Injection - Login** (`' OR '1'='1`) | Auth failure (safe) | ✅ |
| 15 | **Logout - Repeated Calls** | 200/Redirect (idempotent) | ✅ |

---

## 2. User Profile & Settings (10 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| 16 | **Update Profile - Unauthenticated** | 401 Unauthorized | ✅ |
| 17 | **Update Profile - Missing Required Fields** | 400 Bad Request | ✅ |
| 18 | **Update Profile - Invalid Phone** (`abc`) | 400/DB constraint error | ✅ |
| 19 | **Update Profile - Giant Payload** (10MB) | 413 Payload Too Large | ✅ |
| 20 | **Update Profile - SQL Injection** (in GSTIN) | Safe handling | ✅ |
| 21 | **Update Theme - Invalid Value** (`blue`) | 400/Fallback | ✅ |
| 22 | **Get Profile - Database Down** | 500 Internal Server Error | ✅ |
| 23 | **My Subscriptions - No User** | 401 Unauthorized | ✅ |
| 24 | **My Subscriptions - DB Error** | 500 Internal Server Error | ✅ |
| 25 | **Sync Subscriptions - Razorpay Timeout** | 500/Partial Success | ✅ |
| 25a | **Update Profile - Sync to Customers** | Linked customer record updated | ✅ |

---

## 3. Subscriptions & Payments (15 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| 26 | **Create Sub - No Plan Type** | 400 Bad Request | ✅ |
| 27 | **Create Sub - Invalid Plan Type** | 400 'Plan not found' | ✅ |
| 28 | **Create Sub - DB Plan ID Missing** | 400/500 Config Error | ✅ |
| 29 | **Create Sub - Razorpay API Fail** | 500 to client | ✅ |
| 30 | **Verify Payment - Missing Params** | 400 Bad Request | ✅ |
| 31 | **Verify Payment - Invalid ID** | 400/404 | ✅ |
| 32 | **Verify Payment - Already Active** | Idempotent 200 or 400 | ✅ |
| 32a | **Renewal Date Accuracy** | Current end from Razorpay matches UI | ✅ |
| 33 | **Resubscribe - Missing Original Sub ID** | 400 Bad Request | ✅ |
| 34 | **Resubscribe - ID Not Found** | 404 Not Found | ✅ |
| 35 | **Resubscribe - Foreign User** | 403 Forbidden | ✅ |
| 36 | **Email - Verify Failure** | 200 (graceful degrade) | ✅ |
| 37 | **Plan Config - Env Var Missing** | 400/500 | ✅ |
| 38 | **Payment - Signature Mismatch** | 400 Bad Request | ✅ |
| 39 | **Concurrent Creation** (10x clicks) | Handled gracefully | ✅ |
| 40 | **Plan Logic - Deleted Plan** (`is_active=0`) | 400 Bad Request | ✅ |

---

## 4. Admin - Dashboard & Stats (5 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| 41 | **Stats - DB Lock** (`SQLITE_BUSY`) | 500 Internal Server Error | ⏭️ |
| 42 | **Activity Logs - Huge Data** (1M rows) | Paginated / Timeout handled | ✅ |
| 43 | **Error Logs - Clear Fail** | 500 Internal Server Error | ✅ |
| 44 | **Resolve Error - Invalid ID** (999999) | 200 (idempotent) / 404 | ✅ |
| 45 | **Stats - Calculation Overflow** | Correct JSON number | ✅ |

---

## 5. Admin - User Management (10 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| 46 | **Get Users - Filter Injection** | Sanitized query | ✅ |
| 47 | **Update User - Duplicate Email** | 400/Unique Constraint | ✅ |
| 48 | **Update User - Missing ID** | 404 Not Found | ✅ |
| 49 | **Update User - Invalid ID Type** (`abc`) | 400/SQL error handled | ✅ |
| 50 | **Delete User - Cascade Fail** (active subs) | DB constraint / cleanup | ✅ |
| 51 | **User List - Pagination** (page -1, `abc`) | Default to page 1 | ✅ |
| 52 | **Update User - Read Only Fields** | Ignored or 400 | ✅ |
| 53 | **Update User - Null Values** (name) | 400 Bad Request | ✅ |
| 54 | **Fetch User - Deleted** | 404 Not Found | ✅ |
| 55 | **Audit Log - Update** (log insert fails) | Rollback or warning | ✅ |
| 55a | **Create User - Admin Interface** | 200 OK / User Created | ✅ |
| 55b | **Update User - Address Details** | Persistence of city/state/pincode | ✅ |
| 55c | **Edit User - Email Read Only** | Email field disabled in edit mode | ✅ |

---

## 6. Admin - Plans & Categories (15 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| 56 | **Create Category - Duplicate ID** | 500/Unique Constraint | ✅ |
| 57 | **Create Category - Missing Name** | 500 (SQL Not Null) | ✅ |
| 58 | **Update Category - Invalid ID** | 404 Not Found | ✅ |
| 59 | **Delete Category - In Use** | DB Constraint Error | ✅ |
| 60 | **Create Plan - Invalid JSON Features** | Parse error / text storage | ✅ |
| 61 | **Create Plan - Negative Price** (-100) | 200 or 400 | ✅ |
| 62 | **Update Plan - Razorpay ID Mismatch** | Inconsistency noted | ✅ |
| 63 | **Delete Plan - Active Subs Linked** | DB Constraint | ✅ |
| 64 | **Razorpay Plan Create - API Fail** | 500 'Razorpay Error' | ✅ |
| 65 | **Razorpay Plan Create - Invalid Input** | 400 → 500 | ✅ |
| 66 | **Get Plans - Empty DB** | 500 Internal Server Error | ✅ |
| 67 | **Plan Color - Invalid Hex** (`red`) | Stored as is / 400 | ✅ |
| 68 | **Sync Plans - Partial Fail** | Partial update state | ⏳ |
| 69 | **Plan Sort Order - Duplicate** | Server accepts | ✅ |
| 70 | **Category Icon - XSS** (`<script>`) | Stored (client sanitize) | ✅ |

---

## 7. Admin - Settings & Environment (10 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| 71 | **Update Settings - SQL Injection** | Safe storage (text) | ✅ |
| 72 | **Update Settings - Giant Policy** (5MB) | 413 or truncation | ✅ |
| 73 | **Get Env - File Perms** | 500 or empty values | ✅ |
| 74 | **Update Env - Write Error** | 500 Internal Server Error | ✅ |
| 75 | **Update Env - Invalid Key** | Ignored (whitelist) | ✅ |
| 76 | **Update Env - Syntax Error** | Handled / corruption | ✅ |
| 77 | **Update Env - Reload Fail** | Stale config | ✅ |
| 78 | **Settings - Missing Keys** | Empty object | ✅ |
| 79 | **Policy - Missing Type** | 404 Not Found | ✅ |
| 80 | **Policy - Invalid Type** (`hack`) | 404 'Policy not found' | ✅ |
| 80a | **Email Template - Select** | Correct content populated in modal | ✅ |
| 80b | **Email Template - Save** | Template persists in DB | ✅ |
| 80c | **Email Template - Variables** | `{{customer_name}}` etc replaced correctly | ✅ |
| 80d | **Email Template - Manual Edit** | Overrides work without changing seed | ✅ |
| 80e | **Email Templates - List** | All seeded templates visible | ✅ |

---

## 8. Admin - Invoice Settings (17 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| I1 | **Valid GSTIN Format** (`22AAAAA0000A1Z5`) | 200 OK | ✅ |
| I2 | **Invalid GSTIN Format** (`INVALID123`) | 400 with error | ✅ |
| I3 | **Valid PAN Format** (`AAAAA0000A`) | 200 OK | ✅ |
| I4 | **Invalid PAN Format** (`12345ABCDE`) | 400 with error | ✅ |
| I5 | **Valid IFSC Format** (`HDFC0001234`) | 200 OK | ✅ |
| I6 | **Invalid IFSC Format** (`INVALID`) | 400 with error | ✅ |
| I7 | **Valid Tax Rates** (CGST 9%, SGST 9%) | 200 OK | ✅ |
| I8 | **Invalid Tax Rate - Negative** (`-5`) | 400 Bad Request | ✅ |
| I9 | **Invalid Tax Rate - Too High** (`75`) | 400 Bad Request | ✅ |
| I10 | **Valid Due Days** (`30`) | 200 OK | ✅ |
| I11 | **Invalid Due Days - Too High** (`500`) | 400 Bad Request | ✅ |
| I12 | **Optional Fields Accept Empty** | 200 OK | ✅ |
| I13 | **Valid State Code** (`27`) | 200 OK | ✅ |
| I14 | **Invoice Terms - Long Text** | 200 OK | ✅ |
| I15 | **Invoice Prefix** (`INV-2024/`) | 200 OK | ✅ |
| I16 | **Currency Symbol** (`₹`) | 200 OK | ✅ |
| I17 | **UPI ID** (`company@upi`) | 200 OK | ✅ |

---

## 9. Admin - Customers (8 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| C81 | **Get Customers - Security** | Admin access only | ✅ |
| C82 | **Update Customer - Validation** | 200 OK | ✅ |
| C83 | **Create Customer - Duplicate Email** | 400/Unique Constraint | ✅ |
| C84 | **Delete Customer - Linked Invoices** | Blocked | ✅ |
| C85 | **Customer List - Large** | Handled | ✅ |
| C86 | **Get Customer - Not Found** | 404 Not Found | ✅ |
| C88 | **Create Customer - Missing Name** | 400 Bad Request | ✅ |
| C89 | **Tax ID - Validation** | 200 OK (no format check) | ✅ |

---

## 10. Invoices (10 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| 81 | **Create Invoice - Missing Items** | 400/logic error | ✅ |
| 82 | **Create Invoice - Invalid User** (999) | DB constraint error | ✅ |
| 83 | **Generate PDF - Asset Missing** | 500 / broken placeholder | ✅ |
| 84 | **Generate PDF - Write Perms** | 500 Internal Server Error | ✅ |
| 85 | **Send Email - SMTP Auth Fail** | 500/Log error | ✅ |
| 86 | **Send Email - Invalid Recipient** (`bob@`) | Nodemailer error | ✅ |
| 87 | **Delete Invoice - Not Found** (999) | 200 (idempotent) / 404 | ✅ |
| 88 | **Get Invoice - ID Mismatch** | 404 Not Found | ✅ |
| 90 | **Automated Gen - Concurrent Run** | Duplicate handling needed | ⏳ |
| 90a | **Generate PDF - Bill To Layout** | No truncation with long address | ✅ |

---

## 11. System & Infrastructure (12 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| 91 | **Startup - DB Missing** | Create empty DB | ✅ |
| 92 | **Startup - Port in Use** | Crash `EADDRINUSE` | ✅ |
| 93 | **Startup - Bad .env** | Crash or partial load | ✅ |
| 94 | **Memory Leak** (1 hour test) | Stable heap | ✅ |
| 95 | **Unhandled Exception** | Global error handler | ✅ |
| 96 | **CORS - OPTIONS Request** | 200/204 OK | ✅ |
| 97 | **Static Files - Directory Traversal** | 403/404 | ✅ |
| 98 | **Large Request Body** (50MB) | 413 Payload Too Large | ✅ |
| 99 | **Malformed JSON** | 400 Syntax Error | ✅ |
| 100 | **Network - Database Timeout** | 500 Connection Error | ✅ |
| 101 | **Route 404** | 404 JSON response | ✅ |
| 102 | **Method Not Allowed** | 404/405 | ✅ |
| 102a| **Database - Schema v5 Migration** | Auto-applied on startup | ⏳ |

---

## 12. PostgreSQL Migration (8 Scenarios)

| # | Test Case | Expected Result | Status |
|:-:|:----------|:----------------|:------:|
| PG1 | **Database Connection** | Pool connects successfully | ✅ |
| PG2 | **Connection Pool Exhaustion** | Graceful queue/timeout | ⏳ |
| PG3 | **Query Parameterization** | `$1, $2` syntax works | ✅ |
| PG4 | **Transaction Support** | BEGIN/COMMIT/ROLLBACK work | ⏳ |
| PG5 | **RETURNING Clause** | lastID equivalent works | ✅ |
| PG6 | **Concurrent Writes** | No lock errors (vs SQLite) | ⏳ |
| PG7 | **NULL vs Empty String** | Handled consistently | ⏳ |
| PG8 | **Timestamp Handling** | Dates stored/retrieved correctly | ✅ |

---

## 📊 Execution Summary

### Overall Statistics

| Category | Total | Passed | Pending | Skipped |
|:---------|:-----:|:------:|:-------:|:-------:|
| Authentication & Security | 15 | 11 | 4 | 0 |
| User Profile & Settings | 11 | 11 | 0 | 0 |
| Subscriptions & Payments | 15 | 15 | 0 | 0 |
| Admin - Dashboard | 5 | 4 | 0 | 1 |
| Admin - User Management | 13 | 13 | 0 | 0 |
| Admin - Plans & Categories | 15 | 14 | 1 | 0 |
| Admin - Settings | 10 | 10 | 0 | 0 |
| Admin - Email Templates | 6 | 5 | 1 | 0 |
| Admin - Invoice Settings | 17 | 17 | 0 | 0 |
| Admin - Customers | 8 | 8 | 0 | 0 |
| Invoices | 11 | 10 | 1 | 0 |
| System & Infrastructure | 13 | 13 | 0 | 0 |
| **TOTAL** | **133** | **126** | **6** | **1** |

---

### Session 8: User Data & Invoicing Fixes (Jan 1, 2026)

| Test ID | Issue | Fix Applied |
|:--------|:------|:------------|
| 25a | Profile changes not syncing | Added sync logic to `userController.updateProfile` |
| 55a-c | Admin user management | Added `createUser` and fixed `globalUsers` in admin.js |
| 90a | PDF Truncation | Increased width and added wrapping in `invoiceService.js` |
| 102a | Database Scalability | Implemented v2 migration in `db/schema.js` and `migrate.js` |
| 108 | Email Templates & Unified Flow | Implemented `email_templates` system and unified "Approve & Send" |
| 109 | Subscription Dates Fix | Added `renewal_date` synced from Razorpay (v4 migration) |
| 110 | Automatic Sync (Startup & Cron) | Integrated `syncService` with `node-cron` in `server.js` |

---

## 📁 Test File Locations
| 19 | Giant payload | Updated global error handler for 413 status |
| 30-32 | Payment verification | Added subscription ID validation and idempotency |
| 35 | Resubscribe security | Added ownership check in `resubscribe` |
| 38 | Signature verification | Implemented HMAC SHA256 verification |
| 47 | Duplicate email | Added duplicate check in `updateUser` |
| 50 | User delete cascade | Block delete if active subscriptions exist |
| 59 | Category delete | Block delete if linked plans exist |
| 63 | Plan delete | Block delete if active subscriptions exist |

### Session 8: Post-Fix Verification

| Test ID | Issue | Fix Applied |
|:--------|:------|:------------|
| 103 | Admin Logout | Fixed frontend redirect to `/auth/logout` |
| 104 | SMTP Test | Implemented `testSmtp` controller and service |
| 105 | Invoice PDF | Added padding for logo (y=50), text start (y=120) |
| 106 | Invoice Send Error | Return detailed SMTP error to UI |
| 107 | Env Hot Reload | Backend updates `process.env` immediately |

### Session 9: Invoice Settings Validation

| Test ID | Issue | Fix Applied |
|:--------|:------|:------------|
| I1-I2 | GSTIN validation | Added 15-char regex pattern |
| I3-I4 | PAN validation | Added 10-char regex pattern |
| I5-I6 | IFSC validation | Added 11-char regex pattern |
| I7-I9 | Tax rate validation | Range check 0-50% |
| I10-I11 | Due days validation | Range check 0-365 |
| I12 | Optional fields | Skip validation for empty strings |

### Session 10: Site Settings & UI Fixes (Current)

| Test ID | Issue | Fix Applied | Status |
|:--------|:------|:------------|:------:|
| 108 | Settings Empty Values | Backfilled empty/missing values with defaults in `migrate.js` | ✅ |
| 109 | Settings Routes Missing | Added `/settings` and `/env` routes to `adminRoutes.js` | ✅ |
| 110 | Homepage UI Dark Mode | Improved contrast for "Renewed [period]" tag using blue theme | ✅ |
| 111 | Missing Seed Keys | Added `sale_banner_text`, `homepage_title`, etc. to `SEEDS.settings` | ✅ |
| 112 | Home Theme Removal | Removed dark mode toggle and overrides from `index.html` | ✅ |

---

## 📁 Test File Locations

| Test Suite | File Path |
|:-----------|:----------|
| Authentication | `src/tests/auth.test.js` |
| User Profile | `src/tests/user.test.js` |
| Subscriptions | `src/tests/subscriptions.test.js` |
| Admin Dashboard | `src/tests/admin.test.js` |
| Admin Users | `src/tests/admin_users.test.js` |
| Admin Plans | `src/tests/admin_plans.test.js` |
| Admin Settings | `src/tests/admin_settings.test.js` |
| Customers | `src/tests/customers.test.js` |
| Invoices | `src/tests/invoices.test.js` |
| System | `src/tests/system.test.js` |

---

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/tests/admin_settings.test.js

# Run with verbose output
npm test -- --verbose
```

---

*Document maintained by ByteStart Engineering Team*
