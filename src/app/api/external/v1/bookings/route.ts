import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-auth';
import { createBooking } from '@/lib/api/bookings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    // 1. Verify API Key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
        return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });
    }

    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { venueId, courtId, bookingDate, startTime, duration, customerName, phone, price, status } = body;

        // Basic Validation
        if (!venueId || !courtId || !bookingDate || !startTime || !customerName || !phone) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // TODO: STRICT CONFLICT CHECK HERE
        // Reuse createBooking logic from internal API but we should wrap it with conflict check
        // For now, let's use the core function directly but catch errors

        // Check if court exists and is active? handled by createBooking?
        // createBooking converts courtId (if number) to UUID logic.

        const newBooking = await createBooking(venueId, {
            courtId,
            bookingDate,
            startTime,
            duration: Number(duration) || 1,
            customerName,
            phone,
            price: Number(price) || 0,
            status: status || 'pending', // Use provided status or default to pending
            paidAmount: 0,
        });

        return NextResponse.json({
            success: true,
            data: newBooking
        });

    } catch (err: any) {
        console.error('External Create Booking Error:', err);
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
    }
}
