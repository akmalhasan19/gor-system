import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createFonnteDevice, getFonnteQR } from '@/lib/api/whatsapp-device';

// Init Service Role Client for Admin operations
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

            // Create unique device name: GOR Name + partial ID
            const apiDeviceName = `${venue.name.substring(0, 10)}-${venueId.substring(0, 4)}`;

            const newDevice = await createFonnteDevice(apiDeviceName, masterToken);

            if (!newDevice) {
                return NextResponse.json({ error: 'Failed to create WhatsApp device instance' }, { status: 502 });
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
