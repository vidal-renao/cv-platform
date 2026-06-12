# GO-LIVE Blockers

Fecha: 2026-06-11

## Decision Ejecutiva

Estado actual: `NO-GO` para produccion real.

El codigo esta mucho mas cerca de go-live, pero aun falta evidencia operacional imprescindible: DB staging/test validada, migracion 003 aplicada en entorno no productivo y suite `npm run test:db` pasando.

## Bloqueadores Cerrados

| Bloqueador | Estado | Evidencia |
| --- | --- | --- |
| Rutas API ambiguas `.js`/`.ts` | Cerrado | Rutas legacy `.js` eliminadas y APIs restauradas como `route.ts`. |
| Fallback plaintext de `JWT_SECRET` | Cerrado | `JWT_SECRET` es obligatorio en frontend/backend. |
| Cookie superficial `auth_session` | Cerrado | Sesion centralizada en cookie HttpOnly `cv_session`. |
| Auth dependiente de `localStorage` | Cerrado | UI consulta `/api/auth/me`; no usa token localStorage como autoridad. |
| `ensureTables` runtime | Cerrado | Schema movido a migraciones SQL. |
| Lint interactivo | Cerrado | ESLint configurado para CI/headless. |
| CSRF minimo en APIs mutativas | Cerrado | Middleware Edge valida origin/referer en metodos mutativos. |
| Rate limiting minimo | Cerrado con limitacion | Implementado in-memory en backend Express y Edge middleware. No sustituye Redis/provider global. |
| Headers de seguridad | Cerrado | `next.config.js` define CSP, HSTS, frame, referrer y permissions policies. |
| Health/readiness | Cerrado | Backend `/health`, `/ready`; Next `/api/health`, `/api/ready`. |

## Bloqueadores Pendientes

| Bloqueador | Estado | Criterio de cierre |
| --- | --- | --- |
| DB staging/test confirmada | Pendiente | `TEST_DATABASE_URL` no productiva configurada sin exponer secretos. |
| Migracion 003 en staging | Pendiente | Aplicada con backup previo y validacion de tablas/columnas. |
| Suite DB real | Pendiente | `cd backend && npm run test:db` pasa contra staging/test. |
| Tenant isolation real | Pendiente | Tests DB confirman aislamiento tenant-scoped. |
| Vulnerabilidades npm | Cerrado | `frontend npm audit` y `backend npm audit` quedan en 0 vulnerabilidades. |
| Rate limiting distribuido | Riesgo aceptable temporal | Para escala horizontal, reemplazar in-memory por provider/Redis. |

## Riesgos Cerrados 2026-06-12

- `next` y `eslint-config-next` actualizados a `15.5.19`.
- `postcss` corregido via override `^8.5.10`.
- `xlsx` eliminado y reemplazado por CSV.
- `bcrypt` nativo eliminado del backend y reemplazado por `bcryptjs`.

## Criterio GO

GO solo si:

1. Staging DB validada con migracion 003.
2. `npm run test:db` pasa.
3. Lint/build/tests locales pasan.
4. Audits frontend/backend siguen en 0 vulnerabilidades.
5. Variables productivas revisadas: `JWT_SECRET`, cookies secure, CORS, URLs, Resend/Twilio.

Sin esos puntos, la decision sigue siendo `NO-GO`.
