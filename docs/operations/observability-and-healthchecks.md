# Observability and Healthchecks

Fecha: 2026-06-11

## Implementado

Backend Express:

- `GET /health`
- `GET /ready`
- `X-Request-ID`
- logging basico con request id.
- errores con `requestId`.

Next API:

- `GET /api/health`
- `GET /api/ready`

## No Loggear

- JWTs.
- Passwords.
- Reset/access tokens.
- `DATABASE_URL`.
- API keys.

## Readiness

`/ready` y `/api/ready` verifican conectividad DB con `SELECT 1`.

## Pendiente

- Centralizar logs en plataforma externa.
- Alertas para 5xx, readiness fail, errores DB y auth spikes.
- Metricas de latencia por endpoint.

