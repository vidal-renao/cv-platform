# Staging Migration 003 Runbook

Fecha: 2026-06-11

## Objetivo

Ejecutar `backend/migrations/003_api_hardening_support_tables.sql` en staging de forma controlada, con backup, validacion y rollback documentado.

## Pre-checks

- Confirmar que staging apunta a la base correcta.
- Confirmar que existe backup reciente y restaurable.
- Confirmar que las tablas base existen: `users`, `clients`, `packages`, `password_resets`.
- Confirmar que `pgcrypto` puede instalarse o ya existe.
- Confirmar que la app desplegada espera tokens hashados en `password_resets.token`.

## Variables Necesarias

- `DATABASE_URL`: conexion PostgreSQL/Supabase de staging.
- `JWT_SECRET`: minimo 32 caracteres.
- `FRONTEND_URL`: URL publica de staging para links de acceso.
- `RESEND_API_KEY` y `RESEND_FROM_EMAIL`: si se validan emails reales.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`: si se validan WhatsApp.

## Backup Recomendado

Ejecutar antes de la migracion:

```powershell
pg_dump $env:DATABASE_URL -Fc -f staging-before-003.dump
```

Verificar que el archivo existe y tiene tamano mayor a 0.

## Comando de Migracion

Desde la raiz del repo:

```powershell
psql $env:DATABASE_URL -f backend/migrations/003_api_hardening_support_tables.sql
```

## Validaciones Post-Migracion

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('app_settings', 'package_comments', 'delivery_proofs');
```

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'password_resets'
  AND column_name IN ('purpose', 'created_by_user_id');
```

```sql
SELECT id, currency_code, currency_symbol, cost_per_kg
FROM app_settings
WHERE id = 1;
```

```sql
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('app_settings', 'package_comments', 'delivery_proofs', 'password_resets')
ORDER BY tablename, indexname;
```

## Smoke Tests Funcionales

- Login en staging.
- `/api/auth/me` con sesion valida.
- `generate-access` devuelve `accessUrl` y no password.
- `resend-access` devuelve `accessUrl` y no password.
- Crear comentario de paquete.
- Registrar proof de entrega.
- Leer settings.

## Rollback

Rollback preferido:

1. Revertir release de aplicacion.
2. Mantener tablas/columnas creadas.
3. Revisar impacto de datos.

Rollback SQL conservador:

```powershell
psql $env:DATABASE_URL -f backend/migrations/003_api_hardening_support_tables.rollback.sql
```

Ese archivo no borra datos por defecto; muestra conteos y contiene pasos destructivos comentados.

## Criterios de Exito

- Migracion termina sin error.
- Tablas y columnas esperadas existen.
- `app_settings` contiene fila `id = 1`.
- Build desplegado puede leer settings.
- Access flow genera links validos.
- No hay errores 500 en APIs restauradas.

## Criterios de Parada

- Falta alguna tabla base.
- No hay backup verificable.
- La migracion falla dentro de `BEGIN/COMMIT`.
- FKs fallan por schema base incompatible.
- Staging empieza a devolver errores 500 en auth/access/settings.

