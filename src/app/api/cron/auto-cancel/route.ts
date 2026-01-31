
import { NextResponse } from 'next/server';
import { runAutoCancelCheck } from '@/lib/utils/auto-cancel';
import { getVenueById } from '@/lib/api/venues';

// Secure this route to only allow internal calls or authenticated admin triggers
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { venueId } = body;

        if (!venueId) {
            return NextResponse.json({ error: 'Venue ID is required' }, { status: 400 });
        }

        // Fetch venue settings to get tolerance
        const venue = await getVenueById(venueId);

        if (!venue) {
            return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
        }

        const count = await runAutoCancelCheck(venueId, venue);

        return NextResponse.json({ success: true, cancelledCount: count });
    } catch (error: any) {
        console.error("Auto-Cancel Trigger Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
