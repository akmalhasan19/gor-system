const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function reseed() {
    console.log('🔄 Checking Venues Schema...');
    // Verify one of the missing columns
    const { error: schemaError } = await supabase.from('venues').select('booking_tolerance').limit(1);
    if (schemaError) {
        console.error('❌ Schema still invalid:', schemaError.message);
        return;
    }
    console.log('✅ Schema ok.');

    const userId = '083ed6a1-e4d1-4f59-8090-a60438825603';
    const venueId = 'e4256eb0-1234-4567-890a-1234567890ab';

    console.log(`\n🌱 Seeding Venue for User ${userId}...`);

    // 1. Upsert Venue
    const { error: upsertError } = await supabase.from('venues').upsert({
        id: venueId,
        name: 'GOR Smash Demo',
        address: 'Jl. Demo No. 1',
        phone: '08123456789',
        email: 'gor@example.com',
        operating_hours_start: 8,
        operating_hours_end: 22,
        is_active: true,
        booking_tolerance: 15,
        wa_notification_time: '09:00',
        overtime_policy: 'charge'
    }).select();

    if (upsertError) {
        console.error('❌ Upsert Venue Failed:', upsertError);
    } else {
        console.log('✅ Venue upserted.');
    }

    // 2. Upsert Link
    const { error: linkError } = await supabase.from('user_venues').upsert({
        user_id: userId,
        venue_id: venueId,
        role: 'owner'
    }).select();

    if (linkError) {
        console.error('❌ Link User Failed:', linkError);
    } else {
        console.log('✅ User linked to venue.');
    }
}

reseed();
