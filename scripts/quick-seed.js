const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('🌱 Seeding Test Data...');

    // 1. Create Venue
    const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
            name: 'Smash Test Arena',
            address: '123 Test Street',
            phone: '081234567890',
            operating_hours_start: 8,
            operating_hours_end: 22,
            is_active: true
        })
        .select()
        .single();

    if (venueError) {
        console.error('Error creating venue:', venueError.message);
        return;
    }
    console.log(`✅ Venue created: ${venue.name} (${venue.id})`);

    // 2. Create Court
    const { data: court, error: courtError } = await supabase
        .from('courts')
        .insert({
            venue_id: venue.id,
            name: 'Court 1 - Synthetic',
            court_number: 1,
            hourly_rate: 50000,
            is_active: true
        })
        .select()
        .single();

    if (courtError) {
        console.error('Error creating court:', courtError.message);
        return;
    }
    console.log(`✅ Court created: ${court.name} (${court.id})`);
    console.log('\n🎉 Seeding complete! You can now run the Playwright test.');
}

seed();
