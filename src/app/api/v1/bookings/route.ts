import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createBookingSchema } from '@/lib/validators/booking';
import { z } from 'zod';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to convert "HH:MM" to decimal hours (e.g., "10:30" -> 10.5)
function timeToDecimal(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const venueId = searchParams.get('venue_id');
        const bookingDate = searchParams.get('date');
        const status = searchParams.get('status');
        const sort = searchParams.get('sort');

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('bookings')
            .select('*, venues(name), courts(name, court_number)', { count: 'exact' });

        if (venueId) query = query.eq('venue_id', venueId);
        if (bookingDate) query = query.eq('booking_date', bookingDate);
        if (status) query = query.eq('status', status);

        if (sort) {
            const isDesc = sort.startsWith('-');
            const column = isDesc ? sort.substring(1) : sort;
            query = query.order(column, { ascending: !isDesc });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching bookings:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            data,
            meta: {
                total: count,
                page,
                limit,
                last_page: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Validation
        const payload = createBookingSchema.parse(body);

        // 2. Double Booking Check
        // Fetch existing bookings for the same court and date
        const { data: existingBookings, error: fetchError } = await supabase
            .from('bookings')
            .select('start_time, duration')
            .eq('venue_id', payload.venue_id)
            .eq('court_id', payload.court_id)
            .eq('booking_date', payload.booking_date)
            .neq('status', 'cancelled');

        if (fetchError) {
            throw new Error(fetchError.message);
        }

        const newStart = timeToDecimal(payload.start_time);
        const newEnd = newStart + payload.duration;

        const hasOverlap = existingBookings?.some(b => {
            const existingStart = timeToDecimal(b.start_time);
            const existingEnd = existingStart + b.duration;
            // Overlap if (StartA < EndB) and (EndA > StartB)
            return (newStart < existingEnd) && (newEnd > existingStart);
        });

        if (hasOverlap) {
            return NextResponse.json(
                { error: 'Conflict: The selected time slot is already booked.' },
                { status: 409 }
            );
        }

        // 2.5. Calculate Price
        // Fetch court hourly rate
        const { data: court, error: courtError } = await supabase
            .from('courts')
            .select('hourly_rate')
            .eq('id', payload.court_id)
            .single();

        if (courtError || !court) {
            return NextResponse.json({ error: 'Court not found or invalid' }, { status: 404 });
        }

        const totalPrice = court.hourly_rate * payload.duration;

        // 3. Create Booking
        const { data, error } = await supabase
            .from('bookings')
            .insert({
                venue_id: payload.venue_id,
                court_id: payload.court_id,
                booking_date: payload.booking_date,
                start_time: payload.start_time,
                duration: payload.duration,
                customer_name: payload.customer_name,
                phone: payload.phone,
                status: 'pending', // Default status
                price: totalPrice,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error("Booking Create Error", error);
            // Handle exclusion constraint violation (double-booking attempt)
            if (error.code === '23P01') {
                return NextResponse.json(
                    { error: 'Conflict: The selected time slot is already booked by another user.' },
                    { status: 409 }
                );
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Booking created successfully',
            data
        }, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation Error', details: error.issues }, { status: 400 });
        }
        console.error('Internal Server Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
