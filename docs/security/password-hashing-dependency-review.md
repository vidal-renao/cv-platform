# Password Hashing Dependency Review

Fecha: 2026-06-11

## Actualizacion 2026-06-12

Backend Express fue migrado de `bcrypt` nativo a `bcryptjs`.

Archivos actualizados:

- `backend/src/controllers/auth.js`
- `backend/src/controllers/users.js`
- `backend/src/controllers/clients.js`
- `backend/src/seeds/demo-users.js`
- `backend/hash.js`

Resultado:

- `backend npm audit --json`: 0 vulnerabilidades.
- Se elimina la cadena `bcrypt` -> `@mapbox/node-pre-gyp` -> `tar`.
- Los hashes bcrypt existentes siguen siendo verificables por `bcryptjs`.

Estado: riesgo supply-chain cerrado.

## Librerias Actuales

- Backend Express: `bcryptjs`.
- Frontend/Next API server routes: `bcryptjs`.

## Cadena Vulnerable

Historicamente, `npm audit` backend mantenia 2 high por:

- `bcrypt`
- `@mapbox/node-pre-gyp`
- `tar`

El riesgo esta en dependencias de instalacion/binarios nativos, no en el algoritmo bcrypt en si.

## Impacto Real

- Mayor riesgo durante instalacion/build o entornos que descargan/extractan binarios.
- Menor exposicion runtime si no se procesan archivos tar controlados por usuario.
- Sigue siendo deuda de supply chain para CI/CD.

## Opciones

1. Mantener `bcrypt` 5.x temporalmente y documentar riesgo.
2. Probar upgrade a `bcrypt` 6.x en rama separada.
3. Migrar backend Express a `bcryptjs`, alineando con Next API.
4. Migrar a `argon2`, con estrategia de compatibilidad progresiva.

## Recomendacion

Fase inmediata: no cambiar hashing en produccion sin pruebas de compatibilidad.

Fase siguiente recomendada:

- Crear rama `security/password-hashing`.
- Probar `bcrypt` 6.x.
- Si sigue arrastrando supply chain vulnerable o causa problemas nativos, migrar backend Express a `bcryptjs`.

## Compatibilidad de Hashes

Los hashes bcrypt existentes deben seguir verificandose. Si se migra a otra libreria:

- Mantener verificacion de bcrypt para hashes existentes.
- Re-hashear con nueva libreria en login exitoso.
- Guardar metadata de algoritmo si se adopta argon2.

## Decision 2026-06-11

No se cambia hashing en esta fase para evitar una regresion de login.

Riesgo aceptable temporalmente solo con aprobacion formal:

- El advisory pendiente entra por cadena de instalacion/build (`bcrypt` -> `@mapbox/node-pre-gyp` -> `tar`).
- No hay parsing de archivos tar controlados por usuario en runtime.
- CI/CD debe instalar solo desde lockfile y registry confiable.

Bloqueo recomendado para la siguiente fase: rama dedicada para probar `bcrypt` 6.x o migrar backend Express a `bcryptjs` manteniendo compatibilidad con hashes existentes.
