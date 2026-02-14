import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const email = process.argv[2];
const role = process.argv[3] || 'super_admin';

if (!email) {
    console.error('Usage: node scripts/seed-platform-admin.mjs <email> [super_admin|ops_admin]');
    process.exit(1);
}

if (!['super_admin', 'ops_admin'].includes(role)) {
    console.error('Invalid role. Allowed: super_admin, ops_admin');
    process.exit(1);
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    const normalizedEmail = email.toLowerCase().trim();

    const usersResponse = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersResponse.error) {
        throw usersResponse.error;
    }

    const user = usersResponse.data.users.find((item) => item.email?.toLowerCase() === normalizedEmail);
    if (!user) {
        throw new Error(`User not found: ${normalizedEmail}`);
    }

    const { error } = await supabase
        .from('platform_admins')
        .upsert(
            {
                user_id: user.id,
                role,
                is_active: true,
            },
            { onConflict: 'user_id' }
        );

    if (error) {
        throw error;
    }

    console.log(`Platform admin seeded: ${normalizedEmail} (${role})`);
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
