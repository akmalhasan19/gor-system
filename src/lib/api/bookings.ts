import { supabase } from '../supabase';
import { Booking } from '../constants';

const VENUE_ID = '00000000-0000-0000-0000-000000000001'; // Default venue ID

export async function getBookings(date?: string): Promise<Booking[]> {
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', VENUE_ID)
        .eq('booking_date', date || new Date().toISOString().split('T')[0])
        .order('start_time', { ascending: true });

    if (error) throw error;

    // Transform database format to app format
    return (data || []).map(row => ({
        id: row.id,
        courtId: String(row.court_id || '1'),
        startTime: row.start_time,
        duration: row.duration,
        customerName: row.customer_name,
        phone: row.phone,
        price: row.price,
        paidAmount: row.paid_amount,
        status: row.status as any,
        bookingDate: row.booking_date,
    }));
}

export async function getBookingsRange(startDate: string, endDate: string): Promise<Booking[]> {
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', VENUE_ID)
        .gte('booking_date', startDate)
        .lte('booking_date', endDate)
        .order('booking_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => ({
        id: row.id,
        courtId: String(row.court_id || '1'),
        startTime: row.start_time,
        duration: row.duration,
        customerName: row.customer_name,
        phone: row.phone,
        price: row.price,
        paidAmount: row.paid_amount,
        status: row.status as any,
        bookingDate: row.booking_date,
    }));
}

export async function createBooking(booking: Omit<Booking, 'id' | 'bookingDate'>): Promise<Booking> {
    const { data, error } = await supabase
        .from('bookings')
        .insert({
            venue_id: VENUE_ID,
            court_id: booking.courtId,
            customer_name: booking.customerName,
            phone: booking.phone,
            start_time: booking.startTime,
            duration: booking.duration,
            price: booking.price,
            paid_amount: booking.paidAmount || 0,
            status: booking.status,
            booking_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: data.id,
        courtId: String(data.court_id),
        startTime: data.start_time,
        duration: data.duration,
        customerName: data.customer_name,
        phone: data.phone,
        price: data.price,
        paidAmount: data.paid_amount,
        status: data.status,
        bookingDate: data.booking_date,
    };
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<void> {
    const { error } = await supabase
        .from('bookings')
        .update({
            status: updates.status,
            paid_amount: updates.paidAmount,
        })
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
