-- =====================================================
-- Migration: Change role field to TEXT[] array
-- =====================================================
-- 在 Supabase Dashboard 的 SQL Editor 中运行此脚本

-- Step 1: Add new roles column
ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['user']::TEXT[];

-- Step 2: Migrate existing data from role to roles array
UPDATE users
SET roles = CASE
  WHEN role IS NOT NULL THEN ARRAY[role]::TEXT[]
  ELSE ARRAY['user']::TEXT[]
END
WHERE roles = ARRAY['user']::TEXT[] OR roles IS NULL;

-- Step 3: Drop the old role column
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Step 4: Add constraint to ensure valid roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_roles' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT check_roles CHECK (
      roles <@ ARRAY['user', 'artist', 'admin']::TEXT[]
      AND array_length(roles, 1) > 0
    );
  END IF;
END $$;

-- Step 5: Create index on roles for better query performance
DROP INDEX IF EXISTS idx_users_roles;
CREATE INDEX idx_users_roles ON users USING GIN(roles);

-- Step 6: Drop old role index if exists
DROP INDEX IF EXISTS idx_users_role;

-- Comments
COMMENT ON COLUMN users.roles IS 'Array of user roles - can have multiple roles like [''user'', ''artist'']';
