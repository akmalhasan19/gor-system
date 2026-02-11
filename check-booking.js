const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://haknornfainyyfrnzyxp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhha25vcm5mYWlueXlmcm56eXhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMzNjQyMSwiZXhwIjoyMDg0OTEyNDIxfQ.Bm0fzStHcj8REn6PLm6kopT1LKlRU7woS8xF8gCZAas';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const bookingId = '46617814-309b-479f-8205-0cbe3b02a2ca';

async function checkBooking() {
    console.log('Fetching booking:', bookingId);

    const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

    if (error) {
        console.error('Error fetching booking:', error);
        return;
    }

    console.log('Booking Details:', booking);
}

checkBooking();
