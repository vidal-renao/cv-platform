-- ============================================
-- Crear usuario ADMIN en CV Platform
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

-- Credenciales:
--   Username: superadmin
--   Email:    admin@cvplatform.com
--   Password: Admin123!
--   Rol:      ADMIN

INSERT INTO users (username, email, password_hash, role)
VALUES (
  'superadmin',
  'admin@cvplatform.com',
  '$2b$10$ecAvVGfn0FHZ6aIX/m2PoO8rzvYo1d7DXdfYdxndbud4layMLWCOS',
  'ADMIN'
)
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role
RETURNING id, username, email, role, created_at;
