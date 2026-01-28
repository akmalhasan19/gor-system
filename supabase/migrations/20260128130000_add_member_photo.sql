-- Add photo_url column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS photo_url TEXT;
