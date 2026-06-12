# Production Security Hardening

Fecha: 2026-06-11

## Cookies

`cv_session`:

- `HttpOnly`: activo.
- `SameSite=Strict`: activo.
- `Secure`: activo cuando `NODE_ENV=production`.
- `path=/`.
- max age actual: 1 dia.

## CSRF

Proteccion actual:

- Middleware Next revisa `Origin` o `Referer` en `POST`, `PUT`, `PATCH`, `DELETE`.
- Aplica a `/api/*`.
- Origin externo: `403`.
- Sin `Origin`/`Referer`: permitido por compatibilidad server-to-server.

Pendiente produccion:

- Revisar si se requiere politica estricta para bloquear mutaciones sin `Origin`.
- Si aparecen webhooks, usar allowlist + firma del proveedor.

## CORS

Backend Express ahora usa `CORS_ALLOWED_ORIGINS`.

Produccion:

- No wildcard.
- Solo dominios conocidos.
- `credentials: true` solo cuando sea necesario.

## Headers

Next configura:

- `Content-Security-Policy`
- `Referrer-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Permissions-Policy`
- `Strict-Transport-Security`

Nota: CSP todavia permite `unsafe-inline` y `unsafe-eval` por compatibilidad con Next/hidratacion actual. Debe endurecerse en fase CSP dedicada.

