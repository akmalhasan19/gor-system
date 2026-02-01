require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateAndStoreKey() {
    // 1. Generate Random Key
    const prefix = 'sk_live_';
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const newApiKey = `${prefix}${randomBytes}`;

    // 2. Hash it
    const keyHash = crypto.createHash('sha256').update(newApiKey).digest('hex');

    console.log('------------------------------------------------');
    console.log('🔐 GENERATING NEW API KEY...');
    console.log('------------------------------------------------');
    console.log(`🔑 NEW KEY: \x1b[32m${newApiKey}\x1b[0m`);
    console.log('⚠️  COPY THIS KEY NOW! It will not be shown again.');
    console.log('------------------------------------------------');

    // 3. Store in DB
    const { data, error } = await supabase
        .from('api_keys')
        .insert({
            key_hash: keyHash,
            name: `Generated Key ${new Date().toISOString().split('T')[0]}`,
            description: 'Generated via generate-key.js',
            is_active: true
        })
        .select();

    if (error) {
        console.error('❌ Failed to save key to database:', error.message);
    } else {
        console.log('✅ Key successfully saved to database (hashed).');
        console.log(`🆔 Key ID: ${data[0].id}`);
    }
}

generateAndStoreKey();
