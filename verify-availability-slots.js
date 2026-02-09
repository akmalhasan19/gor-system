/**
 * Verification Script: Test Availability API Slot Count
 * 
 * This script verifies that the availability API returns the correct number
 * of time slots matching the dashboard's operational hours.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

async function testAvailabilitySlots() {
    console.log('=== Testing Availability API Slot Count ===\n');

    // First, get a venue ID from the database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get first venue
    const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('id, name, operating_hours_start, operating_hours_end')
        .limit(1)
        .single();

    if (venueError || !venue) {
        console.error('❌ Failed to get venue:', venueError);
        return;
    }

    console.log(`📍 Testing with venue: ${venue.name}`);
    console.log(`   Operating hours: ${venue.operating_hours_start}:00 - ${venue.operating_hours_end}:00`);

    const expectedSlots = venue.operating_hours_end - venue.operating_hours_start + 1;
    console.log(`   Expected slots per court: ${expectedSlots}\n`);

    // Test the API endpoint
    const testDate = new Date().toISOString().split('T')[0]; // Today's date
    const apiUrl = `http://localhost:3000/api/v1/venues/${venue.id}/availability?date=${testDate}`;

    console.log(`🔍 Calling API: ${apiUrl}\n`);

    try {
        const response = await fetch(apiUrl);
        const json = await response.json();

        if (!response.ok) {
            console.error('❌ API returned error:', json);
            return;
        }

        const { data } = json;

        console.log(`📊 API Response:`);
        console.log(`   Operating hours: ${data.operating_hours.start} - ${data.operating_hours.end}`);
        console.log(`   Number of courts: ${data.courts.length}\n`);

        let allMatch = true;
        data.courts.forEach((court, index) => {
            const actualSlots = court.slots.length;
            const match = actualSlots === expectedSlots;

            console.log(`   Court ${index + 1} (${court.court_name}):`);
            console.log(`     - Slots returned: ${actualSlots}`);
            console.log(`     - First slot: ${court.slots[0]?.time}`);
            console.log(`     - Last slot: ${court.slots[court.slots.length - 1]?.time}`);
            console.log(`     - Status: ${match ? '✅ MATCH' : '❌ MISMATCH'}\n`);

            if (!match) allMatch = false;
        });

        console.log('\n' + '='.repeat(50));
        if (allMatch) {
            console.log('✅ SUCCESS: All courts return the correct number of slots!');
        } else {
            console.log('❌ FAILURE: Slot count mismatch detected!');
        }
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Error calling API:', error.message);
    }
}

// Run the test
testAvailabilitySlots().catch(console.error);
