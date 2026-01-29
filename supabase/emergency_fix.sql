-- CRITICAL: Check if category column actually exists in production
-- Run this in Supabase SQL Editor (Production)

-- Check all columns in products table
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products' 
ORDER BY ordinal_position;

-- If category doesn't exist, manually add it
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category TEXT 
CHECK (category IN ('DRINK', 'FOOD', 'EQUIPMENT', 'RENTAL'));

-- Force reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verify category exists now
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'category';
