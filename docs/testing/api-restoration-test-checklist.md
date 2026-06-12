# API Restoration Test Checklist

Fecha: 2026-06-11

## Validacion ejecutada

- `frontend npm run build`: pasa.
- `frontend npm run lint`: pasa con warnings no bloqueantes.
- `backend npm test -- --passWithNoTests`: pasa, pero no hay tests encontrados.
- `frontend npm audit --json`: 19 vulnerabilidades detectadas.
- `backend npm audit --json`: 13 vulnerabilidades detectadas.
- Busqueda de patrones peligrosos: sin matches para `auth_session`, secreto fallback, `ensureTables` y usos sensibles de `localStorage.user`.

## Checklist manual requerido

### Auth

- Login con credenciales validas crea `cv_session`.
- Login invalido devuelve `401`.
- `/api/auth/me` devuelve usuario autenticado.
- `/api/auth/me` sin cookie devuelve `401`.
- Logout limpia cookie.
- JWT manipulado o expirado no permite acceso.

### Roles

- `CLIENT` no entra a dashboard.
- `STAFF` entra a vistas operativas permitidas.
- `ADMIN` administra recursos de su tenant.
- `SUPERADMIN` accede globalmente.
- Usuario no autenticado no accede a rutas protegidas.

### Clients

- Listado de clientes respeta tenant.
- Crear cliente valida campos requeridos.
- Obtener, actualizar y borrar cliente no expone datos cruzados.
- `generate-access` genera acceso temporal compatible con UI.
- `resend-access` debe revisarse funcionalmente antes de produccion.

### Packages

- Crear paquete requiere rol interno.
- Listado y detalle filtran por owner/tenant.
- Cambio de estado permite solo transiciones operativas esperadas.
- Comments no se cruzan entre paquetes/tenants.
- Pickup y proof validan propiedad del paquete.

### Client portal

- Cliente ve solo su perfil.
- Cliente ve solo sus paquetes.
- Cliente no puede leer paquete de otro cliente por ID.
- Comments y proof del portal quedan asociados a su paquete.

### Dashboard and settings

- Metricas respetan tenant para no `SUPERADMIN`.
- Monthly dashboard respeta tenant.
- Settings devuelve defaults cuando no hay fila.
- Settings no crea tablas ni schema en runtime.

### Chat

- Contacts respeta usuario autenticado.
- Messages no exponen conversaciones ajenas.
- Unread count corresponde al usuario actual.

## Tests automatizados recomendados

Prioridad alta:

- Unit tests para `getUser`, `getJwtSecret` y helpers de rol.
- Integration tests de `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`.
- Integration tests multi-tenant para clients/packages/client portal.
- Contract tests para responses que consume la UI.

Prioridad media:

- Tests de dashboard metrics/monthly.
- Tests de chat basico.
- Tests de password reset/change-password.

## Nota

No se introdujo un framework nuevo de testing frontend en esta fase para evitar reestructuracion amplia. El backend ya usa Jest/Supertest, pero actualmente no contiene tests ejecutables.
