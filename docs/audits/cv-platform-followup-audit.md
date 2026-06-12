# CV Platform Follow-up Audit

Fecha: 2026-06-11

## Resumen ejecutivo

El proyecto queda en una fase mucho mas estable que el punto inicial: las APIs eliminadas fueron restauradas como `route.ts`, el frontend compila, lint pasa, la sesion se centraliza en `cv_session` HttpOnly y se eliminaron los vectores conocidos de fallback secreto, `auth_session`, `ensureTables` y autorizacion basada en `localStorage.user`.

El riesgo principal restante no es de compilacion sino de madurez operativa: vulnerabilidades npm pendientes, ausencia de tests automatizados reales, y necesidad de alinear migraciones SQL con tablas usadas por las rutas restauradas.

## Cambios implementados

- Eliminacion de rutas `route.js` ambiguas bajo `frontend/app/api`.
- Restauracion de rutas criticas en TypeScript.
- Nuevo helper de autenticacion en `frontend/lib/auth.ts`.
- Nuevo helper de base de datos en `frontend/lib/db.ts`.
- Nuevo helper de roles en `frontend/lib/roles.ts`.
- Middleware Edge con validacion criptografica de JWT.
- UI protegida usando `/api/auth/me`.
- ESLint configurado con `.eslintrc.json` para evitar wizard interactivo.
- Tipos instalados para `bcryptjs`, `jsonwebtoken` y `pg`.

## Endpoints restaurados

Restaurados 33 endpoints `route.ts` en:

- `auth`
- `clients`
- `client`
- `dashboard`
- `packages`
- `chat`
- `settings`
- `users`

Pendientes solo bajo decision explicita:

- `db-setup`
- `seed`
- `me/heartbeat`

Estas rutas no deben restaurarse sin controles fuertes de entorno y rol.

## Seguridad y roles

Decisiones:

- `CLIENT`: portal y recursos propios.
- `STAFF`: operaciones internas restringidas por tenant/owner.
- `ADMIN`: administracion del tenant.
- `SUPERADMIN`: acceso global.

Controles aplicados:

- Cookie HttpOnly `cv_session`.
- `JWT_SECRET` obligatorio y sin fallback.
- No Bearer fallback desde `localStorage`.
- Queries sensibles filtradas por tenant/owner para usuarios no globales.

## Base de datos y tenant isolation

Se elimino la creacion dinamica de tablas desde runtime. Las rutas asumen schema existente y fallan de forma explicita si faltan tablas.

Tablas a confirmar en migraciones:

- `app_settings`
- `package_comments`
- `delivery_proofs`
- Tablas de chat/mensajes usadas por endpoints restaurados

Riesgo: si produccion no tiene esas migraciones, algunas funcionalidades devolveran error de base de datos aunque la app compile.

## Validaciones ejecutadas

- `npm run build` en `frontend`: OK.
- `npm run lint` en `frontend`: OK con warnings.
- `npm test -- --passWithNoTests` en `backend`: OK, sin tests encontrados.
- `npm audit --json` en `frontend`: 19 vulnerabilidades.
- `npm audit --json` en `backend`: 13 vulnerabilidades.
- Busqueda por `auth_session`, secreto hardcodeado, `ensureTables` y usos sensibles de `localStorage.user`: sin resultados.

Warnings actuales:

- Hooks de React con dependencias faltantes.
- Uso de `<img>` en lugar de `next/image`.
- `metadata.themeColor` debe migrarse a `viewport`.

## Vulnerabilidades pendientes

Frontend:

- 19 vulnerabilidades: 8 moderate, 11 high.
- Paquetes destacados: `next`, `eslint-config-next`, `xlsx`, `axios` transitivo, `resend/svix/uuid`, `postcss`, `glob`, `minimatch`, `picomatch`, `dompurify`, `qs`.
- `next` requiere upgrade mayor recomendado por audit.
- `xlsx` no reporta fix disponible.

Backend:

- 13 vulnerabilidades: 8 moderate, 5 high.
- Paquetes destacados: `axios` transitivo, `tar`, `express/qs`, `resend/svix/uuid`, `picomatch`, `brace-expansion`.
- Fixes disponibles, pero deben aplicarse con control de regresion.

## Riesgos pendientes

- Falta suite de tests automatizados para auth, roles, tenant isolation y contratos UI/API.
- `resend-access` conserva compatibilidad de UI pero debe redisenarse como reset link real.
- Falta revisar CSRF completo sobre endpoints mutativos.
- Falta confirmar migraciones SQL para tablas usadas por endpoints restaurados.
- Dependencias con vulnerabilidades high siguen pendientes por decision de no aplicar `audit fix --force`.

## Proxima fase recomendada

1. Crear migraciones SQL faltantes y validarlas contra Supabase/PostgreSQL.
2. Implementar tests Jest/Supertest o Next route tests para auth, roles y tenant isolation.
3. Ejecutar upgrade controlado de `next`, `eslint-config-next`, `resend`, `express` y transitivos.
4. Sustituir `xlsx` si no hay parche disponible.
5. Redisenar `resend-access` como flujo de reset temporal sin exponer tokens como password.
6. Corregir warnings de React hooks, imagenes y metadata.

## Actualizacion 2026-06-11

Completado en la fase siguiente:

- Nueva migracion `backend/migrations/003_api_hardening_support_tables.sql`.
- Tokens publicos de reset/acceso almacenados como hash SHA-256 en `password_resets.token`.
- `generate-access` y `resend-access` ya devuelven y envian `accessUrl`, no contrasenas temporales.
- CSRF origin/referer check para mutaciones `/api/*`.
- Tests reales backend en `backend/__tests__/app.test.js`.
- Warnings de lint eliminados: hooks, `next/image`, `themeColor`.
- `npm audit fix` sin `--force` aplicado.

Validacion:

- `frontend npm run lint`: OK, sin warnings.
- `frontend npm run build`: OK.
- `backend npm test`: OK, 5 tests passing.

Pendiente:

- Ejecutar migracion 003 en DB real.
- Upgrade major controlado de Next/eslint-config-next.
- Sustituir o aislar `xlsx`.
- Resolver `bcrypt` -> `@mapbox/node-pre-gyp` -> `tar` en backend.
- Ampliar tests de integracion con DB real o mock estable de route handlers Next.

## Actualizacion Staging Readiness 2026-06-11

Completado:

- Rollback conservador creado: `backend/migrations/003_api_hardening_support_tables.rollback.sql`.
- Runbook de staging creado: `docs/operations/staging-migration-003-runbook.md`.
- Tests de integracion DB opt-in creados: `backend/__tests__/db.integration.test.js`.
- Plan Next 16 creado: `docs/upgrade/next-16-upgrade-plan.md`.
- Plan xlsx creado: `docs/security/xlsx-risk-and-replacement-plan.md`.
- Revision bcrypt/tar creada: `docs/security/password-hashing-dependency-review.md`.
- `.env.example` actualizado para `FRONTEND_URL` y sin password temporal.

Validacion local:

- `backend npm test`: OK.
- `frontend npm run lint`: OK.
- `frontend npm run build`: OK.

No ejecutado:

- Migracion 003 contra staging real, porque requiere `DATABASE_URL` de staging y backup aprobado.
- Tests DB opt-in, porque requieren `TEST_DATABASE_URL`.

## Actualizacion Staging Validation 2026-06-11

Se preparo checklist final de validacion:

- `docs/operations/staging-validation-checklist.md`

Resultado de esta sesion:

- DB destino usada: ninguna. No se confirmo `TEST_DATABASE_URL` ni backup.
- Migracion 003: no aplicada contra DB real.
- Rollback: creado, disponible y reforzado para tolerar tablas ausentes; no ejecutado contra DB real.
- `npm run test:db`: preparado, pero no ejecutado por fallo del sandbox de Windows (`spawn setup refresh`) y falta de DB confirmada.
- Tenant isolation real: pendiente de DB staging/test.
- CSRF real: pendiente de entorno staging desplegado.
- Decision: `NO-GO` para ejecutar contra infraestructura real desde esta sesion.

Motivo:

- No hay evidencia segura de DB staging/test configurada.
- No hay backup aprobado en esta sesion.
- Ejecutar migraciones sin esos datos incumpliria el runbook.

Validacion local mantenida:

- `backend npm test`: OK.
- `frontend npm run lint`: OK.
- `frontend npm run build`: OK.

## Production Optimization Phase 2026-06-11

Completado:

- Auditoria production readiness: `docs/audits/production-readiness-audit.md`.
- Variables de entorno: `.env.example`, `frontend/.env.example`, `backend/.env.example`, `docs/operations/environment-variables.md`.
- Security hardening doc: `docs/security/production-security-hardening.md`.
- Rate limiting doc: `docs/security/rate-limiting-abuse-protection.md`.
- Observabilidad/healthchecks: `docs/operations/observability-and-healthchecks.md`.
- Runbook produccion: `docs/operations/production-migration-runbook.md`.
- Rollback produccion: `docs/operations/production-rollback-plan.md`.
- CI/CD: `.github/workflows/ci.yml` y `docs/operations/ci-cd-production-pipeline.md`.
- Performance review: `docs/audits/performance-production-review.md`.
- Error standard: `docs/architecture/api-error-handling-standard.md`.
- GO-LIVE checklist: `docs/operations/production-go-live-checklist.md`.

Cambios seguros aplicados:

- Headers de seguridad ampliados en `frontend/next.config.js`.
- Backend Express usa `CORS_ALLOWED_ORIGINS`.
- Backend Express emite `X-Request-ID`.
- Backend Express expone `/ready`.
- Next API expone `/api/health` y `/api/ready`.

Decision actual:

- `NO-GO` para produccion hasta validar DB staging/test y definir rate limiting productivo.

## GO-LIVE Blocker Closure Phase 2026-06-11

Completado:

- Rate limiting minimo implementado en backend Express: `backend/src/middlewares/rateLimit.js`.
- Rate limiting minimo implementado en Edge middleware Next: `frontend/middleware.ts`.
- Tests backend para rate limiting: `backend/__tests__/rateLimit.test.js`.
- Variables `RATE_LIMIT_*` documentadas en `.env.example`, `frontend/.env.example` y `backend/.env.example`.
- Bloqueadores go-live consolidados: `docs/operations/go-live-blockers.md`.
- Setup staging DB documentado: `docs/operations/staging-db-setup.md`.
- Decision de riesgo actualizada para `xlsx` y `bcrypt/tar`.

Limitaciones:

- Rate limiting es in-memory por instancia. Adecuado para MVP/staging y control basico, pero no distribuido.
- DB staging/test sigue pendiente.
- `npm run test:db` sigue pendiente hasta tener `TEST_DATABASE_URL` no productiva confirmada.
- Vulnerabilidades restantes requieren aceptacion formal o ramas de upgrade.

Decision:

- `NO-GO` para produccion real hasta cerrar staging DB y aceptacion/mitigacion de vulnerabilidades.

## Error Fixing Phase 2026-06-12

Completado:

- Backend migrado de `bcrypt` a `bcryptjs`.
- Eliminada cadena vulnerable `@mapbox/node-pre-gyp` / `tar`.
- Frontend actualizado de Next 14 a Next `15.5.19`.
- `eslint-config-next` actualizado a `15.5.19`.
- `postcss` corregido con override `^8.5.10`.
- `xlsx` eliminado; exportacion de paquetes migrada a CSV.
- Rutas API dinamicas actualizadas al contrato de Next 15: `params` como `Promise`.
- Link interno en `frontend/app/page.jsx` corregido para usar `next/link`.

Validacion:

- `frontend npm run lint`: OK, sin warnings. Nota: `next lint` queda deprecado para Next 16.
- `frontend npm run build`: OK con Next `15.5.19`.
- `frontend npm audit --json`: 0 vulnerabilidades.
- `backend npm test`: OK, 9 tests passing, suite DB skipped por falta de `TEST_DATABASE_URL`.
- `backend npm audit --json`: 0 vulnerabilidades.

Decision:

- Bloqueador de vulnerabilidades npm cerrado.
- Produccion real sigue `NO-GO` hasta validar DB staging/test, migracion 003 y `npm run test:db`.
