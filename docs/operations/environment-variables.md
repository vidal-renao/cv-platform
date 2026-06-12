# Environment Variables

Fecha: 2026-06-11

## Reglas

- No commitear secretos reales.
- `JWT_SECRET` debe tener al menos 32 caracteres aleatorios.
- Usar secretos distintos para local, staging y produccion.
- No imprimir `DATABASE_URL`, tokens, passwords o API keys.

## Frontend / Next

Obligatorias en produccion:

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `FRONTEND_URL`

Recomendadas:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=strict`

Testing:

- `TEST_DATABASE_URL`

## Backend Express

Obligatorias en produccion:

- `NODE_ENV=production`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`

Testing:

- `TEST_DATABASE_URL`
- `RUN_DB_INTEGRATION=1`

## CORS

`CORS_ALLOWED_ORIGINS` debe ser lista separada por coma:

```text
https://app.example.com,https://admin.example.com
```

No usar wildcard en produccion.

