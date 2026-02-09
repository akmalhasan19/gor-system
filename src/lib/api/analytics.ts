import { supabase } from '../supabase';
import { format, subDays, parseISO } from 'date-fns';

export interface RevenueDataPoint {
    date: string;
    revenue: number;
    cash: number;
    transfer: number;
    transactionCount: number;
}

export interface OccupancyDataPoint {
    dayOfWeek: number; // 0 = Sunday, 1 = Monday...
    hour: number; // 6-22
    occupancyRate: number; // 0-100
    bookingCount: number;
}

export interface CourtRevenueData {
    courtId: string;
    courtName: string;
    revenue: number;
    bookingCount: number;
}

export interface MemberVsWalkInData {
    member: { count: number; revenue: number };
    walkIn: { count: number; revenue: number };
}

export interface TopCustomer {
    customerId: string;
    customerName: string;
    phone: string;
    isMember: boolean;
    totalSpending: number;
    bookingCount: number;
}

export interface PeakHoursData {
    peakHours: { hour: number; avgBookings: number }[];
    offPeakHours: { hour: number; avgBookings: number }[];
}

/**
 * Get revenue data for a date range
 */
export async function getRevenueData(
    venueId: string,
    days: number = 7
): Promise<RevenueDataPoint[]> {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('venue_id', venueId)
        .gte('created_at', format(startDate, 'yyyy-MM-dd') + 'T00:00:00')
        .lte('created_at', format(endDate, 'yyyy-MM-dd') + 'T23:59:59')
        .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const grouped: Record<string, RevenueDataPoint> = {};

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
        const date = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd');
        grouped[date] = {
            date,
            revenue: 0,
            cash: 0,
            transfer: 0,
            transactionCount: 0,
        };
    }

    // Aggregate transaction data
    (data || []).forEach((t) => {
        const date = t.created_at.split('T')[0];
        if (grouped[date]) {
            grouped[date].revenue += Number(t.paid_amount) || 0;
            grouped[date].transactionCount += 1;
            if (t.payment_method === 'cash' || t.payment_method === 'CASH') {
                grouped[date].cash += Number(t.paid_amount) || 0;
            } else {
                grouped[date].transfer += Number(t.paid_amount) || 0;
            }
        }
    });

    return Object.values(grouped);
}

/**
 * Get occupancy data (heatmap) for a date range
 */
export async function getOccupancyData(
    venueId: string,
    days: number = 30
): Promise<OccupancyDataPoint[]> {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    // Get all bookings in range
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', venueId)
        .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
        .lte('booking_date', format(endDate, 'yyyy-MM-dd'));

    if (bookingsError) throw bookingsError;

    // Get court count
    const { data: courts, error: courtsError } = await supabase
        .from('courts')
        .select('id')
        .eq('venue_id', venueId)
        .eq('is_active', true);

    if (courtsError) throw courtsError;

    const courtCount = courts?.length || 1;

    // Calculate occupancy per day-hour combination
    // Track by (dayOfWeek, hour) -> total bookings
    const occupancyMap: Record<string, { total: number; days: Set<string> }> = {};

    // Initialize all slots (7 days x operating hours 6-22)
    for (let dow = 0; dow < 7; dow++) {
        for (let hour = 6; hour <= 22; hour++) {
            const key = `${dow}-${hour}`;
            occupancyMap[key] = { total: 0, days: new Set() };
        }
    }

    // Count bookings per slot
    (bookings || []).forEach((b) => {
        const bookingDate = parseISO(b.booking_date);
        const dow = bookingDate.getDay();
        const hour = parseInt(b.start_time.split(':')[0], 10);
        const duration = Number(b.duration) || 1;

        for (let h = 0; h < duration; h++) {
            const actualHour = hour + h;
            if (actualHour >= 6 && actualHour <= 22) {
                const key = `${dow}-${actualHour}`;
                occupancyMap[key].total += 1;
                occupancyMap[key].days.add(b.booking_date);
            }
        }
    });

    // Calculate weeks in the date range for averaging
    const weeksInRange = Math.max(1, Math.ceil(days / 7));

    // Convert to array with occupancy percentage
    const result: OccupancyDataPoint[] = [];
    for (let dow = 0; dow < 7; dow++) {
        for (let hour = 6; hour <= 22; hour++) {
            const key = `${dow}-${hour}`;
            const data = occupancyMap[key];
            // Occupancy = bookings / (courts * weeks) * 100
            const maxPossible = courtCount * weeksInRange;
            const occupancyRate = maxPossible > 0
                ? Math.min(100, Math.round((data.total / maxPossible) * 100))
                : 0;

            result.push({
                dayOfWeek: dow,
                hour,
                occupancyRate,
                bookingCount: data.total,
            });
        }
    }

    return result;
}

/**
 * Get revenue breakdown by court
 */
export async function getRevenueByCourtData(
    venueId: string,
    days: number = 30
): Promise<CourtRevenueData[]> {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    // Get courts
    const { data: courts, error: courtsError } = await supabase
        .from('courts')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('court_number', { ascending: true });

    if (courtsError) throw courtsError;

    // Get bookings to map court_id
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, court_id, booking_date')
        .eq('venue_id', venueId)
        .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
        .lte('booking_date', format(endDate, 'yyyy-MM-dd'));

    if (bookingsError) throw bookingsError;

    // Get transactions with transaction items
    const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
            *,
            transaction_items (*)
        `)
        .eq('venue_id', venueId)
        .gte('created_at', format(startDate, 'yyyy-MM-dd') + 'T00:00:00')
        .lte('created_at', format(endDate, 'yyyy-MM-dd') + 'T23:59:59');

    if (txError) throw txError;

    // Create booking ID to court ID map
    const bookingToCourtMap: Record<string, string> = {};
    (bookings || []).forEach((b) => {
        bookingToCourtMap[b.id] = b.court_id;
    });

    // Aggregate by court
    const courtRevenue: Record<string, { revenue: number; count: number }> = {};
    courts?.forEach((c) => {
        courtRevenue[c.id] = { revenue: 0, count: 0 };
    });

    // Process transactions with proportional allocation
    (transactions || []).forEach((tx: any) => {
        // Map transaction_items to items array
        const items = (tx.transaction_items || []).map((item: any) => ({
            type: item.type,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 0,
            referenceId: item.reference_id,
        }));

        const paidAmount = Number(tx.paid_amount) || 0;

        // Calculate total price of all items in transaction
        const txTotalPrice = items.reduce((sum: number, item: any) => {
            return sum + ((item.price || 0) * (item.quantity || 1));
        }, 0);

        // Allocate revenue proportionally to each court
        items.forEach((item: any) => {
            if (item.type === 'BOOKING' && item.referenceId) {
                const courtId = bookingToCourtMap[item.referenceId];
                if (courtId && courtRevenue[courtId]) {
                    // Calculate item's total price
                    const itemPrice = (item.price || 0) * (item.quantity || 1);

                    // Allocate proportionally based on item price
                    const allocatedRevenue = txTotalPrice > 0
                        ? (itemPrice / txTotalPrice) * paidAmount
                        : 0;

                    courtRevenue[courtId].revenue += allocatedRevenue;
                    courtRevenue[courtId].count += 1;
                }
            }
        });
    });

    return (courts || []).map((c) => ({
        courtId: c.id,
        courtName: c.name,
        revenue: courtRevenue[c.id]?.revenue || 0,
        bookingCount: courtRevenue[c.id]?.count || 0,
    }));
}

/**
 * Get member vs walk-in booking ratio
 */
export async function getMemberVsWalkInData(
    venueId: string,
    days: number = 30
): Promise<MemberVsWalkInData> {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    // Get bookings
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('customer_name, phone, price')
        .eq('venue_id', venueId)
        .gte('booking_date', format(startDate, 'yyyy-MM-dd'))
        .lte('booking_date', format(endDate, 'yyyy-MM-dd'));

    if (bookingsError) throw bookingsError;

    // Get members (customers with is_member = true)
    const { data: members, error: membersError } = await supabase
        .from('customers')
        .select('phone')
        .eq('venue_id', venueId)
        .eq('is_member', true);

    if (membersError) throw membersError;

    const memberPhones = new Set((members || []).map((m) => m.phone));

    const result: MemberVsWalkInData = {
        member: { count: 0, revenue: 0 },
        walkIn: { count: 0, revenue: 0 },
    };

    (bookings || []).forEach((b) => {
        const isMember = memberPhones.has(b.phone);
        const price = Number(b.price) || 0;

        if (isMember) {
            result.member.count += 1;
            result.member.revenue += price;
        } else {
            result.walkIn.count += 1;
            result.walkIn.revenue += price;
        }
    });

    return result;
}

/**
 * Get top customers by spending
 */
export async function getTopCustomers(
    venueId: string,
    days: number = 30,
    limit: number = 10
): Promise<TopCustomer[]> {
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);

    // Get transactions with customer info
    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('customer_id, customer_name, customer_phone, total_amount, paid_amount')
        .eq('venue_id', venueId)
        .gte('created_at', format(startDate, 'yyyy-MM-dd') + 'T00:00:00')
        .lte('created_at', format(endDate, 'yyyy-MM-dd') + 'T23:59:59');

    if (error) throw error;

    // Aggregate by phone (primary identifier) or name if phone missing
    const spendingMap: Record<string, {
        id: string;
        name: string;
        phone: string;
        spending: number;
        count: number;
        isMember: boolean;
    }> = {};

    (transactions || []).forEach((t) => {
        // Skip if no customer info
        if (!t.customer_name && !t.customer_phone) return;

        // Use phone as key if available, else name
        const key = t.customer_phone || t.customer_name;

        if (!spendingMap[key]) {
            spendingMap[key] = {
                id: t.customer_id || '',
                name: t.customer_name || 'Pelanggan',
                phone: t.customer_phone || '-',
                spending: 0,
                count: 0,
                isMember: !!t.customer_id // If has ID, likely a member
            };
        }

        spendingMap[key].spending += Number(t.paid_amount) || 0;
        spendingMap[key].count += 1;

        // Update member status if found in any transaction
        if (t.customer_id) spendingMap[key].isMember = true;
    });

    // Sort and limit
    const sorted = Object.values(spendingMap)
        .sort((a, b) => b.spending - a.spending)
        .slice(0, limit)
        .map(item => ({
            customerId: item.id,
            customerName: item.name,
            phone: item.phone,
            isMember: item.isMember,
            totalSpending: item.spending,
            bookingCount: item.count // Renaming 'bookingCount' to just 'transactionCount' might be better but keeping interface for now
        }));

    return sorted;
}

/**
 * Identify peak and off-peak hours
 */
export async function getPeakHoursAnalysis(
    venueId: string,
    days: number = 30
): Promise<PeakHoursData> {
    const occupancyData = await getOccupancyData(venueId, days);

    // Group by hour (average across all days)
    const hourlyAvg: Record<number, { total: number; count: number }> = {};
    for (let h = 6; h <= 22; h++) {
        hourlyAvg[h] = { total: 0, count: 0 };
    }

    occupancyData.forEach((d) => {
        hourlyAvg[d.hour].total += d.bookingCount;
        hourlyAvg[d.hour].count += 1;
    });

    const hourlyData = Object.entries(hourlyAvg).map(([hour, data]) => ({
        hour: parseInt(hour, 10),
        avgBookings: data.count > 0 ? data.total / data.count : 0,
    }));

    // Sort by avg bookings
    const sorted = [...hourlyData].sort((a, b) => b.avgBookings - a.avgBookings);

    // Top 5 = peak, bottom 5 = off-peak
    const peakHours = sorted.slice(0, 5);
    const offPeakHours = sorted.slice(-5).reverse();

    return { peakHours, offPeakHours };
}
