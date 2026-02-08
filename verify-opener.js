const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Using the one from verify-implementation.js

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runVerification() {
    console.log('Starting Opener Name Verification...');

    // 1. Create a Shift with Opener Name
    console.log('\n[1/3] Creating Shift with Opener Name...');
    const testName = 'Budi Santoso';

    // Get venue first
    let venueId;
    const { data: venues, error: venueError } = await supabase.from('venues').select('id').limit(1);

    if (venueError) {
        console.error('Error fetching venues:', venueError);
        return;
    }

    if (!venues || venues.length === 0) {
        console.log('No venue found. Attempting to create one...');
        // Insert dummy venue, minimal fields
        const { data: newVenue, error: createVenueError } = await supabase
            .from('venues')
            .insert({ name: 'Test Verify Venue', slug: 'test-verify-venue-' + Date.now() })
            .select('id')
            .single();

        if (createVenueError) {
            console.error('Failed to create test venue:', createVenueError);
            // If we can't create venue, we can't test shift
            return;
        }
        console.log('Created test venue:', newVenue.id);
        venueId = newVenue.id;
    } else {
        venueId = venues[0].id;
        console.log('Found existing venue:', venueId);
    }


    // We assume the user is authenticated in the app, but here we are using service key so we can bypass RLS or simulate it.
    // The API uses RLS, so inserting directly with service key is fine for testing DB schema.
    const { data: shift, error: createError } = await supabase
        .from('shifts')
        .insert({
            venue_id: venueId,
            opener_name: testName,
            start_cash: 50000,
            status: 'open',
            start_time: new Date().toISOString()
        })
        .select()
        .single();

    if (createError) {
        console.error('Failed to create shift:', createError);
        process.exit(1);
    }
    console.log('Shift created:', shift.id);

    // 2. Verify Opener Name in DB
    console.log('\n[2/3] Verifying Opener Name in DB...');
    if (shift.opener_name === testName) {
        console.log('SUCCESS: Opener name matches.');
    } else {
        console.error(`FAILED: Opener name mismatch. Expected ${testName}, got ${shift.opener_name}`);
        process.exit(1);
    }

    // 3. Clean up
    console.log('\n[3/3] Cleaning up...');
    await supabase.from('shifts').delete().eq('id', shift.id);

    console.log('\nVERIFICATION COMPLETE: ALL CHECKS PASSED');
}

runVerification();
