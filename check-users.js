const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function listUsers() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    console.log('Total Users:', users.length);
    users.forEach(u => {
        console.log(`- Email: ${u.email} | ID: ${u.id} | Confirmed: ${u.email_confirmed_at ? 'Yes' : 'No'} | Metadata:`, u.user_metadata);
    });
}

listUsers();
