import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: venue } = await supabase
            .from('venues')
            .select('id, is_active')
            .eq('id', id)
            .eq('is_active', true)
            .maybeSingle();

        if (!venue) {
            return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
        }

        // Verify venue exists and get courts
        const { data: courts, error } = await supabase
            .from('courts')
            .select('id, name, court_number, is_active, hourly_rate, court_type, photo_url')
            .eq('venue_id', id)
            .order('court_number', { ascending: true });

        if (error) {
            console.error('Error fetching courts:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: courts });

    } catch (error: unknown) {
        console.error('Internal Server Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
