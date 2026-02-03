-- =====================================================
-- Migration: Create Storage Bucket for Artworks
-- =====================================================
-- Date: 2026-02-01
-- Description: Create storage bucket for artwork images and certificates

-- Create artworks storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artworks',
  'artworks',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Drop old policy if exists and recreate with service_role support
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Artists can upload artworks" ON storage.objects;

  -- Create new policy that allows service role
  CREATE POLICY "Artists can upload artworks"
  ON storage.objects FOR INSERT
  TO authenticated, service_role
  WITH CHECK (
    bucket_id = 'artworks'
  );
END $$;

-- Allow public read access to artworks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view artworks'
  ) THEN
    CREATE POLICY "Public can view artworks"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'artworks');
  END IF;
END $$;

-- Drop old delete policy if exists and recreate with service_role support
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Artists can delete their artworks" ON storage.objects;

  -- Create new policy that allows service role
  CREATE POLICY "Artists can delete their artworks"
  ON storage.objects FOR DELETE
  TO authenticated, service_role
  USING (
    bucket_id = 'artworks'
  );
END $$;

-- Drop old update policy if exists and recreate with service_role support
DO $$
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Artists can update artworks" ON storage.objects;

  -- Create new policy that allows service role
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
