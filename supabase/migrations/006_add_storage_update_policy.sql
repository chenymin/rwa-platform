
-- =====================================================
-- Migration: Add UPDATE policy for storage.objects
-- =====================================================
-- Date: 2026-02-01
-- Description: Add missing UPDATE policy for artworks storage bucket
-- This fixes the RLS violation error when uploading images

-- Add UPDATE policy for artworks storage
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Artists can update artworks" ON storage.objects;

  -- Create new policy that allows service role and authenticated users to update
  CREATE POLICY "Artists can update artworks"
  ON storage.objects FOR UPDATE
  TO authenticated, service_role
  USING (
    bucket_id = 'artworks'
  )
  WITH CHECK (
    bucket_id = 'artworks'
  );
END $$;
