<div align="center">

# 📦 CV Platform

### Intelligent Logistics Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Twilio](https://img.shields.io/badge/Twilio-WhatsApp-F22F46?style=for-the-badge&logo=twilio&logoColor=white)](https://twilio.com/)
[![Resend](https://img.shields.io/badge/Resend-Email-000000?style=for-the-badge&logo=mail.ru&logoColor=white)](https://resend.com/)
[![i18n](https://img.shields.io/badge/i18n-6_languages-6366F1?style=for-the-badge&logo=googletranslate&logoColor=white)](#-internationalization)
[![AI Audited](https://img.shields.io/badge/Security-AI_Audited-22C55E?style=for-the-badge&logo=shieldsdotio&logoColor=white)](#-security)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**A full-stack logistics platform with real-time tracking, automated multi-channel notifications, role-based access control, and six-language support — built for modern courier and package management operations.**

[Live Demo](#) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## 🎯 Value Proposition

CV Platform eliminates the operational chaos of manual package management. Built for courier businesses and logistics operators, it delivers:

- 🌍 **Multilingual by default** — ES, EN, DE, PT, FR, IT with persistent user preference
- 🔔 **Automated notifications** — WhatsApp (Twilio) + Email (Resend) on every status change
- 👥 **Role-based portals** — separate dashboards for Admins, Staff, and Clients
- 📊 **Live analytics** — revenue, package flow, and client metrics in real time
- 🔐 **Production-grade security** — JWT auth, bcrypt, env-isolated secrets, AI-audited codebase

---

## 🏗️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 14 (App Router) | React framework, SSR, routing |
| **Tailwind CSS** | 3 | Utility-first styling |
| **React Context API** | — | i18n state, auth state |
| **Canvas API** | — | Digital signature capture for delivery proofs |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express** | 20 / 4.x | REST API server |
| **PostgreSQL** | 16 | Primary relational database |
| **node-postgres (pg)** | — | Database driver |
| **bcrypt** | — | Password hashing |
| **JSON Web Tokens** | — | Stateless authentication |
| **Twilio** | — | WhatsApp notifications |
| **Resend** | — | Transactional email |
| **Multer** | — | File upload handling |

### Infrastructure & Tooling
| Tool | Purpose |
|---|---|
| **Docker** | Containerized local development |
| **dotenv** | Environment variable management |
| **GitHub** | Version control, clean history |

---

## ✨ Key Features

### 👤 Role-Based Access Control
Three fully isolated portals with dedicated UIs and permission scopes:

| Role | Capabilities |
|---|---|
| **Admin** | Full CRUD on packages, clients, users · Analytics · Settings · Staff management |
| **Staff** | Package operations · Client lookup · Delivery proof capture |
| **Client** | View own packages · Track shipments · Download delivery receipts |

### 📦 Package Management
- Create, update, and delete packages with tracking numbers, weight, cost, and description
- Status lifecycle: `ARRIVED → READY_FOR_PICKUP → PICKED_UP`
- Attach digital delivery proofs (signature + photo) at pickup confirmation
- Bulk status updates and comment threads per package

### 🗺️ Public Tracking Page
- Zero-login tracking at `/track/[number]`
- Visual step-by-step timeline with timestamps
- Fully translated into all 6 supported languages
- SEO-friendly and mobile-responsive

### 🔔 Automated Notifications
Notifications fire automatically on key events (access generation, password reset):

```
📱 WhatsApp (Twilio)  →  Instant delivery on mobile
📧 Email (Resend)     →  Branded HTML templates with credentials/reset links
```

### 🌍 Internationalization
Full i18n coverage across the entire public surface:

| Code | Language | Flag |
|---|---|---|
| `es` | Español | 🇪🇸 |
| `en` | English | 🇺🇸 |
| `de` | Deutsch | 🇩🇪 |
| `pt` | Português | 🇧🇷 |
| `fr` | Français | 🇫🇷 |
| `it` | Italiano | 🇮🇹 |

Language preference is persisted in `localStorage` and respected across sessions. The in-app dropdown selector is available on every public page.

### 📊 Analytics Dashboard
- Revenue by period (daily / weekly / monthly)
- Package volume and status distribution
- Top clients by spend
- New clients and activity trends

---

## 🔐 Security

> This codebase was fully audited by AI security agents prior to its first public commit.

### Practices enforced:
- ✅ **Zero hardcoded secrets** — all credentials live exclusively in `.env` files, never in source code
- ✅ **Environment isolation** — `backend/.env` and `frontend/.env.local` are gitignored at both the root and path level
- ✅ **Frontend safety** — only `NEXT_PUBLIC_*` variables are exposed to the browser; no backend secrets cross the boundary
- ✅ **Password security** — bcrypt with salt rounds for all stored passwords
- ✅ **Auth middleware** — all protected routes require a valid JWT; role checks are enforced server-side
- ✅ **Token rotation** — password reset tokens are single-use, stored hashed, and expire after 1 hour
- ✅ **Clean git history** — repository initialized fresh; no credentials exist in any historical commit

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- PostgreSQL ≥ 14
- A [Resend](https://resend.com) account (free tier works)
- A [Twilio](https://twilio.com) account with WhatsApp sandbox enabled

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/cv-platform.git
cd cv-platform
```

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your values:

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/cv_platform
JWT_SECRET=your_random_32_char_secret_here

# Email — Resend
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# WhatsApp — Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Client portal access
DEFAULT_TEMP_PASSWORD=change_me_to_a_secure_temp_password

# App URL
FRONTEND_URL=http://localhost:3000
```

> 💡 Generate a secure JWT secret with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Set up the database

```bash
psql -U postgres -d cv_platform -f database/schema.sql
```

### 4. Install dependencies and run

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

App available at **http://localhost:3000** · API at **http://localhost:5000**

---

## 📁 Project Structure

```
cv-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Business logic (auth, clients, packages, delivery…)
│   │   ├── routes/          # Express route definitions
│   │   ├── middleware/       # JWT auth, role guards, error handling
│   │   └── db.js            # PostgreSQL connection pool
│   ├── .env.example         # Environment variable template (safe to commit)
│   └── server.js
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/       # Admin/Staff portal (packages, clients, users, analytics)
│   │   ├── client/          # Client portal (own packages, settings)
│   │   ├── track/[number]/  # Public tracking page
│   │   ├── login/           # Auth pages
│   │   └── page.jsx         # Public landing page
│   ├── components/          # Shared UI components
│   ├── lib/
│   │   ├── i18n.js          # i18n context, useTranslation hook
│   │   └── api.js           # Typed API client
│   └── messages/            # Translation JSON files (es, en, de, pt, fr, it)
│
├── database/
│   └── schema.sql           # Full database schema
│
└── docker/                  # Docker Compose for local dev
```

---

## 🗺️ Roadmap

- [ ] Push notifications (web push / FCM)
- [ ] Barcode / QR scanner integration for package intake
- [ ] CSV/Excel import & export for bulk package management
- [ ] Client-facing mobile app (React Native)
- [ ] Webhooks for third-party integrations

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

<div align="center">

Built with precision and care · Secured by AI audit · Ready for production

</div>
