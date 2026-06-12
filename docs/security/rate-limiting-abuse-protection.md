# Rate Limiting and Abuse Protection

Fecha: 2026-06-11

## Estado Actual

Rate limiting minimo implementado:

- Backend Express: `backend/src/middlewares/rateLimit.js`.
- Next Edge middleware: `frontend/middleware.ts`.
- Tests backend: `backend/__tests__/rateLimit.test.js`.

Es una proteccion in-memory por instancia. Reduce abuso basico y bots simples, pero no sustituye un limitador distribuido de proveedor, WAF o Redis/Upstash cuando haya varias instancias.

## Endpoints Prioritarios

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/clients/[id]/generate-access`
- `POST /api/clients/[id]/resend-access`
- `POST /api/chat/messages`
- `POST /api/packages/[id]/proof`

## Configuracion

Variables soportadas:

- `RATE_LIMIT_ENABLED=true`
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX_AUTH=10`
- `RATE_LIMIT_MAX_CHAT=60`
- `RATE_LIMIT_MAX_UPLOAD=20`
- `RATE_LIMIT_MAX_API=100`

Bypass intencional:

- `OPTIONS`
- Backend `/health`, `/ready`
- Frontend `/api/health`, `/api/ready`

## Politica Inicial Sugerida

- Login: 5 intentos por 10 minutos por IP/email.
- Forgot/reset: 3 intentos por hora por email/IP.
- Generate/resend access: 10 por hora por usuario admin.
- Chat: 60 mensajes por minuto por usuario.
- Proof upload: limite por usuario/paquete.

## Decision

El bloqueador "sin rate limiting" queda cerrado para MVP/staging.

Para produccion con escala horizontal, queda riesgo operativo: el contador in-memory no se comparte entre instancias ni regiones. Recomendacion siguiente: mover auth/reset/access a rate limiting de proveedor o Redis compartido.
