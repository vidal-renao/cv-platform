# Next 16 Upgrade Plan

Fecha: 2026-06-11

## Version Actual

- `next`: `^14.2.3`, lock actual en 14.2.x.
- `eslint-config-next`: `14.2.3`.
- `react`: `^18.2.0`.

## Version Objetivo

- `next`: `16.2.9` o la version estable recomendada por audit en la ventana de upgrade.
- `eslint-config-next`: misma major que Next.
- React debe validarse segun peer dependencies de Next 16.

## Decision Recomendada

No hacer upgrade en esta fase. Ejecutarlo en rama separada, con ventana de QA, porque implica major upgrade de framework, linting y posiblemente React.

## Riesgos

- App Router: cambios de runtime, cache y server components.
- Middleware: cambios de proxy/middleware y semantica Edge.
- Metadata/viewport: ya se migro `themeColor` a `viewport`, pero debe revalidarse.
- `next/image`: revisar configuracion de dominios/cache.
- ESLint: `next lint` puede cambiar o quedar deprecado segun version.
- Dependencias React: posible upgrade a React 19.

## Pasos Propuestos

1. Crear rama `upgrade/next-16`.
2. Actualizar `next`, `eslint-config-next`, `react`, `react-dom` y tipos compatibles.
3. Ejecutar `npm install`.
4. Corregir breaking changes.
5. Ejecutar `npm run lint`.
6. Ejecutar `npm run build`.
7. Validar middleware auth y CSRF.
8. Validar todos los endpoints App Router.
9. Validar login, logout, client portal, dashboard y access flow.
10. Desplegar preview/staging.

## Rollback

- Revertir rama o PR.
- Restaurar `package.json` y `package-lock.json`.
- Redeploy del build anterior.

## Validaciones Obligatorias

- `npm run lint`
- `npm run build`
- smoke tests de auth/access/settings/packages
- prueba manual de middleware dashboard/client
- auditoria `npm audit`

