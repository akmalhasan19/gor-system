const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndSeed() {
    console.log('Checking Venues Table Schema...');

    // 1. Check if we can select recently added columns to verify schema migration
    // If this fails, it means migrations haven't run
    const { data: venues, error: schemaError } = await supabase
        .from('venues')
        .select('id, name, wa_device_id, wa_status, winback_configuration')
        .limit(1);

    if (schemaError) {
        console.error('❌ Schema Error: It seems some columns are missing:', schemaError.message);
        console.log('Suggestion: Run "npx supabase migration up"');
    } else {
        console.log('✅ Schema looks up to date (checked wa_device_id).');
    }

    // 2. Create Venue and User Link
    const userId = '083ed6a1-e4d1-4f59-8090-a60438825603'; // ID from previous seed
    const venueId = 'e4256eb0-1234-4567-890a-1234567890ab';

    console.log(`\nSeeding Venue for User ${userId}...`);

    // Check if venue exists
    const { data: existingVenue } = await supabase.from('venues').select('id').eq('id', venueId).single();

    if (!existingVenue) {
        console.log('Creating Venue...');
        const { error: insertVenueError } = await supabase.from('venues').insert({
            id: venueId,
            name: 'GOR Smash Demo',
            operating_hours_start: 8,
            operating_hours_end: 22,
            is_active: true,
            // Add default values for potentially new columns to match constraint if any
            booking_tolerance: 15,
            wa_notification_time: '09:00'
        });
        if (insertVenueError) console.error('Error creating venue:', insertVenueError);
        else console.log('Venue created.');
    } else {
        console.log('Venue already exists.');
    }

    // Check User Link
    const { data: existingLink } = await supabase.from('user_venues').select('*').eq('user_id', userId).eq('venue_id', venueId).single();

    if (!existingLink) {
        console.log('Linking User to Venue...');
        const { error: linkError } = await supabase.from('user_venues').insert({
            user_id: userId,
            venue_id: venueId,
            role: 'owner'
        });
        if (linkError) console.error('Error linking user:', linkError);
        else console.log('User linked to venue.');
    } else {
        console.log('User already linked to venue.');
    }
}

checkAndSeed();
