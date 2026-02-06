SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'products' 
ORDER BY ordinal_position;

ALTER TABLE products ALTER COLUMN selling_price DROP NOT NULL;

ALTER TABLE products ALTER COLUMN selling_price SET DEFAULT 0;

NOTIFY pgrst, 'reload schema';