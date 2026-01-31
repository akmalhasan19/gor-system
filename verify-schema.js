const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Or SERVICE_ROLE_KEY if needed for schema inspection
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
    console.log('Checking transactions table columns...');

    // Try to insert a dummy record with the new columns. 
    // If it fails with "column does not exist", then migration is not applied.
    // Actually, better to query information_schema if possible, but RLS might block.
    // But with Service Role Key, we bypass RLS.

    // Let's try to select the new columns from an empty query
    const { data, error } = await supabase
        .from('transactions')
        .select('customer_id, customer_name, customer_phone')
        .limit(1);

    if (error) {
        console.error('Error selecting columns:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('Migration NOT applied.');
        } else {
            console.log('Migration status unclear (other error).');
        }
    } else {
        console.log('Columns exist! Migration applied.');
    }
}

checkColumns();
