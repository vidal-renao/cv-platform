# Production GO-LIVE Checklist

Fecha: 2026-06-11

## Codigo

- [x] `frontend npm run lint` OK en esta fase.
- [x] `frontend npm run build` OK en esta fase.
- [x] `backend npm test` OK en esta fase.
- [x] Audits revisados.

## DB

- [ ] Backup hecho y verificado.
- [ ] Migracion 003 aplicada en staging.
- [ ] `npm run test:db` OK en staging/test.
- [ ] Rollback disponible.
- [ ] Tenant isolation validado.

## Seguridad

- [ ] `JWT_SECRET` fuerte y unico.
- [ ] Cookies `Secure` en produccion.
- [ ] CSRF activo.
- [ ] CORS restringido.
- [ ] Security headers activos.
- [x] Rate limiting minimo implementado.
- [ ] No secretos en logs.

## Operacion

- [ ] `/api/health` OK.
- [ ] `/api/ready` OK.
- [ ] Logs con request id.
- [ ] Alertas definidas.
- [ ] Runbook migracion disponible.
- [ ] Rollback productivo disponible.

## Producto

- [ ] Login.
- [ ] Logout.
- [ ] `/api/auth/me`.
- [ ] Clients.
- [ ] Packages.
- [ ] Client portal.
- [ ] Chat.
- [ ] Settings.
- [ ] Dashboard metrics.

## Decision

Estado actual: `NO-GO`.

Motivos:

- Falta DB staging/test validada.
- Falta migracion 003 aplicada y `npm run test:db` OK contra staging.
- Rate limiting in-memory es suficiente para MVP/staging, pero requiere provider/Redis para escala horizontal.

Ultima validacion local:

- `backend npm test`: OK, 9 tests passing, suite DB skipped por falta de `TEST_DATABASE_URL`.
- `frontend npm run lint`: OK, sin warnings.
- `frontend npm run build`: OK.
- `backend npm audit --json`: 0 vulnerabilidades.
- `frontend npm audit --json`: 0 vulnerabilidades.

Actualizacion 2026-06-12:

- Frontend actualizado a Next `15.5.19`.
- `xlsx` eliminado y exportacion cliente migrada a CSV.
- Backend migrado a `bcryptjs`.
- Build Next 15 validado.
