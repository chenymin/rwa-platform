-- =====================================================
-- Migration: Change role field to TEXT[] array
-- =====================================================
-- Date: 2026-02-01
-- Description: Change users.role from VARCHAR to TEXT[] to support multiple roles per user

-- Step 1: Add new roles column (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'roles'
  ) THEN
    ALTER TABLE users ADD COLUMN roles TEXT[] DEFAULT ARRAY['user']::TEXT[];
  END IF;
END $$;

-- Step 2: Migrate existing data from role to roles array (only if role column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    EXECUTE 'UPDATE users SET roles = ARRAY[role]::TEXT[] WHERE role IS NOT NULL AND (roles IS NULL OR array_length(roles, 1) IS NULL)';
  END IF;
END $$;

-- Step 3: Drop the old role column (only if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users DROP COLUMN role;
  END IF;
END $$;

-- Step 4: Add constraint to ensure valid roles (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_roles' AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT check_roles CHECK (
      roles <@ ARRAY['user', 'artist', 'admin']::TEXT[]
      AND array_length(roles, 1) > 0
    );
  END IF;
END $$;

-- Step 5: Create index on roles for better query performance (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_users_roles'
  ) THEN
    CREATE INDEX idx_users_roles ON users USING GIN(roles);
  END IF;
END $$;

-- Comments
COMMENT ON COLUMN users.roles IS 'Array of user roles - can have multiple roles like [''user'', ''artist'']';
