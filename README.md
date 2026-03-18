# ShiftPulse

**Workforce Timekeeping & Shift Management Platform for Healthcare Staffing**

ShiftPulse is a full-stack, multi-tenant SaaS platform built for nurse registries, home health agencies, and healthcare staffing organizations. It handles clock-in/out tracking, shift scheduling, worker management, EVV compliance, payroll exports, and audit logging — all with role-based access for workers, companies, and platform admins.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

### Worker Portal
- **Clock In/Out** with GPS capture and live status display
- **Shift Browsing** — view available open shifts and request assignments
- **Manual Time Entry** — submit entries for companies that allow it
- **Time History** — full log of all entries with status tracking (pending, approved, rejected)
- **Weekly Availability** — set recurring availability by day/time
- **Profile Management** — edit personal info, license details, specialties, hourly rate
- **Multi-Company Support** — join multiple companies via join codes
- **Notifications** — in-app notifications with 30s polling

### Company Portal
- **Dashboard** — visit status cards, weekly hours chart, pending approvals, live metrics
- **Worker Management** — approve/reject membership requests, view worker details and availability
- **Shift Management** — create shifts, assign workers via dialog, track assignments
- **Recurring Shift Templates** — define templates by day-of-week, bulk-generate shifts for date ranges
- **Schedule Management** — create, publish/unpublish, and delete schedules
- **Time Entry Review** — approve/reject with custom rejection reasons, EVV status badges
- **Payroll Export** — generate CSV exports by date range with overtime calculations, download history
- **Reports** — weekly hours chart, hours by worker, export integration
- **Settings** — company policies, timekeeping rules, overtime thresholds, EVV/geofencing config

### Admin Portal
- **Platform Dashboard** — company count, worker count, time entries, manual entry metrics
- **User Management** — view all users with pagination, activate/deactivate accounts
- **Company Management** — view all companies with pagination, activate/deactivate
- **Time Entry Oversight** — paginated view of all entries across the platform
- **Audit Log** — complete audit trail with pagination, actor tracking
- **Platform Settings** — feature flags and configuration display

### Cross-Cutting
- **EVV / Geofencing** — GPS capture on clock-in/out, Haversine distance calculation, configurable radius, verified/flagged status
- **Progressive Web App** — installable, service worker with offline caching, mobile install prompt
- **Email Notification Infrastructure** — pluggable email abstraction (ready for SendGrid/Resend/SES)
- **Role-Based Middleware** — automatic route protection and cross-role redirect
- **Rate Limiting** — database-backed, 10 attempts / 15 min on login/signup
- **Soft Deletes** — `deletedAt` on all major models for data preservation
- **Multi-Timezone** — format functions accept timezone param, per-user/company timezone stored
- **Complete Audit Logging** — 22 action types tracked with before/after snapshots

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS 4 |
| **Components** | Custom component library (CVA + Tailwind Merge) |
| **Database** | PostgreSQL (Neon-compatible) |
| **ORM** | Prisma 5 |
| **Authentication** | Auth.js / NextAuth v5 (JWT strategy, credentials provider) |
| **Validation** | Zod |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Utilities** | date-fns, nanoid, bcryptjs, clsx |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** database (local, Neon, Supabase, or any PostgreSQL provider)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nurse-workforce-platform.git
cd nurse-workforce-platform

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

# Push database schema
npx prisma db push

# Seed with demo data
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

All demo accounts use password: **`password123`**

| Role | Email | Organization |
|------|-------|-------------|
| Admin | `admin@shiftpulse.com` | Platform administrator |
| Company | `sarah@sunrisehealth.com` | Sunrise Home Health |
| Company | `michael@humanityhealth.com` | Humanity & Blessing Home Health Corp |
| Worker | `maria@example.com` | CNA, Home Health Aide |
| Worker | `james@example.com` | RN, Wound Care |
| Worker | `aisha@example.com` | LPN, Pediatrics |
| Worker | `robert@example.com` | CNA, Geriatrics |
| Worker | `lisa@example.com` | RN, IV Therapy |
| Worker | `david@example.com` | LPN, Diabetes Care |

**Company Join Codes:**
- Sunrise Home Health: `SUNR1234`
- Humanity & Blessing: `HUMA5678`

---

## Project Structure

```
nurse-workforce-platform/
├── prisma/
│   ├── schema.prisma          # Database schema (20 models, 8 enums)
│   └── seed.ts                # Seed script with demo data
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── icons/                 # PWA icons
├── src/
│   ├── actions/               # Server actions (RPC-style)
│   │   ├── auth.ts            # Sign in/up/out with rate limiting
│   │   ├── clock.ts           # Clock in/out with EVV/geofencing
│   │   ├── company.ts         # Company CRUD, assignments, settings
│   │   ├── admin.ts           # Admin queries and actions
│   │   ├── availability.ts    # Worker availability management
│   │   ├── notifications.ts   # Notification CRUD and preferences
│   │   ├── payroll.ts         # Export generation and history
│   │   ├── shifts.ts          # Shift templates and generation
│   │   └── worker.ts          # Worker profile updates
│   ├── app/
│   │   ├── (auth)/            # Protected routes
│   │   │   ├── admin/         # Admin portal (6 pages)
│   │   │   ├── company/       # Company portal (9 pages)
│   │   │   └── worker/        # Worker portal (5 pages)
│   │   ├── (public)/          # Public routes (login, signup)
│   │   ├── api/               # API routes (auth, exports)
│   │   ├── layout.tsx         # Root layout with PWA
│   │   └── page.tsx           # Landing page
│   ├── auth/                  # Auth.js configuration
│   ├── components/
│   │   ├── admin/             # Admin components (pagination, actions)
│   │   ├── company/           # Company components (forms, dialogs, charts)
│   │   ├── layout/            # Sidebar, top bar, notifications
│   │   ├── pwa/               # PWA install prompt, SW register
│   │   ├── shared/            # Metric card, empty state
│   │   ├── ui/                # Base components (button, input, card, etc.)
│   │   └── worker/            # Worker components (clock, forms, editors)
│   ├── lib/
│   │   ├── auth-utils.ts      # Session helpers, role enforcement
│   │   ├── db.ts              # Prisma client + soft delete helpers
│   │   ├── email.ts           # Email abstraction layer
│   │   ├── geofence.ts        # Haversine distance + geofence check
│   │   ├── notify.ts          # Unified notification dispatch
│   │   ├── payroll.ts         # CSV generation + overtime calculation
│   │   ├── rate-limit.ts      # Database-backed rate limiter
│   │   └── utils.ts           # Formatting, date helpers, utilities
│   ├── middleware.ts          # Route protection + role-based routing
│   ├── providers/             # SessionProvider wrapper
│   └── types/                 # TypeScript type definitions
├── .env                       # Environment variables
├── next.config.ts             # Next.js configuration
├── package.json
└── tsconfig.json
```

---

## Architecture

### Authentication Flow
1. Credentials-based auth with bcrypt password hashing (12 rounds)
2. JWT session strategy (no database sessions for speed)
3. Role embedded in JWT token (WORKER, COMPANY, ADMIN)
4. Middleware enforces route protection — workers can't access `/company/*`, etc.
5. Rate limiting on login/signup (10 attempts per 15-minute window)

### Data Model
- **Multi-tenant** — Companies are isolated; workers can belong to multiple companies
- **Membership model** — Workers connect to companies via join codes, with approval workflow
- **Soft deletes** — `deletedAt` field on User, Company, Shift, Schedule, Assignment, TimeEntry
- **Audit trail** — Every significant action logged with actor, entity, before/after state

### EVV / Geofencing
1. Worker's browser requests GPS via `navigator.geolocation`
2. Coordinates sent with clock-in/out server action
3. Server calculates Haversine distance to shift location (or company HQ)
4. Entry flagged as `verified` (within radius) or `flagged` (outside radius)
5. Company dashboard shows EVV status badges on time entries

### Notification System
- In-app notifications stored in database
- 30-second polling for unread count
- Pluggable email delivery (console in dev, swap in SendGrid/Resend for production)
- Unified `sendNotification()` function with channel routing

---

## API Reference

### Server Actions

Server actions are the primary API — called directly from React components via `"use server"`.

| Module | Actions |
|--------|---------|
| `auth` | `signUpAction`, `signInAction`, `signOutAction` |
| `clock` | `clockIn`, `clockOut`, `createManualTimeEntry`, `getClockStatus` |
| `company` | `getCompanyForUser`, `joinCompanyByCode`, `approveMembership`, `rejectMembership`, `createShift`, `assignWorkerToShift`, `cancelAssignment`, `handleShiftRequest`, `requestShift`, `approveTimeEntry`, `rejectTimeEntry`, `updateCompanySettings`, `createSchedule`, `publishSchedule`, `unpublishSchedule`, `deleteSchedule` |
| `admin` | `getAdminDashboardMetrics`, `getAllCompanies`, `getAllUsers`, `getAuditLogs`, `getAllTimeEntries`, `toggleUserActive`, `toggleCompanyActive` |
| `shifts` | `createShiftTemplate`, `updateShiftTemplate`, `deleteShiftTemplate`, `generateShiftsFromTemplates`, `getShiftTemplates` |
| `availability` | `getAvailability`, `setAvailability`, `addDateOverride`, `removeSlot` |
| `payroll` | `generateExport`, `getExportHistory`, `getExportById` |
| `notifications` | `getNotifications`, `getUnreadCount`, `markNotificationRead`, `markAllNotificationsRead`, `getNotificationPreferences`, `updateNotificationPreferences` |
| `worker` | `updateWorkerProfile` |

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/exports/[id]` | Download payroll export as CSV |
| `*` | `/api/auth/[...nextauth]` | Auth.js endpoints |

---

## Database Schema

**20 models** across the platform:

| Model | Purpose |
|-------|---------|
| `User` | Core user (email, password, role, timezone) |
| `Account`, `Session`, `VerificationToken` | Auth.js integration |
| `WorkerProfile` | License, specialties, certifications, hourly rate |
| `CompanyProfile` | Company details tied to user account |
| `Company` | Multi-tenant company with settings flags |
| `CompanyMembership` | Worker-company relationship with approval status |
| `AvailabilitySlot` | Worker weekly availability by day/time |
| `ShiftTemplate` | Recurring shift templates with day-of-week scheduling |
| `Shift` | Individual shifts with date, time, location, GPS coords |
| `Schedule` | Named schedules with date ranges |
| `Posting` | Job postings (extensible) |
| `Assignment` | Worker-shift assignments with status workflow |
| `TimeEntry` | Clock-in/out records with EVV data |
| `ClockEvent` | Raw clock events for audit trail |
| `AuditLog` | Complete audit log (22 action types) |
| `Notification` | In-app notifications with read status |
| `Settings` | Per-company timekeeping configuration |
| `PayrollExport` | Generated export records with CSV data |
| `RateLimitEntry` | Rate limiting state |

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Auth.js
AUTH_SECRET="generate-a-secure-random-string"
AUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_NAME="ShiftPulse"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Email provider
# EMAIL_PROVIDER_API_KEY=your-sendgrid-or-resend-key
```

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database with demo data
npm run db:push      # Push schema to database (no migrations)
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database and re-seed
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables (`DATABASE_URL`, `AUTH_SECRET`)
4. Deploy — Vercel auto-detects Next.js

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Database

Any PostgreSQL 14+ provider works:
- **[Neon](https://neon.tech)** — serverless, generous free tier
- **[Supabase](https://supabase.com)** — managed PostgreSQL
- **[Railway](https://railway.app)** — simple deployment
- **Self-hosted** — any PostgreSQL instance

---

## Roadmap

### Completed
- [x] Multi-role authentication (Worker, Company, Admin)
- [x] Clock in/out with GPS tracking
- [x] EVV / Geofencing compliance
- [x] Shift management and assignments
- [x] Recurring shift templates
- [x] Worker availability calendar
- [x] Time entry approval workflow
- [x] Payroll CSV export
- [x] Progressive Web App
- [x] Email notification infrastructure
- [x] Rate limiting
- [x] Audit logging
- [x] Soft deletes

### Planned
- [ ] Real-time push notifications (WebSocket/SSE)
- [ ] Document verification and worker credentialing
- [ ] Approval chains and supervisor tiers
- [ ] Multi-location org structures
- [ ] HIPAA-conscious data handling
- [ ] Native mobile app (React Native / Expo)
- [ ] Payroll integrations (ADP, Paychex)
- [ ] Advanced reporting and analytics dashboard

---

## License

Proprietary. All rights reserved.
