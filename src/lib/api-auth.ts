import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use a server-side client to access the api_keys table
// We MUST NOT expose this client to the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. API authentication will fail.');
}

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey || '');

/**
 * Validates the API Key from the request header.
 * Expected Header: x-api-key: <YOUR_KEY>
 * 
 * Logic:
 * 1. Hash the incoming key with SHA256.
 * 2. Look up the hash in the `api_keys` table.
 * 3. Check if active.
 * 4. Update `last_used_at`.
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !supabaseServiceRoleKey) return false;

    // Hash the key to match what is stored in DB
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const { data, error } = await adminClient
        .from('api_keys')
        .select('id, is_active')
        .eq('key_hash', keyHash)
        .single();

    if (error || !data) {
        return false;
    }

    if (!data.is_active) {
        return false;
    }

    // Async update last_used_at (fire and forget)
    adminClient
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id)
        .then(({ error }) => {
            if (error) console.error('Failed to update last_used_at', error);
        });

    return true;
}

/**
 * Helper to generate a new key and its hash.
 * Use this in a script or admin UI to generate keys.
 */
export function generateNewApiKey() {
    const prefix = 'sk_live_';
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const apiKey = `${prefix}${randomBytes}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    return { apiKey, keyHash };
}
