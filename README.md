# LM Verify — Unified Online Verification & Digital Certification System

A full-stack web (and mobile/PWA-enabled) platform for the **Legal Metrology ecosystem** of India —
online verification, digital certification and lifecycle management of weighing and measuring
instruments under the **Legal Metrology Act, 2009** and **Legal Metrology (General) Rules, 2011**.

Built for the Smart India Hackathon.

---

## Feature Map (Problem Statement → Implementation)

| Required capability | Implemented |
|---|---|
| Online registration of stakeholders | Role-based sign-up for **Business/User, LMO, Approved Test Centre (GATC)**; Admin manages all accounts (`/api/auth/register`, `/api/users`) |
| Online application for verification / re-verification | `POST /api/applications` with instrument, type (NEW / REVERIFICATION), preferred date, remarks |
| Scheduling & allocation to LMOs / GATCs | `PATCH /api/applications/:id/assign` — pick officer/GATC, set scheduled date and fee |
| Digital verification certificates with QR codes | `POST /api/verifications` issues a certificate; QR encodes the **public verification URL** (`/api/certificates/verify/:certNo`) |
| Recording inspection observations digitally | Structured field-verification form with observations, PASS/FAIL, validity period |
| Tracking validity & due dates | Every certificate carries `validFrom` / `validUntil`; instrument status auto-updates (VERIFIED / EXPIRED / REJECTED) |
| Automated alerts & reminders | Expiry + renewal reminders auto-created on issue and due, surfaced in `Alerts`, bell badge in the header |
| Dashboards for all stakeholders | Role-aware dashboards for Business, LMO/GATC and Admin with pendency, certificates, and charts |
| Mobile support / field verification | PWA (installable, offline shell, service worker) + dedicated "Field Verification" flow on mobile-friendly UI |
| Digital repository | Centralized registry with full **verification history** per instrument |
| Search & retrieval | `/api/search` across instruments, applications and certificates; public certificate validation portal |
| Export & printing | Printable, printer-optimized certificate view (`window.print()` → PDF) |
| Role-based secure login | JWT auth + RBAC middleware + account suspension |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite 6), React Router 6, Tailwind CSS v4, Recharts, lucide-react, **vite-plugin-pwa** |
| Backend | Node.js 20+, Express 4 (ES Modules) |
| Database / ORM | SQLite + Prisma 6 (swap `DATABASE_URL` to PostgreSQL/MySQL for production) |
| Auth | bcryptjs password hashing, JWT (7d expiry), per-role authorization |
| Validation | Zod schemas on every mutating endpoint |
| Files | multer (images, PDFs, Office docs, ≤ 10 MB), served under `/uploads` |
| QR | `qrcode` package → data-URL PNGs embedded in certificates |

---

## Getting Started

Prerequisites: Node 18+ (Node 20 LTS recommended).

```bash
# 1. Install all dependencies (server + client + root)
npm run install:all

# 2. Generate Prisma client, create SQLite DB, seed demo data
npm run setup

# 3. Run both dev servers (server :4000, client :5173)
npm run dev
# or individually:
npm run dev:server
npm run dev:client
```

Open **http://localhost:5173**.

### Demo credentials (seeded)

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@lm.gov.in` | `admin123` |
| Legal Metrology Officer | `lmo@lm.gov.in` | `lmo123` |
| Approved Test Centre | `gatc@lm.gov.in` | `gatc123` |
| Business | `business@example.com` | `business123` |

> There is also a second business (`patil@example.com` / `business123`) with an **expired** instrument
> and a certificate expiring soon — ideal for demonstrating expiry alerts.

### Typical user flows

- **Business**: register → add instrument → apply for verification → (officer verifies) → view/download QR certificate → receive expiry reminders.
- **Admin**: assign a submitted application to an LMO/GATC → monitor state dashboards.
- **LMO / GATC**: open assigned application → "Record Verification & Issue Certificate" → PASS/FAIL + observations → digital certificate with QR.

---

## Project Structure

```
├── package.json            # root scripts (install:all, setup, dev)
├── server/
│   ├── prisma/
│   │   ├── schema.prisma   # data model
│   │   └── seed.js         # demo data + 4 roles
│   └── src/
│       ├── index.js        # Express app, static serving, error wiring
│       ├── middleware/
│       │   ├── auth.js     # authenticate (JWT) + authorize (roles)
│       │   ├── upload.js   # multer config
│       │   └── error.js    # Zod/Prisma-aware error mapping
│       ├── lib/            # prisma client, jwt/bcrypt, id + crypto helpers
│       └── routes/         # auth, users, instruments, applications,
│                           # verifications, certificates, alerts,
│                           # documents, dashboard, search
└── client/
    ├── src/
    │   ├── pages/          # Landing, Login, Register, Dashboard,
    │   │                   # Instruments(+detail), Applications(+new+detail),
    │   │                   # VerifyEntry, Verifications(+detail),
    │   │                   # Certificates(+view), PublicVerify, Alerts,
    │   │                   # SearchPage, AdminUsers
    │   ├── components/     # Layout (sidebar/header, alerts bell), ui kit
    │   ├── api.js          # fetch wrapper + token handling
    │   └── auth.jsx        # Auth context
    └── vite.config.js      # dev proxy :5173 → :4000, PWA manifest
```

---

## Architecture

```
            ┌───────────────   Clients   ───────────────┐
            │  Browser (React SPA)  ·  PWA / Mobile app  │
            └───────────────┬───────────────────────────┘
                            │ HTTPS · JSON (REST)
                            ▼
                 ┌───────────────────────┐
                 │   Express API (:4000) │
                 │  jwt auth ── RBAC     │
                 │  zod validation       │
                 └───────┬───────────────┘
                         │  Prisma ORM
                         ▼
                  ┌─────────────┐   ┌────────────┐
                  │ SQLite/Postgres│ ✓ │ Certificates:  │
                  │ (all records) │   │ QR encoding the │
                  └─────────────┘   │ public verify URL│
                                    └────────────┘
```

### Data model (Prisma)

- **User** — all stakeholders; `role` ∈ {ADMIN, LMO, GATC, BUSINESS}; status ACTIVE/SUSPENDED.
- **Instrument** — physical weighing/measuring device owned by a business.
- **Application** — verification / re-verification request; status machine `SUBMITTED → SCHEDULED → IN_PROGRESS → VERIFIED | REJECTED | CANCELLED`; carries assignment and fee.
- **Verification** — the actual inspection record (result, observations, due date), linked to its application and instrument, recorded by an officer.
- **Certificate** — issued only on PASS; unique number, validity window, embedded QR data-URL, and a **SHA-256 verification hash** for tamper-evidence.
- **Alert** — expiry / due / application notifications per user.
- **Document** — supporting attachments per application.

---

## Security Framework

- **Secrets**: passwords bcrypt-hashed (10 rounds); JWT signed with `JWT_SECRET`; secrets only in `server/.env` (git-ignored through `.env.example`-style `.env`; `.gitignore` excludes it — distribute the file separately).
- **Authentication**: Bearer JWT (`sub`, `role`), enforced first in the middleware chain; accounts can be suspended by admin.
- **Authorization (RBAC)**:
  - Businesses may only manage their own instruments; may not assign or verify.
  - LMO/GATC may only handle applications **assigned to them**; only they can post verification results.
  - Admin can assign, re-assign, suspend accounts, and view all records.
  - Verify endpoints reject requests where `assignedToId !== req.user.id` unless admin.
- **Input validation**: Zod schemas reject malformed payloads with 400 (and never leak stack traces to clients).
- **Uploads**: whitelisted MIME types, 10 MB limit, random filenames, download access-control checks.
- **Anti-tamper certificates**: a unique `verificationHash = SHA-256(certNo | instrumentId | dates)` is printed on the certificate; consumers can compare against the public verify endpoint response. Certificates resolve to a QR URL encoded with `encodeURIComponent` so certificate numbers containing path characters stay routable.
- **Public surface**: only the certificate **lookup** endpoint is public (for QR scanning); everything else requires auth.

---

## Deployment

### Local / demo

```bash
npm run install:all
npm run setup
npx prisma studio --schema server/prisma/schema.prisma   # optional DB browser
npm run dev
```

### Production build

```bash
npm --prefix client run build      # emits client/dist
NODE_ENV=production node server/src/index.js
```

The Express server serves `client/dist` statically with SPA fallback **and** the `/api` routes on
one port — a single container/image can run the whole app.

### Recommended production topology

- **DB**: replace `DATABASE_URL` with managed PostgreSQL (Prisma supports it with a provider swap + `migrate deploy` instead of `db push`).
- **Static/API**: any Node host (Render, Railway, Fly.io) or container; frontend built once at deploy time.
- **HTTPS + TLS termination**: reverse proxy (nginx/Caddy) injecting `X-Forwarded-*`; set `CLIENT_URL`, `PUBLIC_URL` (public origin used inside QR codes), and a strong `JWT_SECRET`.
- **Migrations**: use `prisma migrate deploy` in CI/CD; keep `prisma migrate dev` for local.
- **Backups**: SQLite → scheduled copy; PostgreSQL → managed automated backups.
- **Monitoring**: application logs to stdout; add APM (Sentry/Prometheus) — error handler already centralises logging.
- **Containerize**:
  ```dockerfile
  FROM node:20-slim
  WORKDIR /app
  COPY package*.json ./
  COPY client/package.json client/
  COPY server/package.json server/
  RUN npm run install:all
  COPY . .
  RUN npm --prefix client run build
  EXPOSE 4000
  CMD ["node", "server/src/index.js"]
  ```

### Environment variables (`server/.env`)

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | API port | `4000` |
| `DATABASE_URL` | SQLite path or Postgres URL | `file:./dev.db` |
| `JWT_SECRET` | Token signing secret (change in prod!) | dev value |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `CLIENT_URL` | CORS origin | `http://localhost:5173` |
| `PUBLIC_URL` | Public origin embedded in QR codes | `http://localhost:4000` |

---

## API surface (summary)

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Stakeholder registration |
| POST | `/api/auth/login` | public | Login → JWT |
| GET | `/api/auth/me` | auth | Current user |
| CRUD | `/api/instruments` | auth (owner/roles) | Instrument registry |
| GET/POST | `/api/applications` | auth | List / submit applications |
| GET | `/api/applications/:id` | auth (related) | Details incl. documents |
| PATCH | `/api/applications/:id/assign` | LMO/GATC/Admin | Schedule & assign |
| PATCH | `/api/applications/:id/status` | auth | Transition workflow |
| POST | `/api/verifications` | LMO/GATC/Admin | Record result + issue certificate |
| GET | `/api/verifications` | auth | Verification records |
| GET | `/api/certificates/verify/:certNo` | **public** | QR verification portal |
| GET | `/api/dashboard` | auth (role-aware) | Stats |
| GET/PATCH | `/api/alerts` | auth | Notifications |
| POST/GET | `/api/documents` | auth | Attachments (multer) |
| GET | `/api/search?q=` | auth | Global search |

---

## Known limitations / next steps

- Certificates export to PDF via browser print; a server-side PDF renderer (pdfmake/PDFKit) can be added.
- Fee payment is a digital status (PENDING/PAID) — integrate a payment gateway (Razorpay/UPI) for full financial flow.
- OTP/SMS/email notification delivery can be layered on the existing `Alert` model.
- QR certificates are HMAC+SHA-verified; a full CMS-grade PKI / digital-signature (Aadhaar/DSC) signing layer is the production-grade upgrade.

> **Disclaimer**: demonstration prototype for SIH — not the production legal metrology system.