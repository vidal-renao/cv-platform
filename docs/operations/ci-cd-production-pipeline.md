# CI/CD Production Pipeline

Fecha: 2026-06-11

## Implementado

Workflow:

- `.github/workflows/ci.yml`

Jobs:

- Frontend: `npm ci`, `npm run lint`, `npm run build`, audit no bloqueante.
- Backend: `npm ci`, `npm test`, audit no bloqueante.
- DB integration: `npm run test:db` solo si existe secret `TEST_DATABASE_URL`.

## Produccion

No hay deploy automatico a produccion en este workflow.

Recomendacion:

- Deploy preview para PRs.
- Deploy staging automatico tras merge.
- Deploy produccion con approval manual.
- Secrets en GitHub/Vercel, nunca en repo.

