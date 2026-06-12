# Performance Production Review

Fecha: 2026-06-11

## Estado

`next build` muestra bundles razonables. La pagina mas pesada es dashboard analytics por librerias de charts.

## Observaciones

- `xlsx` se carga con import dinamico en client dashboard, evitando coste inicial.
- `next/image` se usa en proofs tras limpieza de warnings.
- APIs son dinamicas, correcto para auth/tenant.
- `pg` pool usa max 1 en serverless, reduciendo saturacion.

## Riesgos

- `xlsx` vulnerable y pesado, aunque lazy.
- Dashboard analytics puede crecer por charts.
- CSP actual permite inline/eval.

## Recomendaciones

- Mantener `xlsx` lazy hasta reemplazarlo.
- Considerar CSV export para paquetes.
- Medir analytics con bundle analyzer en fase separada.
- Revisar cache de endpoints publicos como tracking.

