# Production Rollback Plan

Fecha: 2026-06-11

## Rollback Preferido

1. Revertir release de aplicacion.
2. Mantener columnas/tablas 003 si contienen datos.
3. Confirmar que version anterior funciona con schema expandido.

## Rollback SQL

Archivo:

- `backend/migrations/003_api_hardening_support_tables.rollback.sql`

Este rollback no borra datos por defecto. Primero muestra conteos y deja pasos destructivos comentados.

## Restauracion Completa

Solo si hay corrupcion o fallo grave:

```powershell
pg_restore --clean --if-exists -d $env:DATABASE_URL production-before-003.dump
```

Requiere aprobacion explicita.

## Incidente

- Congelar deploys.
- Capturar logs y request ids.
- Comunicar estado.
- Documentar causa y accion correctiva.

