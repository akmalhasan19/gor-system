-- RECOMMENDED FIX: Ensure 'price' column is DECIMAL(12,2)
-- This fixes the precision issues (e.g. 696969 -> 696967) caused by REAL/FLOAT types

-- Step 1: Add price column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) DEFAULT 0;

-- Step 2: Enforce precision (Convert existing REAL/FLOAT to DECIMAL)
-- This is critical if the column exists but is the wrong type
ALTER TABLE products 
ALTER COLUMN price TYPE DECIMAL(12,2);

-- RECOMMENDED FIX: Ensure 'price' column is DECIMAL(12,2)
-- This fixes the precision issues (e.g. 696969 -> 696967) caused by REAL/FLOAT types

-- Step 1: Add price column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) DEFAULT 0;

-- Step 2: Enforce precision (Convert existing REAL/FLOAT to DECIMAL)
-- This is critical if the column exists but is the wrong type
ALTER TABLE products 
ALTER COLUMN price TYPE DECIMAL(12,2);

-- Step 3: Refresh schema cache
NOTIFY pgrst, 'reload schema';
