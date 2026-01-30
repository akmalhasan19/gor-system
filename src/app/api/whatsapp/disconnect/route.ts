import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { disconnectFonnteDevice } from '@/lib/api/whatsapp-device';
import { validateRequestBody, VenueIdSchema } from '@/lib/validation';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        // Validate input with Zod schema
        const validation = await validateRequestBody(request, VenueIdSchema);
        if (!validation.success) return validation.error;

        const { venueId } = validation.data;

        const { data: venue, error: venueError } = await supabaseAdmin
            .from('venues')
            .select('fonnte_token')
            .eq('id', venueId)
            .single();

        if (venueError || !venue) {
            return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
        }

        if (venue.fonnte_token) {
            await disconnectFonnteDevice(venue.fonnte_token);
        }

        // Clear DB fields
        await supabaseAdmin
            .from('venues')
            .update({
                fonnte_token: null,
                wa_device_id: null,
                wa_status: 'disconnected'
            })
            .eq('id', venueId);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Disconnect API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
