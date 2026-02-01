require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key (Length):', supabaseKey ? supabaseKey.length : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing connection...');
    const { data, error } = await supabase.from('api_keys').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Connection Failed:', error);
    } else {
        console.log('Connection Successful!');
    }
}

testConnection();
