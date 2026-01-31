import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createFonnteDevice, getFonnteQR } from '@/lib/api/whatsapp-device';
import { validateRequestBody, VenueIdSchema } from '@/lib/validation';

// Init Service Role Client for Admin operations
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

        // Get Venue Info
        const { data: venue, error: venueError } = await supabaseAdmin
            .from('venues')
            .select('name, wa_device_id, fonnte_token, wa_status')
            .eq('id', venueId)
            .single();

        if (venueError || !venue) {
            return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
        }

        let deviceToken = venue.fonnte_token;
        let deviceId = venue.wa_device_id;

        // If no token, create device
        if (!deviceToken) {
            const masterToken = process.env.FONNTE_MASTER_TOKEN;
            if (!masterToken) {
                return NextResponse.json({ error: 'System configuration error (Master Token)' }, { status: 500 });
            }

            // Create unique device name: Short & Safe to avoid "input invalid"
            // Format: v[ShortID]-[Random] e.g. v28a1c-x9z2
            const randomSuffix = Math.random().toString(36).substring(2, 6);
            const apiDeviceName = `v${venueId.substring(0, 6)}-${randomSuffix}`;
            console.log('Fonnte Connect: Creating device with name:', apiDeviceName);

            const newDevice = await createFonnteDevice(apiDeviceName, masterToken);

            if ('error' in newDevice) {
                console.error('Fonnte Device Creation Failed:', newDevice.error);
                return NextResponse.json({ error: `Failed to create WhatsApp device: ${newDevice.error}` }, { status: 502 });
            }

            deviceToken = newDevice.token;
            deviceId = newDevice.deviceId;

            // Save to DB
            await supabaseAdmin
                .from('venues')
                .update({
                    fonnte_token: deviceToken,
                    wa_device_id: deviceId,
                    wa_status: 'disconnected'
                })
                .eq('id', venueId);
        }

        // Get QR Code
        const qrCode = await getFonnteQR(deviceToken);

        if (!qrCode) {
            return NextResponse.json({ error: 'Failed to retrieve QR Code' }, { status: 502 });
        }

        return NextResponse.json({
            success: true,
            qrCode: qrCode,
            status: venue.wa_status || 'disconnected'
        });

    } catch (error: any) {
        console.error('Connect API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
