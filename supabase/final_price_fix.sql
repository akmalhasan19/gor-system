-- RECOMMENDED FIX: Add proper 'price' column to match application code
-- This will fix the 999999 → 99997 rounding issue

-- Step 1: Add price column with DECIMAL type (proper for currency)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Step 2: Copy selling_price to price for existing products
UPDATE products 
SET price = selling_price 
WHERE price = 0 OR price IS NULL;

-- Step 3: Make selling_price nullable (optional, since we now have price)
ALTER TABLE products 
ALTER COLUMN selling_price DROP NOT NULL;

-- Step 4: Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Step 5: Verify price column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('price', 'selling_price')
ORDER BY column_name;
