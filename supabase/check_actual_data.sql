-- Check what's actually stored in the database
-- Run this to see the RAW data in products table

SELECT 
    id,
    name,
    price,
    selling_price,
    cost_price,
    stock,
    category
FROM products 
ORDER BY created_at DESC 
LIMIT 5;

-- Check data types
SELECT 
    column_name, 
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('price', 'selling_price', 'cost_price')
ORDER BY column_name;
