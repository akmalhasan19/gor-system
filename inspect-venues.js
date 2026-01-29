const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTable() {
    console.log('Inspecting Venues Table...');

    // Select all columns to see what we get
    const { data, error } = await supabase
        .from('venues')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting *:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Available Columns:', Object.keys(data[0]));
        } else {
            console.log('Table is empty, cannot infer columns from data.');
            // Try to insert a dummy with minimal fields to see what fails?
            // Or just trust the error message.
        }
    }

    // Try to select specifically booking_tolerance
    const { error: btError } = await supabase.from('venues').select('booking_tolerance').limit(1);
    if (btError) console.log('❌ booking_tolerance check failed:', btError.message);
    else console.log('✅ booking_tolerance exists.');
}

inspectTable();
