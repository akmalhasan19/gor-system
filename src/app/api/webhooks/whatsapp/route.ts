
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { device, status, message } = body;

        console.log('WA Webhook Activity:', body);

        // Fonnte sends various webhooks.
        // If we get an incoming message or device status, it implies connection.
        // If 'status' is explicitly sent (e.g. valid device check), use it.

        // Find venue by fonnte_token (if we can map it) or we need to look up by device name.
        // However, Fonnte webhooks might not send the token. 
        // We might need to store the 'device' name in our DB to map it back.
        // For now, let's assume if we can find the device in our DB, we update it.

        /* 
           Scenario:
           1. Fonnte sends webhook. Body contains `device` (e.g. "628123456789").
           2. We search `venues` where `wa_device_id` matches this.
           3. We update `wa_status` to 'connected'.
        */

        if (device) {
            const { data: venue } = await supabaseAdmin
                .from('venues')
                .select('id, wa_status')
                .eq('wa_device_id', device) // We assume we store device ID (e.g. phone number or name)
                .single();

            if (venue) {
                // Determine status.
                // If this is a disconnect webhook (if exists), set disconnected.
                // If it's a message webhook, set connected.

                let newStatus = 'connected';
                if (status === 'disconnect' || message === 'disconnect') {
                    newStatus = 'disconnected';
                }

                if (venue.wa_status !== newStatus) {
                    await supabaseAdmin
                        .from('venues')
                        .update({ wa_status: newStatus })
                        .eq('id', venue.id);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
