-- Rollback for migration 003_api_hardening_support_tables.sql
-- This rollback is intentionally conservative.
--
-- Migration 003 creates data-bearing tables used by restored APIs:
--   app_settings
--   package_comments
--   delivery_proofs
-- and adds columns to password_resets:
--   purpose
--   created_by_user_id
--
-- Do not run destructive statements until the impact queries below are reviewed
-- and a database backup has been verified.

BEGIN;

-- Impact checks. These statements are safe and should be reviewed first.
-- They tolerate missing tables so the rollback can be used after partial/manual attempts.
DO $$
DECLARE
  table_name text;
  row_count bigint;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['app_settings', 'package_comments', 'delivery_proofs', 'password_resets']
  LOOP
    IF to_regclass(table_name) IS NULL THEN
      RAISE NOTICE '%: table does not exist', table_name;
    ELSE
      EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
      RAISE NOTICE '%: % rows', table_name, row_count;
    END IF;
  END LOOP;
END $$;

-- Recommended rollback for failed deployment while preserving data:
-- 1. Revert application release to the previous build.
-- 2. Keep the new tables/columns in place.
-- 3. Investigate and only drop objects after confirming no production data exists.

-- Manual destructive rollback, only after backup and impact approval:
--
-- DROP INDEX IF EXISTS idx_password_resets_purpose;
-- ALTER TABLE password_resets
--   DROP COLUMN IF EXISTS created_by_user_id,
--   DROP COLUMN IF EXISTS purpose;
--
-- DROP INDEX IF EXISTS idx_delivery_proofs_client_id;
-- DROP INDEX IF EXISTS idx_delivery_proofs_user_id;
-- DROP INDEX IF EXISTS idx_delivery_proofs_package_id;
-- DROP TABLE IF EXISTS delivery_proofs;
--
-- DROP INDEX IF EXISTS idx_package_comments_client_id;
-- DROP INDEX IF EXISTS idx_package_comments_user_id;
-- DROP INDEX IF EXISTS idx_package_comments_package_id;
-- DROP TABLE IF EXISTS package_comments;
--
-- DROP INDEX IF EXISTS idx_app_settings_tenant_user_id;
-- DROP TABLE IF EXISTS app_settings;

COMMIT;
