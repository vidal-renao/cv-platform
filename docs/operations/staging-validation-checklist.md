# Staging Validation Checklist

Fecha: 2026-06-11

## Estado Actual

Decision: `NO-GO` para ejecutar migracion/tests contra DB real desde esta sesion.

Motivo: no se pudo confirmar `TEST_DATABASE_URL`/`DATABASE_URL` de staging sin exponer credenciales, no hay evidencia local de backup aprobado, y `npm run test:db` no pudo lanzarse por un fallo del sandbox de Windows (`spawn setup refresh`). No se debe ejecutar una migracion contra una DB desconocida.

## Checklist Previo

- [ ] DB destino confirmada como staging/test, no produccion.
- [ ] `TEST_DATABASE_URL` configurada para tests DB.
- [ ] `DATABASE_URL` configurada para migracion staging, si se ejecuta manualmente.
- [ ] Backup realizado y verificado.
- [ ] Usuario DB con permisos suficientes, idealmente no superuser.
- [x] Migracion 003 revisada.
- [x] Rollback conservador disponible y tolerante a tablas ausentes.
- [x] Tests DB preparados.
- [ ] Seed/fixtures de staging aprobados.
- [ ] Ventana de ejecucion aprobada.

## Variables Necesarias

No escribir credenciales reales en documentacion.

```powershell
$env:TEST_DATABASE_URL='postgresql://USER:PASSWORD@HOST:PORT/DB_STAGING_OR_TEST'
$env:FRONTEND_URL='https://staging.example.com'
```

Para ejecutar migracion con `psql`:

```powershell
$env:DATABASE_URL=$env:TEST_DATABASE_URL
```

## Validacion Anti-Produccion

Antes de ejecutar, confirmar manualmente:

- Host no corresponde a produccion.
- Nombre de DB indica staging/test.
- Usuario no es root/superuser salvo necesidad aprobada.
- Backup existe y puede restaurarse.

## Migracion 003

Archivo:

- `backend/migrations/003_api_hardening_support_tables.sql`

Comando:

```powershell
psql $env:DATABASE_URL -f backend/migrations/003_api_hardening_support_tables.sql
```

Validaciones:

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

## Rollback

Archivo:

- `backend/migrations/003_api_hardening_support_tables.rollback.sql`

Comando:

```powershell
psql $env:DATABASE_URL -f backend/migrations/003_api_hardening_support_tables.rollback.sql
```

Nota: el rollback no elimina datos por defecto; primero muestra conteos. Las sentencias destructivas estan comentadas y requieren decision manual.

## Tests DB

Comando:

```powershell
cd backend
npm run test:db
```

Estado local de esta sesion:

- `npm test`: OK, suite DB skipped por diseno si no hay DB configurada.
- `npm run test:db`: no ejecutado por fallo del sandbox de Windows, pendiente de entorno con `TEST_DATABASE_URL`.

Esperado cuando `TEST_DATABASE_URL` esta configurado:

- La suite no queda skipped.
- Ejecuta migracion 003.
- Crea tenants/clientes/paquetes controlados.
- Valida token hashado.
- Valida settings.
- Valida comments/proofs.
- Valida aislamiento tenant-scoped.
- Limpia datos temporales.

## CSRF

Validar en staging:

- [ ] `GET /api/auth/me` sin sesion devuelve auth error, no bloqueo CSRF.
- [ ] `POST /api/auth/login` con origin staging permitido.
- [ ] `POST /api/auth/logout` con origin staging permitido.
- [ ] `POST /api/settings` con origin externo devuelve `403`.
- [ ] GET API no queda bloqueado.

## Criterios de Exito

- Migracion 003 aplicada sin errores.
- Tablas/columnas esperadas presentes.
- `npm run test:db` pasa contra DB real.
- Tenant isolation validado.
- Tokens no se guardan en claro.
- `generate-access`/`resend-access` no devuelven passwords.
- CSRF bloquea origin externo y no rompe flujos legitimos.

## Criterios de Parada

- DB destino no confirmada.
- No hay backup.
- `TEST_DATABASE_URL` apunta a produccion.
- Fallan FKs base (`users`, `clients`, `packages`, `password_resets`).
- Tests DB fallan en tenant isolation.
- CSRF rompe login/logout.
