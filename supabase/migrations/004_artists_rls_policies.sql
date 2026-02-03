-- =====================================================
-- Migration: Add RLS Policies for Artists Table
-- =====================================================
-- Date: 2026-02-01
-- Description: Enable RLS and add policies for artists table

-- Enable RLS on artists table
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Allow users to read all artist profiles (public information)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'artists' AND policyname = 'Anyone can view artist profiles'
  ) THEN
    CREATE POLICY "Anyone can view artist profiles"
    ON artists FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- Allow authenticated users to view their own artist profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'artists' AND policyname = 'Users can view their own artist profile'
  ) THEN
    CREATE POLICY "Users can view their own artist profile"
    ON artists FOR SELECT
    TO authenticated
    USING (
      privy_user_id IN (
        SELECT privy_user_id FROM users WHERE auth_user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Allow users to insert their own artist profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'artists' AND policyname = 'Users can create their artist profile'
  ) THEN
    CREATE POLICY "Users can create their artist profile"
    ON artists FOR INSERT
    TO authenticated
    WITH CHECK (
      privy_user_id IN (
        SELECT privy_user_id FROM users WHERE auth_user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Allow users to update their own artist profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'artists' AND policyname = 'Users can update their artist profile'
  ) THEN
    CREATE POLICY "Users can update their artist profile"
    ON artists FOR UPDATE
    TO authenticated
    USING (
      privy_user_id IN (
        SELECT privy_user_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
    WITH CHECK (
      privy_user_id IN (
        SELECT privy_user_id FROM users WHERE auth_user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Comments
COMMENT ON POLICY "Anyone can view artist profiles" ON artists IS 'Artist profiles are public information';
COMMENT ON POLICY "Users can view their own artist profile" ON artists IS 'Authenticated users can view their own profile';
COMMENT ON POLICY "Users can create their artist profile" ON artists IS 'Users can create their own artist profile';
COMMENT ON POLICY "Users can update their artist profile" ON artists IS 'Artists can update their own profile information';
