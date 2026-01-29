-- Verify category column now exists and refresh cache
-- Run this in Supabase SQL Editor (Production)

-- Step 1: Check if category column exists now
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Step 2: Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- Step 3: Success message
SELECT 'Schema cache refreshed! Try adding a product now.' as status;
