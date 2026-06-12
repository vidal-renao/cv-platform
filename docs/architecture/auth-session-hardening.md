# Auth Session Hardening

Fecha: 2026-06-11

## Modelo de sesion

La sesion principal se unifica en la cookie HttpOnly `cv_session`.

- Login: valida credenciales y emite JWT firmado.
- Cookie: `HttpOnly`, `SameSite=Strict`, `Secure` en produccion.
- Middleware Edge: valida criptograficamente el JWT antes de permitir rutas protegidas.
- API routes: usan `getUser(request)` para resolver usuario desde la cookie.
- Frontend: usa `/api/auth/me` como fuente de verdad.
- Logout: elimina `cv_session` desde backend.

## Cambios relevantes

- Se elimina el fallback hardcodeado `cvplatform_super_secure_key_2026`.
- `JWT_SECRET` ahora falla cerrado si falta o no cumple longitud minima.
- Se elimina `auth_session`.
- Se elimina la dependencia de `localStorage.user` para autorizacion real.
- `fetchWithAuth` envia `credentials: 'same-origin'` y no adjunta Bearer tokens desde storage.

## Roles

Roles soportados:

- `SUPERADMIN`
- `ADMIN`
- `STAFF`
- `CLIENT`

Politica aplicada:

- `CLIENT`: solo recursos propios del portal cliente.
- `STAFF`: acceso operativo restringido al tenant/owner cuando aplica.
- `ADMIN`: acceso administrativo del tenant.
- `SUPERADMIN`: acceso global.

Helpers de rol:

- `isInternalUser`
- `isAdminUser`
- `assignableRolesFor`
- `canAccessTenantResource`

## Middleware

El middleware protege rutas de dashboard y cliente. La verificacion se hace en Edge con Web Crypto HMAC-SHA256 para tokens JWT HS256.

Comportamiento esperado:

- Sin cookie valida: redireccion o rechazo.
- Rol incorrecto: bloqueo/redirect segun segmento protegido.
- Token manipulado o expirado: rechazo.

## Decisiones de seguridad

- No se acepta Bearer token como fallback para APIs internas.
- No se crea schema desde endpoints.
- No se confia en estado del navegador para permisos.
- Las rutas de setup/seed no se restauran como rutas publicas.

## Deuda pendiente

- Rotacion de secretos y soporte de key id si se requiere rotacion sin invalidar sesiones.
- Tests automatizados para tampering de JWT, expiracion, cookie ausente y roles.
- CSRF con token firmado por sesion si se requieren integraciones cross-origin.

## CSRF

Se agrego proteccion CSRF centralizada en `frontend/middleware.ts` para mutaciones `/api/*`.

- Metodos protegidos: `POST`, `PUT`, `PATCH`, `DELETE`.
- Estrategia: validar `Origin` o `Referer` contra `request.nextUrl.origin`.
- Fallo: respuesta JSON `403`.
- Compatibilidad: login/logout same-origin no se rompen; peticiones server-to-server sin `Origin`/`Referer` siguen permitidas.
