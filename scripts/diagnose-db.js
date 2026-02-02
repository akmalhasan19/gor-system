require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
    console.log('------------------------------------------------');
    console.log('🕵️  DIAGNOSING DATABASE STATE');
    console.log('------------------------------------------------');
    console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

    // 1. Check Venues Table
    console.log('\nChecking "venues" table...');
    const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('*')
        .limit(1);

    if (venuesError) {
        console.error('❌ Error accessing "venues":');
        console.error(JSON.stringify(venuesError, null, 2));
    } else {
        console.log('✅ "venues" table found.');
        console.log(`   Sample row count: ${venues.length}`);
    }

    // 2. Check Bookings Table
    console.log('\nChecking "bookings" table...');
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .limit(1);

    if (bookingsError) {
        console.error('❌ Error accessing "bookings":');
        console.error(JSON.stringify(bookingsError, null, 2));
    } else {
        console.log('✅ "bookings" table found.');
    }
}

diagnose();
