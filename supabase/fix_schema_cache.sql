-- Manual Schema Cache Refresh for Production
-- Run this in Supabase SQL Editor (Production)

-- Step 1: Verify category column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'category';

-- Step 2: Force schema cache reload
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify again after reload
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;
