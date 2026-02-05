const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemoAccount() {
    console.log('🚀 Starting Demo Account Creation...');

    // 1. Create or Get User
    const email = 'demo@smash.id';
    const password = 'password123';
    let userId;

    console.log(`\n👤 Checking user: ${email}...`);

    // Check if exists by listing (admin only)
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log('   User already exists. Using existing ID.');
        userId = existingUser.id;
    } else {
        console.log('   Creating new user...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: 'Demo User' }
        });

        if (createError) {
            console.error('   ❌ Error creating user:', createError.message);
            return;
        }
        userId = newUser.user.id;
        console.log('   ✅ User created successfully.');
    }

    if (!userId) {
        console.error('   ❌ Add Failed: No User ID found.');
        return;
    }

    // 2. Create Venue
    console.log('\n🏟️ Creating Venue: Smash Arena Pro...');
    const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
            name: 'Smash Arena Pro',
            address: 'Jl. Demo Raya No. 88, Jakarta Selatan',
            phone: '081299998888',
            email: 'info@smasharenapro.com',
            operating_hours_start: 7,
            operating_hours_end: 23,
            is_active: true,
            booking_tolerance: 15,
            min_dp_percentage: 50,
            overtime_policy: 'charge',
            wa_notification_time: '08:00',
            // description: 'Venue profesional dengan standar internasional.',
            xendit_account_id: 'acct_demo_12345678' // Dummy ID for testing
        })
        .select()
        .single();

    if (venueError) {
        console.error('   ❌ Error creating venue:', venueError.message);
        return;
    }
    console.log(`   ✅ Venue created: ${venue.name} (${venue.id})`);

    // 3. Link User to Venue
    console.log('\n🔗 Linking User to Venue...');
    const { error: linkError } = await supabase
        .from('user_venues')
        .insert({
            user_id: userId,
            venue_id: venue.id,
            role: 'owner'
        });

    if (linkError) {
        // Check for duplicate key
        if (linkError.code === '23505') {
            console.log('   User already linked to a venue (duplicate key). Skipping.');
        } else {
            console.error('   ❌ Error linking user:', linkError.message);
        }
    } else {
        console.log('   ✅ User linked as Owner.');
    }

    // 4. Create Courts
    console.log('\n🏸 Creating Courts...');
    const courts = [
        { name: 'Court 1 (Carpet)', number: 1, rate: 80000 },
        { name: 'Court 2 (Carpet)', number: 2, rate: 80000 },
        { name: 'Court VIP (Wood)', number: 3, rate: 120000 }
    ];

    for (const c of courts) {
        const { error: courtError } = await supabase
            .from('courts')
            .insert({
                venue_id: venue.id,
                name: c.name,
                court_number: c.number,
                hourly_rate: c.rate,
                is_active: true
            });

        if (courtError) {
            console.error(`   ❌ Error creating ${c.name}:`, courtError.message);
        } else {
            console.log(`   ✅ Created ${c.name}`);
        }
    }

    console.log('\n✨ Demo Account Setup Complete! ✨');
    console.log('----------------------------------------');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Venue:    ${venue.name} (${venue.id})`);
    console.log('----------------------------------------');
}

createDemoAccount();
