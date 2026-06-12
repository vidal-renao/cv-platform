# Automated API Auth Roles Tests

Fecha: 2026-06-11

## Hecho

Se agrego una suite real de Jest/Supertest en `backend/__tests__/app.test.js`.

Cobertura inicial:

- `GET /health` devuelve OK.
- Ruta inexistente devuelve JSON 404.
- Ruta protegida de auth rechaza peticion sin token.
- `requireRole` bloquea rol no permitido.
- `authenticateToken` rechaza Bearer token malformado.

## Resultado

`npm test` ya no depende de `--passWithNoTests`.

Resultado actual:

- 1 suite passing.
- 5 tests passing.

## Pendiente

- Tests de integracion con DB de login correcto/incorrecto.
- Tests de tenant isolation para clients, packages y client portal.
- Tests de contratos Next API para rutas `frontend/app/api`.
- Mock estable de PostgreSQL para handlers Next o entorno de test con DB efimera.

## Archivos tocados

- `backend/__tests__/app.test.js`

## Integracion DB Opt-in

Se agrego `backend/__tests__/db.integration.test.js`.

Por defecto queda omitido para no romper `npm test` en maquinas sin PostgreSQL/Supabase de test. Se activa con:

```powershell
$env:TEST_DATABASE_URL='postgresql://USER:PASSWORD@HOST:PORT/DB'
npm run test:db
```

Tambien se puede forzar con `RUN_DB_INTEGRATION=1` si se quiere reutilizar `DATABASE_URL`:

```powershell
$env:RUN_DB_INTEGRATION='1'
npm run test:db
```

Cobertura preparada:

- Ejecucion de migracion 003 contra DB de test.
- Existencia de `app_settings`, `package_comments`, `delivery_proofs`.
- Token publico almacenado como hash SHA-256.
- `purpose = client_access`.
- Lectura/actualizacion de settings.
- Creacion de comment y proof asociados a package.
- Query tenant-scoped que no filtra paquetes de otro tenant.

## Estado Staging 2026-06-11

`npm test` local sigue ejecutando la suite normal y deja la integracion DB skipped si no hay DB configurada.

La ejecucion real de `npm run test:db` queda pendiente hasta configurar `TEST_DATABASE_URL` contra una DB staging/test confirmada. No debe apuntar a produccion.
