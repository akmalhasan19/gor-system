import { supabase } from '../supabase';
import { Shift } from '../types/financial';

export async function getOpenShift(venueId: string): Promise<Shift | null> {
    const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('venue_id', venueId)
        .eq('status', 'open')
        .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
}

export async function startShift(venueId: string, startCash: number, openerName?: string): Promise<Shift> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('shifts')
        .insert([
            {
                venue_id: venueId,
                opener_id: user.id,
                opener_name: openerName,
                start_cash: startCash,
                status: 'open',
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function endShift(shiftId: string, endCash: number, expectedCash: number, notes?: string): Promise<Shift> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
        .from('shifts')
        .update({
            closer_id: user.id,
            end_cash: endCash,
            expected_cash: expectedCash,
            end_time: new Date().toISOString(),
            status: 'closed',
            notes: notes,
        })
        .eq('id', shiftId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getShiftHistory(venueId: string, date?: string, limit = 10): Promise<Shift[]> {
    let query = supabase
        .from('shifts')
        .select('*')
        .eq('venue_id', venueId)
        .eq('status', 'closed');

    if (date) {
        // Filter by end_time matching the date (in venue's timezone approx, or UTC day?)
        // Shifts are stored in UTC (TIMESTAMPTZ).
        // If we want "Shifts closed on Date X", we should probably look at end_time.
        // Assuming 'date' is YYYY-MM-DD.
        // Simple approach: end_time >= date 00:00 and end_time < date 23:59:59 (in UTC or local?)
        // The date string usually comes from the UI (e.g. "2024-01-27").
        // Supabase DB is UTC.
        // If I use .gte('end_time', `${date}T00:00:00`) ... it assumes local time if no offset provided?
        // Let's assume standard ISO string comparison for now.
        query = query
            .gte('end_time', `${date}T00:00:00`)
            .lte('end_time', `${date}T23:59:59`);
    }

    const { data, error } = await query
        .order('end_time', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

export async function getShiftHistoryRange(
    venueId: string,
    startDate: string,
    endDate: string
): Promise<Shift[]> {
    const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('venue_id', venueId)
        .eq('status', 'closed')
        .gte('end_time', `${startDate}T00:00:00`)
        .lte('end_time', `${endDate}T23:59:59`)
        .order('end_time', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getShiftExpectations(venueId: string, startTime: string): Promise<{
    expectedCash: number;
    totalCash: number;
    totalTransfer: number;
    bookingRevenue: number;
    productRevenue: number;
}> {
    const { data, error } = await supabase.rpc('get_shift_totals', {
        p_venue_id: venueId,
        p_start_time: startTime,
        p_end_time: new Date().toISOString()
    });

    if (error) throw error;

    // Single object returned by RPC or array? 
    // RPC returning TABLE returns an array of objects.
    const result = data && data.length > 0 ? data[0] : {
        total_cash: 0,
        total_transfer: 0,
        total_bookings_revenue: 0,
        total_products_revenue: 0
    };

    return {
        expectedCash: 0, // Will be calculated by caller (Start Cash + Total Cash)
        totalCash: result.total_cash || 0,
        totalTransfer: result.total_transfer || 0,
        bookingRevenue: result.total_bookings_revenue || 0,
        productRevenue: result.total_products_revenue || 0
    };
}

