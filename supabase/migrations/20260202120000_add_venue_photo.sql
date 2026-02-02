-- Add photo_url to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Ensure venue-photos bucket exists (idempotent check not easily possible in pure SQL without extension, 
-- but user said it exists. We will ensure policies exist for public access)

-- Enable RLS on objects if not already
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Policy: Public can view venue photos (SELECT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public can view venue-photos'
    ) THEN
        CREATE POLICY "Public can view venue-photos" ON storage.objects
        FOR SELECT USING (bucket_id = 'venue-photos');
    END IF;
END $$;

-- 2. Policy: Authenticated users can upload venue photos (INSERT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated can upload venue-photos'
    ) THEN
        CREATE POLICY "Authenticated can upload venue-photos" ON storage.objects
        FOR INSERT 
        WITH CHECK (
            bucket_id = 'venue-photos' 
            AND auth.role() = 'authenticated'
        );
    END IF;
END $$;

-- 3. Policy: Authenticated users can update/delete their venue photos
-- Note: Simplified to allow authenticated users to manage files in this bucket for now
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated can update venue-photos'
    ) THEN
        CREATE POLICY "Authenticated can update venue-photos" ON storage.objects
        FOR UPDATE
        USING (bucket_id = 'venue-photos' AND auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated can delete venue-photos'
    ) THEN
        CREATE POLICY "Authenticated can delete venue-photos" ON storage.objects
        FOR DELETE
        USING (bucket_id = 'venue-photos' AND auth.role() = 'authenticated');
    END IF;
END $$;
