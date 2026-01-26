import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { court_id, customer_name, phone, start_time, duration, price } = body;

        // Basic validation
        if (!court_id || !customer_name || !phone || !start_time || !duration || !price) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate availability (Simple check)
        // Check for intersection: (NewStart < ExistingEnd) AND (NewEnd > ExistingStart)
        // NewEnd = start_time + duration (hours)

        const startTime = new Date(start_time);
        const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

        // We need to check existing bookings
        // Note: RLS "Public can view active courts" doesn't cover bookings.
        // But "Public can view bookings" policy was added in secure_rls.sql (if it applied correctly).
        // If not, this select might return empty or error.
        // Safer to use SERVICE ROLE key here if we want to ensure we catch everything reliably, 
        // OR rely on the RLS we added.
        // Let's rely on Anon key + RLS first.

        const bookingDate = start_time.split('T')[0];

        // Fetch bookings for that court on that day
        const { data: existingBookings, error: fetchError } = await supabase
            .from('bookings')
            .select('start_time, duration')
            .eq('court_id', court_id)
            .eq('booking_date', bookingDate)
            .neq('status', 'cancelled');

        if (fetchError) {
            console.error('Error checking availability:', fetchError);
            return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
        }

        // Check conflicts
        const isConflict = existingBookings?.some(b => {
            const bStart = new Date(b.start_time);
            const bEnd = new Date(bStart.getTime() + b.duration * 60 * 60 * 1000);
            return (startTime < bEnd && endTime > bStart);
        });

        if (isConflict) {
            return NextResponse.json(
                { error: 'Court is already booked for this time slot' },
                { status: 409 }
            );
        }

        // Create bookings
        const { data, error } = await supabase
            .from('bookings')
            .insert({
                court_id,
                customer_name,
                phone,
                start_time,
                duration,
                price,
                booking_date: bookingDate,
                status: 'pending', // Public bookings might be pending until paid/confirmed? Guide didn't specify. Assuming pending or confirmed. Let's say pending.
                paid_amount: 0
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating booking:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, booking: data });

    } catch (err: any) {
        console.error('Internal error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
