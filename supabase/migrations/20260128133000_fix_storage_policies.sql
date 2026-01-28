-- Ensure bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy for INSERT (Upload)
DROP POLICY IF EXISTS "Allow public uploads to member-photos" ON storage.objects;
CREATE POLICY "Allow public uploads to member-photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'member-photos');

-- Policy for SELECT (Read)
DROP POLICY IF EXISTS "Allow public reads from member-photos" ON storage.objects;
CREATE POLICY "Allow public reads from member-photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'member-photos');

-- Policy for UPDATE
DROP POLICY IF EXISTS "Allow public updates to member-photos" ON storage.objects;
CREATE POLICY "Allow public updates to member-photos"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'member-photos');
