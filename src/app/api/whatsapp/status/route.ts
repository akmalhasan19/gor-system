import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFonnteDeviceStatus } from '@/lib/api/whatsapp-device';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { venueId } = await request.json();

        if (!venueId) {
            return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
        }

        const { data: venue, error: venueError } = await supabaseAdmin
            .from('venues')
            .select('fonnte_token, wa_status')
            .eq('id', venueId)
            .single();

        if (venueError || !venue) {
            return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
        }

        if (!venue.fonnte_token) {
            return NextResponse.json({ status: 'disconnected', message: 'No device token found' });
        }

        // Check Status at Fonnte
        const status = await getFonnteDeviceStatus(venue.fonnte_token);

        // Update DB if changed
        if (status !== venue.wa_status) {
            await supabaseAdmin
                .from('venues')
                .update({ wa_status: status })
                .eq('id', venueId);
        }

        return NextResponse.json({ status });

    } catch (error: any) {
        console.error('Status API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
