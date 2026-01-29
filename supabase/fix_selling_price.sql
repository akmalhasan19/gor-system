-- Check products table structure to see selling_price column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products' 
ORDER BY ordinal_position;

-- Option 1: Make selling_price nullable (if it's redundant)
ALTER TABLE products ALTER COLUMN selling_price DROP NOT NULL;

-- Option 2: Set default value for selling_price
ALTER TABLE products ALTER COLUMN selling_price SET DEFAULT 0;

-- Option 3: If price and selling_price should be the same, copy price to selling_price
-- UPDATE products SET selling_price = price WHERE selling_price IS NULL;

-- Refresh schema
NOTIFY pgrst, 'reload schema';
