# CV Platform Implementation Plan

This document outlines the proposed architecture and steps to generate the CV Platform fullstack application.

## User Review Required

> [!IMPORTANT]  
> Please review this plan to ensure it meets your expectations for the codebase structure. If you have a preferred state management or i18n library for Next.js, let me know. I will use `next-intl` for i18n and standard Next.js App Router API features unless specified otherwise.

## Proposed Architecture

### Database
- PostgreSQL schema in [database/schema.sql](file:///c:/Users/Max/cv-platform/database/schema.sql).

### Backend (Node.js + Express)
We will create a modular Express API in the `backend/` folder.
- `src/index.js` (Entry point)
- `src/db/index.js` (PostgreSQL connection using `pg`)
- `src/routes/` (auth, clients, packages, notifications)
- `src/controllers/` (Business logic)
- `src/middlewares/` (JWT auth verification, error handling)

### Frontend (Next.js + Tailwind CSS)
We will bootstrap a Next.js App Router application in the `frontend/` folder.
- `app/` (Pages: login, dashboard, clients, packages, notifications, analytics, settings)
- `components/` (Reusable UI components, Tailwind styled)
- `lib/` (API client, Auth context, API fetching utilities)
- `messages/` (i18n JSON files for en, es, de)

### Testing
- `tests/unit/` and `tests/integration/` for Jest tests (backend/frontend logic).
- `tests/e2e/` for Playwright browser tests.

### DevOps
- `.github/workflows/build.yml`
- `.github/workflows/test.yml`

## Next Steps upon Approval
1. Scaffold directories and the database schema.
2. Build the Express backend.
3. Scaffold the Next.js frontend and implement basic pages & routing.
4. Set up the testing and GitHub Actions structure.
