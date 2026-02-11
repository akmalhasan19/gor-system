const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://haknornfainyyfrnzyxp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhha25vcm5mYWlueXlmcm56eXhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTMzNjQyMSwiZXhwIjoyMDg0OTEyNDIxfQ.Bm0fzStHcj8REn6PLm6kopT1LKlRU7woS8xF8gCZAas';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listVenues() {
    console.log('Connecting to Supabase...');
    const { data: venues, error } = await supabase
        .from('venues')
        .select('*');

    if (error) {
        console.error('Error listing venues:', error);
        return;
    }

    console.log('Total Venues:', venues.length);
    venues.forEach(v => {
        console.log(`- Name: ${v.name} | ID: ${v.id}`);
    });
}

listVenues();
