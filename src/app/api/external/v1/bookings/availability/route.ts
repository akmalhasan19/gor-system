import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-auth';
import { getVenues, getVenueById } from '@/lib/api/venues';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Verify API Key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });
    }

    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const venueId = searchParams.get('venueId');

    if (!date || !venueId) {
        return NextResponse.json({ error: 'Missing date or venueId' }, { status: 400 });
    }

    try {
        // Fetch bookings for the date
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('court_id, start_time, duration')
            .eq('venue_id', venueId)
            .eq('booking_date', date)
            .neq('status', 'cancelled');

        if (error) throw error;

        // Fetch courts
        const { data: courts, error: courtError } = await supabase
            .from('courts')
            .select('id, name, court_number')
            .eq('venue_id', venueId)
            .eq('is_active', true);

        if (courtError) throw courtError;

        // Construct Availability
        // Simple logic: If time + duration overlaps, it's taken.
        // We return raw bookings, let the client calculate slots? 
        // Or we return a simplified "slots" array?
        // For an "Availability" API, returning occupied slots is usually better/lighter.

        const occupied = bookings.map(b => ({
            courtId: b.court_id,
            startTime: b.start_time,
            duration: b.duration
        }));

        return NextResponse.json({
            data: {
                date,
                venueId,
                courts,
                occupied
            },
            meta: {
                count: occupied.length
            }
        });

    } catch (err: any) {
        console.error('External API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
