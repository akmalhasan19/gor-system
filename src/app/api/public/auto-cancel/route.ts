import { NextResponse } from 'next/server';
import { runAutoCancelCheck } from '@/lib/utils/auto-cancel';
import { getVenueById } from '@/lib/api/venues';

// Force dynamic to prevent static optimization
export const dynamic = 'force-dynamic';

/**
 * Public endpoint for auto-cancel check
 * Called by the AutoCancelTrigger component every 5 minutes
 */
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
        console.error("Auto-Cancel Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Also support GET for easy testing
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Auto-cancel endpoint is working. Use POST with venueId to run check.'
    });
}
