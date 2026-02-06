const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteDemoAccount() {
    console.log('🗑️ Starting Demo Account Deletion...');

    const email = 'demo@smash.id';

    // 1. Find User to get ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('   ❌ Error listing users:', listError.message);
        return;
    }

    const demoUser = users.find(u => u.email === email);

    if (demoUser) {
        console.log(`   Found user: ${demoUser.email} (${demoUser.id})`);

        // 2. Find associated Venue first (for logging/confirmation)
        // We look up user_venues to find the venue ID
        const { data: userLink } = await supabase
            .from('user_venues')
            .select('venue_id')
            .eq('user_id', demoUser.id)
            .single();

        if (userLink) {
            const { data: venue } = await supabase
                .from('venues')
                .select('name, id')
                .eq('id', userLink.venue_id)
                .single();

            if (venue) {
                console.log(`   Found associated venue: ${venue.name} (${venue.id})`);

                // 3. Delete Venue (Cascade should handle courts and user_venues link if set up correctly, 
                // but let's be explicit if we want to be safe, though usually CASCADE on foreign key handles it.
                // Looking at migrations, venue deletion usually cascades.)

                // Delete Venue
                const { error: deleteVenueError } = await supabase
                    .from('venues')
                    .delete()
                    .eq('id', venue.id);

                if (deleteVenueError) {
                    console.error('   ❌ Error deleting venue:', deleteVenueError.message);
                } else {
                    console.log('   ✅ Venue deleted (including Courts and Links via Cascade).');
                }
            }
        }

        // 4. Delete Auth User
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(demoUser.id);

        if (deleteUserError) {
            console.error('   ❌ Error deleting user:', deleteUserError.message);
        } else {
            console.log('   ✅ User deleted successfully.');
        }

    } else {
        console.log('   Demo user not found. Nothing to delete.');
    }

    console.log('\n✨ Cleanup Complete! ✨');
}

deleteDemoAccount();
