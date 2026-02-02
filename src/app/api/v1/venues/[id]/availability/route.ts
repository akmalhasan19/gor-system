import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function timeToDecimal(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + (minutes / 60);
}

function decimalToTime(decimal: number): string {
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ error: 'Date parameter is required (YYYY-MM-DD)' }, { status: 400 });
        }

        // 1. Get Venue Operating Hours
        const { data: venue, error: venueError } = await supabase
            .from('venues')
            .select('operating_hours_start, operating_hours_end')
            .eq('id', id)
            .single();

        if (venueError || !venue) {
            return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
        }

        // 2. Get All Active Courts
        const { data: courts, error: courtsError } = await supabase
            .from('courts')
            .select('id, name, hourly_rate')
            .eq('venue_id', id)
            .eq('is_active', true)
            .order('court_number');

        if (courtsError) {
            return NextResponse.json({ error: 'Error fetching courts' }, { status: 500 });
        }

        // 3. Get Bookings for Date
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, court_id, start_time, duration, status')
            .eq('venue_id', id)
            .eq('booking_date', date)
            .neq('status', 'cancelled');

        if (bookingsError) {
            return NextResponse.json({ error: 'Error fetching bookings' }, { status: 500 });
        }

        // 4. Build Availability Grid
        const availabilityData = courts.map(court => {
            const slots = [];

            // Loop through operating hours
            for (let hour = venue.operating_hours_start; hour < venue.operating_hours_end; hour++) {
                const timeString = decimalToTime(hour);
                const timeValue = hour;

                // Check if this slot is booked
                const booking = bookings?.find(b => {
                    if (b.court_id !== court.id) return false;
                    const start = timeToDecimal(b.start_time);
                    const end = start + b.duration;

                    // Slot is booked if it falls within [start, end)
                    // e.g. Booking 10:00 (1h) -> occupies 10:00. 11:00 is free (unless overlap logic changes).
                    // Simple logic: if timeValue >= start && timeValue < end
                    return timeValue >= start && timeValue < end;
                });

                slots.push({
                    time: timeString,
                    available: !booking,
                    price: court.hourly_rate,
                    booking_id: booking ? booking.id : null,
                    status: booking ? booking.status : 'available'
                });
            }

            return {
                court_id: court.id,
                court_name: court.name,
                slots
            };
        });

        return NextResponse.json({
            data: {
                venue_id: id,
                date,
                operating_hours: {
                    start: venue.operating_hours_start,
                    end: venue.operating_hours_end
                },
                courts: availabilityData
            }
        });

    } catch (error: any) {
        console.error('Internal Server Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
