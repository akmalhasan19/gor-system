const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdmin() {
    const email = 'admin@example.com';
    const password = 'password123'; // Default Dev Password

    console.log(`Creating user ${email}...`);

    const { data: { user }, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Super Admin',
            role: 'super_admin',
            phone_verified: true,
            venue_id: 'e4256eb0-1234-4567-890a-1234567890ab' // Dummy UUID if needed, or null if logic handles it
        }
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('User created successfully:', user);
        console.log('You can now login with:');
        console.log('Email:', email);
        console.log('Password:', password);
    }
}

createAdmin();
