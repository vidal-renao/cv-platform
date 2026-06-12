# Production Readiness Audit

Fecha: 2026-06-11

## Estado Actual

- Frontend Next.js compila y lint pasa sin warnings.
- Backend Express tiene tests reales y health endpoint.
- APIs Next restauradas como TypeScript.
- Sesion principal: cookie HttpOnly `cv_session`.
- CSRF: origin/referer check en mutaciones `/api/*`.
- Migracion 003, rollback y runbooks staging existen.
- Tests DB opt-in existen pero no se han ejecutado contra DB real.

## Bloqueantes Para Produccion

- No se ha ejecutado migracion 003 en staging/pre-produccion real.
- No hay validacion DB real de tenant isolation.
- No hay `TEST_DATABASE_URL` confirmado.
- Vulnerabilidades pendientes: Next major, `xlsx`, `bcrypt` transitive `tar`.
- Rate limiting no esta implementado en runtime productivo.

## Riesgos Altos

- Dependencias: `next` requiere upgrade major para cerrar advisories.
- `xlsx` vulnerable se usa para export client-side.
- `bcrypt` backend arrastra `tar` vulnerable via binarios nativos.
- Sin rate limiting en login/reset/access/chat.

## Riesgos Medios

- CSP permite `unsafe-inline`/`unsafe-eval` por compatibilidad Next actual.
- CSRF permite requests sin `Origin`/`Referer` para compatibilidad server-to-server.
- DB integration tests no se han corrido contra staging.

## Riesgos Bajos

- Backend Express podria quedar como stack secundario mientras Next API es principal.
- Logging basico, sin plataforma de observabilidad central.

## Acciones Recomendadas

1. Ejecutar migracion 003 en staging con backup.
2. Correr `npm run test:db` contra staging/test.
3. Configurar rate limiting productivo.
4. Planificar rama Next 16.
5. Sustituir o aislar `xlsx`.
6. Resolver estrategia `bcrypt`/`bcryptjs`.

## Decision Actual

`NO-GO` para produccion hasta validar DB staging/test y rate limiting.

