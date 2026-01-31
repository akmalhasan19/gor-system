const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedKey() {
    const apiKey = 'sk_live_test_12345';
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    console.log('Seeding API Key:', apiKey);
    console.log('Hash:', keyHash);

    // Check if table exists (simple check by trying to select)
    const { error: tableCheck } = await supabase.from('api_keys').select('id').limit(1);
    if (tableCheck && tableCheck.code === '42P01') { // undefined_table
        console.error('CRITICAL: api_keys table does not exist. Please run the migration SQL manually in Supabase Dashboard SQL Editor.');
        console.log('Migration SQL location: supabase/migrations/20240131_create_api_keys.sql');
        process.exit(1);
    }

    // Insert or Update
    const { data, error } = await supabase
        .from('api_keys')
        .upsert({
            key_hash: keyHash,
            name: 'Automated Test Key',
            description: 'Created by seed-api-key.js',
            is_active: true
        }, { onConflict: 'key_hash' })
        .select();

    if (error) {
        console.error('Error seeding key:', error);
    } else {
        console.log('Success! Key seeded:', data);
    }
}

seedKey();
