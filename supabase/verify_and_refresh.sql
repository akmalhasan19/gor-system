SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

NOTIFY pgrst, 'reload schema';

SELECT 'Schema cache refreshed! Try adding a product now.' as status;