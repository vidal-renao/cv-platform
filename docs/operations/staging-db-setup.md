# Staging DB Setup

Fecha: 2026-06-11

## Objetivo

Preparar una base de datos staging/test segura para validar migraciones, tenant isolation y flujos criticos sin tocar produccion.

## Requisitos

- Base PostgreSQL/Supabase separada de produccion.
- Nombre y host claramente identificables como staging/test.
- Backup previo verificable.
- Usuario con permisos suficientes para migraciones, idealmente no superuser.
- Variables configuradas solo en runtime local/CI seguro, nunca en docs ni commits.

## Variables

```powershell
$env:TEST_DATABASE_URL='postgresql://USER:PASSWORD@HOST:PORT/cv_platform_staging_test'
$env:DATABASE_URL=$env:TEST_DATABASE_URL
$env:JWT_SECRET='32_plus_random_chars_for_staging_only'
$env:FRONTEND_URL='https://staging.example.com'
```

## Anti-Produccion

Antes de ejecutar cualquier migracion:

- Confirmar que host y nombre de DB no son produccion.
- Confirmar que la cuenta no apunta al proyecto Supabase productivo.
- Confirmar que existe backup o snapshot restaurable.
- Confirmar que el equipo acepta ejecutar datos seed/test.

## Migracion 003

Archivo:

```text
backend/migrations/003_api_hardening_support_tables.sql
```

Comando:

```powershell
psql $env:DATABASE_URL -f backend/migrations/003_api_hardening_support_tables.sql
```

Validacion minima:

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

## Tests DB

```powershell
cd backend
npm run test:db
```

Debe pasar sin skips cuando `TEST_DATABASE_URL` esta configurada. La suite valida tablas soporte, hash de token, settings, comments/proofs y aislamiento tenant-scoped.

## Rollback

Archivo:

```text
backend/migrations/003_api_hardening_support_tables.rollback.sql
```

El rollback es conservador: revisa conteos y evita eliminar datos por defecto. Cualquier sentencia destructiva debe habilitarse manualmente tras decision operativa.

## Criterio De Cierre

- Migracion aplicada sin errores.
- Tablas/columnas existen.
- `npm run test:db` OK.
- Tenant isolation OK.
- Tokens almacenados como hash.
- `generate-access` y `resend-access` no generan passwords temporales.
