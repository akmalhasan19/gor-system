
import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-auth';
import { updateBooking } from '@/lib/api/bookings';

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // 1. Verify API Key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });
    }

    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 });
    }

    // 2. Parse Body
    try {
        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        const validStatuses = ['LUNAS', 'DP', 'BELUM_BAYAR', 'pending', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
        }

        // 3. Update Booking
        await updateBooking("ANY_VENUE", id, { status: status });
        // Note: updateBooking function in lib/api/bookings.ts takes venueId but actually only uses it for checking court existence if courtId changes. 
        // For status update, venueId param usage needs to be checked.
        // Checking src/lib/api/bookings.ts:
        // export async function updateBooking(venueId: string, id: string, updates: Partial<Booking>): Promise<void> {
        // ... if (updates.courtId !== undefined) { logic needing venueId } ...
        // Logic for status update doesn't seem to use venueId. 
        // However, it's safer to pass a dummy or try to get it if needed. 
        // But since we don't have venueId in the URL, and looking at the implementation, 
        // the status update part logic: `if (updates.status !== undefined) dbUpdates.status = updates.status;` 
        // and then `supabase.from('bookings').update(dbUpdates).eq('id', id);` 
        // It DOES NOT use venueId for filtering or anything else for status updates. 
        // So passing "EXTERNAL_API" or similar string should be safe as long as we aren't updating courtId.

        return NextResponse.json({
            success: true,
            message: `Booking ${id} status updated to ${status}`
        });

    } catch (err: any) {
        console.error('External Update Booking Error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
