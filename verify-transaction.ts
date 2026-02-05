
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTransaction() {
    const bookingId = '7cf6deec-f457-4de1-b773-0c3ac3d96436';
    console.log(`Checking for transaction related to Booking ID: ${bookingId}...`);

    // 1. Check Transaction Items first (direct link to booking)
    const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select('*, transaction:transactions(*)')
        .eq('reference_id', bookingId);

    if (itemsError) {
        console.error('Error fetching items:', itemsError);
    } else {
        console.log('Found Transaction Items:', JSON.stringify(items, null, 2));
    }

    // 2. Check Bookings table to see if it was updated
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status, paid_amount, venue_id')
        .eq('id', bookingId)
        .single();

    if (bookingError) {
        console.error('Error fetching booking:', bookingError);
    } else {
        console.log('Booking Status:', booking);
    }
}

checkTransaction();
