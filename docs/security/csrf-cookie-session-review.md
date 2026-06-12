# CSRF Cookie Session Review

Fecha: 2026-06-11

## Contexto

La sesion usa cookie HttpOnly `cv_session`, `SameSite=Strict`, `Secure` en produccion y validacion JWT. Al usar cookie, las rutas mutadoras necesitan defensa CSRF adicional.

## Decision implementada

Se implemento un origin/referer check centralizado en `frontend/middleware.ts` para metodos:

- `POST`
- `PUT`
- `PATCH`
- `DELETE`

La proteccion aplica a `/api/:path*`.

Comportamiento:

- Si `Origin` existe, debe coincidir con el origin de la app.
- Si no hay `Origin` pero hay `Referer`, debe coincidir.
- Si no hay ambos headers, se permite para compatibilidad server-to-server/no-browser.
- Si falla, responde `403` JSON: `CSRF origin check failed`.

## Motivo

Esta opcion es coherente con el estado actual porque:

- No introduce dependencia nueva.
- No rompe login/logout same-origin.
- Cubre mutaciones API desde navegadores.
- Mantiene auth/roles dentro de cada route handler.

## Riesgo residual

Para endurecimiento maximo, la siguiente fase deberia anadir doble submit CSRF token o token firmado por sesion para mutaciones sensibles, especialmente si se abren integraciones cross-origin.

## Archivos tocados

- `frontend/middleware.ts`
- `docs/architecture/auth-session-hardening.md`

## Validacion Staging Recomendada

Escenarios:

- `GET /api/auth/me` sin `Origin`: no bloqueado por CSRF; auth decide.
- `POST /api/auth/login` con `Origin` de staging: permitido.
- `POST /api/auth/logout` con `Origin` de staging: permitido.
- `POST /api/settings` con `Origin: https://evil.example`: `403`.
- `POST /api/packages` sin `Origin` ni `Referer`: permitido para compatibilidad server-to-server; revisar si se quiere politica mas estricta.

No se detectaron webhooks externos en esta fase. Si se agregan callbacks de Twilio/Resend/Supabase, deben entrar en allowlist explicita y con firma del proveedor.
