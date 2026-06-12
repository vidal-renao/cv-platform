# Next API Restoration TypeScript Spec

Fecha: 2026-06-11

## Objetivo

Restaurar las rutas eliminadas de `frontend/app/api` en TypeScript, eliminar ambiguedad entre `route.js` y `route.ts`, mantener autenticacion por cookie HttpOnly `cv_session`, y asegurar permisos explicitos por rol.

## Principios aplicados

- Solo rutas `route.ts` bajo `frontend/app/api`.
- Sin fallback de `JWT_SECRET`.
- Sin `auth_session`.
- Sin `localStorage.user` como fuente de autorizacion.
- Sin `ensureTables` ni mutaciones dinamicas de schema.
- Uso de `getUser(request)` y `getDb()` en endpoints Node.
- Respuestas JSON y codigos HTTP explicitos.

## Endpoints restaurados

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/register`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Clients

- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/[id]`
- `PUT /api/clients/[id]`
- `DELETE /api/clients/[id]`
- `GET /api/clients/[id]/profile`
- `POST /api/clients/[id]/generate-access`
- `POST /api/clients/[id]/resend-access`

### Client portal

- `GET /api/client/me`
- `GET /api/client/packages`
- `GET /api/client/packages/[id]`
- `GET /api/client/packages/[id]/comments`
- `POST /api/client/packages/[id]/comments`
- `GET /api/client/packages/[id]/proof`
- `POST /api/client/packages/[id]/proof`

### Dashboard

- `GET /api/dashboard/metrics`
- `GET /api/dashboard/monthly`

### Packages

- `GET /api/packages`
- `POST /api/packages`
- `GET /api/packages/[id]`
- `PUT /api/packages/[id]`
- `DELETE /api/packages/[id]`
- `PATCH /api/packages/[id]/status`
- `GET /api/packages/[id]/comments`
- `POST /api/packages/[id]/comments`
- `DELETE /api/packages/[id]/comments/[commentId]`
- `POST /api/packages/[id]/pickup`
- `GET /api/packages/[id]/proof`
- `POST /api/packages/[id]/proof`

### Chat

- `GET /api/chat/contacts`
- `GET /api/chat/messages`
- `POST /api/chat/messages`
- `GET /api/chat/messages/[userId]`
- `GET /api/chat/unread`

### Settings and users

- `GET /api/settings`
- `POST /api/settings`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/[userId]/role`

## Endpoints eliminados sin reemplazo directo

- `frontend/app/api/db-setup/route.js`
- `frontend/app/api/seed/route.js`
- `frontend/app/api/me/heartbeat/route.js`

Decision: no restaurarlos en esta fase porque representan setup/seed/runtime utility routes o no aparecen como ruta critica del flujo principal. Si se necesitan, deben reintroducirse con proteccion `SUPERADMIN`, controles de entorno y sin mutaciones dinamicas de schema.

## Compatibilidad UI/API

Llamadas verificadas y cubiertas:

- `/api/settings`
- `/api/chat/contacts`
- `/api/chat/messages`
- `/api/dashboard/monthly`
- `/api/clients/[id]`
- `/api/clients/[id]/generate-access`
- `/api/clients/[id]/resend-access`
- `/api/client/*`
- `/api/packages/*`

La UI protegida usa `/api/auth/me` como fuente de usuario. El logout usa endpoint backend para limpiar cookie.

## Riesgos tecnicos pendientes

- `resend-access` conserva compatibilidad con UI devolviendo `tempPassword`, pero conceptualmente deberia separarse de un flujo real de reset link.
- `app_settings`, `package_comments` y `delivery_proofs` deben existir en migraciones SQL; no se crean en runtime.
- Faltan tests automatizados de contrato API y aislamiento multi-tenant.
