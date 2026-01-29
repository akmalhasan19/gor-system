-- Add image_url column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create product-images storage bucket (idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy for INSERT (Upload)
DROP POLICY IF EXISTS "Allow authenticated uploads to product-images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to product-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Policy for SELECT (Read) - PUBLIC for displaying images
DROP POLICY IF EXISTS "Allow public reads from product-images" ON storage.objects;
CREATE POLICY "Allow public reads from product-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy for UPDATE
DROP POLICY IF EXISTS "Allow authenticated updates to product-images" ON storage.objects;
CREATE POLICY "Allow authenticated updates to product-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Policy for DELETE
DROP POLICY IF EXISTS "Allow authenticated deletes from product-images" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from product-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
