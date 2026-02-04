import { supabase } from '../supabase';
import { Booking } from '../constants';

export async function getBookings(venueId: string, date?: string): Promise<Booking[]> {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            courts!inner (
                court_number
            )
        `)
        .eq('venue_id', venueId)
        // Use local date (YYYY-MM-DD) instead of UTC to avoid "yesterday" issues
        .eq('booking_date', date || new Date().toLocaleDateString('en-CA'))
        .order('start_time', { ascending: true });

    if (error) throw error;

    // Transform database format to app format
    return (data || []).map(row => ({
        id: row.id,
        courtId: row.court_id, // Use court UUID for consistent comparison with Scheduler
        startTime: row.start_time,
        duration: Number(row.duration) || 1,
        customerName: row.customer_name,
        phone: row.phone,
        price: Number(row.price) || 0,           // Supabase DECIMAL returns string
        paidAmount: Number(row.paid_amount) || 0, // Supabase DECIMAL returns string
        status: row.status as any,
        bookingDate: row.booking_date,
        createdAt: row.created_at,
        checkInTime: row.check_in_time,
        isNoShow: row.is_no_show,
        inCartSince: row.in_cart_since,
    }));
}

export async function getBookingsRange(venueId: string, startDate: string, endDate: string): Promise<Booking[]> {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            courts!inner (
                court_number
            )
        `)
        .eq('venue_id', venueId)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .order('booking_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        courtId: row.court_id, // Use court UUID for consistent comparison with Scheduler
        startTime: row.start_time,
        duration: Number(row.duration) || 1,
        customerName: row.customer_name,
        phone: row.phone,
        price: Number(row.price) || 0,           // Supabase DECIMAL returns string
        paidAmount: Number(row.paid_amount) || 0, // Supabase DECIMAL returns string
        status: row.status as any,
        bookingDate: row.booking_date,
        createdAt: row.created_at,
        checkInTime: row.check_in_time,
        isNoShow: row.is_no_show,
        inCartSince: row.in_cart_since,
    }));
}

export async function createBooking(venueId: string, booking: Omit<Booking, 'id'>): Promise<Booking> {
    // First, convert courtId (could be a number like "1") to actual court UUID
    let courtUuid = booking.courtId;

    // If courtId looks like a number, query the courts table to get the UUID
    if (!booking.courtId.includes('-')) {
        // It's likely a court number, not a UUID
        const courtNumber = parseInt(booking.courtId, 10);

        const { data: court, error: courtError } = await supabase
            .from('courts')
            .select('id')
            .eq('venue_id', venueId)
            .eq('court_number', courtNumber)
            .single();

        if (courtError || !court) {
            throw new Error(`Court with number ${courtNumber} not found`);
        }

        courtUuid = court.id;
    }

    const payload = {
        venue_id: venueId,
        court_id: courtUuid,
        customer_name: booking.customerName,
        phone: booking.phone,
        start_time: booking.startTime,
        duration: booking.duration,
        price: booking.price,
        paid_amount: booking.paidAmount || 0,
        status: booking.status,
        // Use passed bookingDate
        booking_date: booking.bookingDate,
    };

    console.log('Sending Booking Payload:', payload);

    const { data, error } = await supabase
        .from('bookings')
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error('Supabase Create Booking Error:', error);
        throw error;
    }

    return {
        id: data.id,
        courtId: String(data.court_id),
        startTime: data.start_time,
        duration: Number(data.duration) || 1,
        customerName: data.customer_name,
        phone: data.phone,
        price: Number(data.price) || 0,           // Supabase DECIMAL returns string
        paidAmount: Number(data.paid_amount) || 0, // Supabase DECIMAL returns string
        status: data.status,
        bookingDate: data.booking_date,
    };
}

export async function updateBooking(venueId: string, id: string, updates: Partial<Booking>): Promise<void> {
    const dbUpdates: any = {};

    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.bookingDate !== undefined) dbUpdates.booking_date = updates.bookingDate;
    if (updates.checkInTime !== undefined) dbUpdates.check_in_time = updates.checkInTime;
    if (updates.isNoShow !== undefined) dbUpdates.is_no_show = updates.isNoShow;
    if (updates.inCartSince !== undefined) dbUpdates.in_cart_since = updates.inCartSince;

    // Handle courtId update (convert number string to UUID)
    if (updates.courtId !== undefined) {
        let courtUuid = updates.courtId;

        // If courtId looks like a number, query the courts table to get the UUID
        if (!updates.courtId.includes('-')) {
            const courtNumber = parseInt(updates.courtId, 10);

            const { data: court, error: courtError } = await supabase
                .from('courts')
                .select('id')
                .eq('venue_id', venueId)
                .eq('court_number', courtNumber)
                .single();

            if (courtError || !court) {
                throw new Error(`Court with number ${courtNumber} not found`);
            }
            courtUuid = court.id;
        }
        dbUpdates.court_id = courtUuid;
    }

    const { error } = await supabase
        .from('bookings')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw error;
}

export async function deleteBooking(id: string): Promise<void> {
    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function checkInBooking(id: string): Promise<void> {
    const { error } = await supabase
        .from('bookings')
        .update({ check_in_time: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
}
