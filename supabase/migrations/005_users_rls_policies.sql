-- =====================================================
-- Migration: Add RLS Policies for Users Table
-- =====================================================
-- Date: 2026-02-01
-- Description: Enable RLS and add policies for users table to allow API access

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow service role and anon key to query users by privy_user_id
-- This is needed for API routes to verify user identity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Allow user lookup by privy_user_id'
  ) THEN
    CREATE POLICY "Allow user lookup by privy_user_id"
    ON users FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

-- Comments
COMMENT ON POLICY "Allow user lookup by privy_user_id" ON users IS 'Allow API routes to verify users by privy_user_id';
