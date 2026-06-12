# Database Migrations Hardening Spec

Fecha: 2026-06-11

## Hecho

Se creo `backend/migrations/003_api_hardening_support_tables.sql` para soportar las APIs restauradas sin `ensureTables` ni mutaciones dinamicas de schema.

## Tablas cubiertas

- `app_settings`: configuracion global y preparada para tenant por `tenant_user_id`.
- `package_comments`: comentarios asociados a `packages`, con autor interno o cliente.
- `delivery_proofs`: pruebas de entrega con firma, foto, archivo o metadata.
- `password_resets`: endurecida con `purpose` y `created_by_user_id` para distinguir reset normal de acceso cliente.

## Tablas ya existentes

- `chat_messages` ya estaba en `backend/schema.sql` y `backend/migrations/002_last_seen_and_chat.sql`.

## Archivos tocados

- `backend/migrations/003_api_hardening_support_tables.sql`
- `frontend/app/api/auth/forgot-password/route.ts`
- `frontend/app/api/auth/reset-password/route.ts`
- `frontend/app/api/clients/[id]/generate-access/route.ts`
- `frontend/app/api/clients/[id]/resend-access/route.ts`

## Pendiente

- Ejecutar la migracion contra Supabase/PostgreSQL de staging y produccion.
- Confirmar si se habilitara RLS en Supabase; si se habilita, crear policies por tenant/owner.
- Convertir migraciones historicas no versionadas a una secuencia unica si se adopta Supabase CLI.

## Comandos relevantes

- `npm run build` en `frontend`: OK.
- `npm test` en `backend`: OK.

