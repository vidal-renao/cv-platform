<div align="center">

# CV Platform

### Intelligent Logistics Management — Built for Scale

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Twilio](https://img.shields.io/badge/Twilio-WhatsApp-F22F46?style=for-the-badge&logo=twilio&logoColor=white)](https://twilio.com/)
[![Resend](https://img.shields.io/badge/Resend-Email-000000?style=for-the-badge&logo=mail.ru&logoColor=white)](https://resend.com/)
[![i18n](https://img.shields.io/badge/i18n-6_languages-6366F1?style=for-the-badge&logo=googletranslate&logoColor=white)](#-internationalization)
[![AI Audited](https://img.shields.io/badge/Security-AI_Audited-22C55E?style=for-the-badge&logo=shieldsdotio&logoColor=white)](#-security-protocol)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**End-to-end logistics platform with real-time tracking, automated multi-channel notifications, role-based access control, and native six-language support — designed for international courier operations.**

[Live Demo](#) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## The Problem — Logistics Chaos

International package operations run on improvised tools: WhatsApp threads, spreadsheets, manual phone calls. The result:

- **No visibility.** Clients call to ask where their package is — every day, for every package.
- **Manual bottlenecks.** Staff spend hours on notifications that should be automatic.
- **Zero audit trail.** Delivery disputes are resolved by memory, not by data.
- **Language barriers.** A Swiss-German client, an Italian customer, and a Portuguese shipper cannot all use the same hardcoded interface.

When your logistics operation crosses borders, your software has to cross them too. Most solutions don't.

---

## The AI-Driven Solution

CV Platform was engineered with AI as a core development multiplier — not a gimmick. The development process included:

- **AI-assisted architecture design** — key decisions on data modeling, RBAC structure, and i18n architecture were validated against AI-generated constraint analysis before a single line of code was written.
- **AI-audited security** — a full secret scanning and credentials audit was performed by AI agents prior to the first public commit, catching rotatable tokens and configuration leaks before they reached version history.
- **AI-accelerated i18n** — six complete translation dictionaries with context-aware keys across 40+ UI surfaces were built and cross-validated in a fraction of the time manual translation would require.

The result is a production-grade platform — not a prototype — with clean architecture, zero exposed secrets, and an i18n system that treats language as infrastructure, not an afterthought.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 14 (App Router) | React framework, SSR, file-based routing |
| **Tailwind CSS** | 3 | Utility-first styling system |
| **React Context API** | — | i18n state, zero external i18n dependencies |
| **Canvas API** | — | In-browser digital signature capture for delivery proof |
| **Recharts / Chart.js** | — | Analytics dashboards and KPI visualizations |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express** | 20 / 4.x | REST API server |
| **PostgreSQL** | 16 | Primary relational database |
| **node-postgres (pg)** | — | Database driver with connection pooling |
| **bcrypt** | — | Password hashing (salted, configurable rounds) |
| **JSON Web Tokens** | — | Stateless auth, 24h expiry |
| **Zod** | — | Runtime schema validation on all API inputs |
| **Twilio** | — | WhatsApp Business API notifications |
| **Resend** | — | Branded transactional email |
| **Helmet** | — | HTTP security headers |
| **Multer** | — | Delivery photo upload handling |

### Infrastructure
| Tool | Purpose |
|---|---|
| **Docker** | Containerized local development environment |
| **Next.js Middleware** | Edge-layer route protection (auth_session cookie check) |
| **Vercel** | Frontend deployment with security headers |
| **dotenv** | Environment isolation (never in source) |

---

## Key Features

### Role-Based Access Control

Three fully isolated portals — separate URLs, separate layouts, separate permission scopes:

| Role | Access | Capabilities |
|---|---|---|
| **Admin** | `/dashboard` | Full CRUD — packages, clients, users · Analytics · Settings |
| **Staff** | `/dashboard` | Package operations · Client lookup · Delivery proof capture |
| **Client** | `/client` | Own packages only · Tracking · Delivery receipts |

Role assignment is automatic: when a user registers with an email or phone matching an existing client record, they receive the `CLIENT` role. All other registrations default to `STAFF`. Promotion to `ADMIN` requires an existing admin action.

### Package Lifecycle Management

```
ARRIVED  →  READY_FOR_PICKUP  →  PICKED_UP
```

- Tracking number, weight, cost, and description per package
- Digital delivery proof: in-browser signature capture + photo upload
- Comment threads per package for internal notes
- Bulk operations and search across all packages

### Automated Multi-Channel Notifications

Every status change triggers a configurable notification pipeline:

```
Event detected
    ├── WhatsApp (Twilio Business API) — instant mobile delivery
    └── Email (Resend)               — branded HTML with tracking link
```

No manual follow-up. No missed notifications. No staff time spent on communication.

### Native i18n — 6 Languages

| Code | Language | Market |
|---|---|---|
| `de` | Deutsch | Switzerland · Liechtenstein · Austria |
| `en` | English | International |
| `es` | Español | Latin America · Spain |
| `fr` | Français | Switzerland · France |
| `it` | Italiano | Switzerland · Italy |
| `pt` | Português | Brazil · Portugal |

Language preference persists in `localStorage` across sessions. The architecture uses dynamic JSON dictionary loading, dot-notation key resolution, and full reactivity on language switch — with zero page reload. Internationalization is built into the routing and component layer, not bolted on top.

### Public Tracking

Zero-login tracking at `/track/[tracking_number]` — shareable, SEO-friendly, fully translated across all 6 languages.

### Analytics Dashboard

- Revenue by period (daily / weekly / monthly)
- Package volume and status distribution charts
- Top clients by spend
- New client and activity trends

---

## Security Protocol

> Repository was fully audited by AI security agents prior to first public commit. No credentials exist in any commit in the git history.

| Control | Implementation |
|---|---|
| **Secret isolation** | All credentials in `.env` files, gitignored at root and path level |
| **Frontend boundary** | Only `NEXT_PUBLIC_*` vars exposed to browser — no backend secrets cross the boundary |
| **Password storage** | bcrypt with salt rounds — no plaintext ever persists |
| **Authentication** | JWT with 24h expiry — verified on every protected API endpoint |
| **Route protection** | Next.js Edge Middleware checks `auth_session` cookie before serving any protected page |
| **Role enforcement** | Server-side role middleware (`requireRole`) on every admin API route |
| **Input validation** | Zod schemas validate all API inputs before any DB query executes |
| **Token lifecycle** | Password reset tokens: single-use, stored hashed, 1h expiry |
| **HTTP headers** | Helmet (backend) + Vercel security headers (frontend): `nosniff`, `DENY` framing, XSS protection |
| **Clean history** | Repository initialized fresh — zero credential exposure in historical commits |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14
- [Resend](https://resend.com) account (free tier works)
- [Twilio](https://twilio.com) account with WhatsApp sandbox

### 1. Clone

```bash
git clone https://github.com/vidal-renao/cv-platform.git
cd cv-platform
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your values:

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/cv_platform
JWT_SECRET=your_random_32_char_secret_here

RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

DEFAULT_TEMP_PASSWORD=change_me_to_a_secure_temp_password
FRONTEND_URL=http://localhost:3000
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Frontend env:
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Database

```bash
psql -U postgres -d cv_platform -f database/schema.sql
```

### 4. Install and run

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

App: **http://localhost:3000** · API: **http://localhost:5000**

### Deploying to Vercel

The frontend deploys to Vercel with the project root set to `frontend/`. Set `NEXT_PUBLIC_API_URL` in Vercel environment variables to point to your deployed backend (Railway, Render, or any Node.js host).

```
Vercel project root → frontend/
Environment variable → NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
```

---

## Project Structure

```
cv-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Business logic (auth, clients, packages, delivery…)
│   │   ├── routes/           # Express route definitions
│   │   ├── middlewares/      # JWT auth, role guards, validation, error handling
│   │   ├── schemas/          # Zod validation schemas
│   │   ├── services/         # Notification service (Twilio + Resend)
│   │   └── db/               # PostgreSQL connection pool
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/        # Admin/Staff portal
│   │   ├── client/           # Client portal
│   │   ├── track/[number]/   # Public tracking page
│   │   ├── login/            # Auth pages
│   │   └── page.jsx          # Public landing page
│   ├── lib/
│   │   ├── i18n.js           # i18n context + useTranslation hook
│   │   └── api.js            # API client (fetchWithAuth, login, logout)
│   ├── messages/             # Translation files (es, en, de, pt, fr, it)
│   ├── middleware.ts          # Next.js Edge Middleware — route protection
│   └── vercel.json           # Vercel deployment configuration
│
├── database/
│   └── schema.sql            # Full database schema
│
└── docker/                   # Docker Compose for local dev
```

---

## Roadmap

- [ ] Push notifications (web push / FCM)
- [ ] Barcode / QR scanner for package intake
- [ ] CSV/Excel import & export for bulk management
- [ ] Client-facing mobile app (React Native)
- [ ] Webhooks for third-party integrations
- [ ] Multi-tenant support for franchise operations

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

<div align="center">

Built with precision · Secured by AI audit · Ready for production

</div>
