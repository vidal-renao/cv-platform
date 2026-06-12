# Production Migration Runbook

Fecha: 2026-06-11

## Pre-checks

- Staging validado con migracion 003.
- Backup de produccion aprobado.
- Ventana de mantenimiento aprobada.
- Rollback disponible.
- Responsable de decision GO/NO-GO asignado.

## Backup

```powershell
pg_dump $env:DATABASE_URL -Fc -f production-before-003.dump
```

Verificar archivo y restauracion en entorno controlado.

## Migracion

```powershell
psql $env:DATABASE_URL -f backend/migrations/003_api_hardening_support_tables.sql
```

## Validacion

Ejecutar queries del runbook staging:

- tablas `app_settings`, `package_comments`, `delivery_proofs`.
- columnas `password_resets.purpose`, `password_resets.created_by_user_id`.
- fila `app_settings.id = 1`.
- indexes esperados.

## Criterios de Parada

- Backup ausente.
- DB no confirmada como produccion correcta.
- Error en FK/schema base.
- Error en readiness DB.
- 500s en auth/access/settings.

## Comunicacion

- Avisar inicio de ventana.
- Avisar resultado de migracion.
- Avisar rollback si aplica.

