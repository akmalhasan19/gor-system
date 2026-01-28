import { supabase } from '../supabase';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';

// Types
export interface AtRiskMember {
    id: string;
    name: string;
    phone: string;
    photo_url?: string;
    lastBookingDate: string | null;
    daysSinceLastBooking: number | null;
    bookingFrequency: number; // bookings per month (last 90 days)
    recentBookings: number; // bookings in last 30 days
    previousBookings: number; // bookings in 30-60 days ago
    frequencyTrend: 'increasing' | 'stable' | 'decreasing';
    quotaRemaining: number;
    membershipExpiry: string | null;
    daysUntilExpiry: number | null;
    riskLevel: 'high' | 'medium' | 'low';
    riskReasons: string[];
}

export interface MemberActivityStats {
    memberId: string;
    totalBookings: number;
    lastBookingDate: string | null;
    bookingsLast30Days: number;
    bookingsLast60Days: number;
    bookingsLast90Days: number;
    averageMonthlyBookings: number;
}

interface BookingRecord {
    id: string;
    customer_name: string;
    phone: string;
    booking_date: string;
}

interface CustomerRecord {
    id: string;
    name: string;
    phone: string;
    photo_url: string | null;
    is_member: boolean;
    quota: number;
    membership_expiry: string | null;
}

/**
 * Get members at risk of churning
 * Criteria:
 * - No booking in 30+ days (used to book weekly) = HIGH
 * - Booking frequency decreased >50% = MEDIUM-HIGH
 * - Quota unused and expiry <14 days = MEDIUM
 * - No booking in 14+ days = LOW
 */
export async function getAtRiskMembers(venueId: string): Promise<AtRiskMember[]> {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
    const sixtyDaysAgo = format(subDays(today, 60), 'yyyy-MM-dd');
    const ninetyDaysAgo = format(subDays(today, 90), 'yyyy-MM-dd');

    // Get all active members
    const { data: members, error: membersError } = await supabase
        .from('customers')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_member', true)
        .eq('is_deleted', false);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    // Get all bookings for this venue in the last 90 days
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, customer_name, phone, booking_date')
        .eq('venue_id', venueId)
        .gte('booking_date', ninetyDaysAgo)
        .order('booking_date', { ascending: false });

    if (bookingsError) throw bookingsError;

    const atRiskMembers: AtRiskMember[] = [];

    for (const member of members as CustomerRecord[]) {
        // Find bookings by this member (match by phone)
        const memberBookings = (bookings || []).filter(
            (b: BookingRecord) => b.phone === member.phone
        );

        // Calculate stats
        const lastBooking = memberBookings.length > 0 ? memberBookings[0] : null;
        const lastBookingDate = lastBooking ? lastBooking.booking_date : null;
        const daysSinceLastBooking = lastBookingDate
            ? differenceInDays(today, parseISO(lastBookingDate))
            : null;

        // Count bookings in different periods
        const recentBookings = memberBookings.filter(
            (b: BookingRecord) => b.booking_date >= thirtyDaysAgo
        ).length;
        const previousBookings = memberBookings.filter(
            (b: BookingRecord) => b.booking_date >= sixtyDaysAgo && b.booking_date < thirtyDaysAgo
        ).length;

        // Calculate monthly frequency (last 90 days / 3 months)
        const bookingFrequency = memberBookings.length / 3;

        // Determine trend
        let frequencyTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
        if (previousBookings > 0) {
            const changeRatio = recentBookings / previousBookings;
            if (changeRatio < 0.5) frequencyTrend = 'decreasing';
            else if (changeRatio > 1.5) frequencyTrend = 'increasing';
        } else if (recentBookings === 0 && memberBookings.length > 0) {
            frequencyTrend = 'decreasing';
        }

        // Days until expiry
        const daysUntilExpiry = member.membership_expiry
            ? differenceInDays(parseISO(member.membership_expiry), today)
            : null;

        // Determine risk level and reasons
        const riskReasons: string[] = [];
        let riskScore = 0;

        // HIGH RISK: No booking in 30+ days (and used to book regularly)
        if (daysSinceLastBooking !== null && daysSinceLastBooking >= 30 && bookingFrequency >= 1) {
            riskReasons.push(`Tidak ada booking ${daysSinceLastBooking} hari (biasanya aktif)`);
            riskScore += 3;
        }

        // MEDIUM-HIGH RISK: Frequency decreased >50%
        if (frequencyTrend === 'decreasing' && previousBookings >= 2) {
            riskReasons.push(`Frekuensi menurun: ${previousBookings} → ${recentBookings} booking/bulan`);
            riskScore += 2;
        }

        // MEDIUM RISK: Quota unused and expiry soon
        if (member.quota > 0 && daysUntilExpiry !== null && daysUntilExpiry <= 14 && daysUntilExpiry > 0) {
            riskReasons.push(`${member.quota} jatah tidak terpakai, expired dalam ${daysUntilExpiry} hari`);
            riskScore += 2;
        }

        // LOW RISK: No booking in 14+ days
        if (daysSinceLastBooking !== null && daysSinceLastBooking >= 14 && daysSinceLastBooking < 30) {
            riskReasons.push(`Tidak ada booking ${daysSinceLastBooking} hari`);
            riskScore += 1;
        }

        // Never booked
        if (daysSinceLastBooking === null && member.quota > 0) {
            riskReasons.push('Member belum pernah booking');
            riskScore += 2;
        }

        // Expired membership
        if (daysUntilExpiry !== null && daysUntilExpiry < 0) {
            riskReasons.push(`Membership expired ${Math.abs(daysUntilExpiry)} hari lalu`);
            riskScore += 3;
        }

        // Only include members with risk
        if (riskReasons.length > 0) {
            let riskLevel: 'high' | 'medium' | 'low' = 'low';
            if (riskScore >= 3) riskLevel = 'high';
            else if (riskScore >= 2) riskLevel = 'medium';

            atRiskMembers.push({
                id: member.id,
                name: member.name,
                phone: member.phone,
                photo_url: member.photo_url || undefined,
                lastBookingDate,
                daysSinceLastBooking,
                bookingFrequency: Math.round(bookingFrequency * 10) / 10,
                recentBookings,
                previousBookings,
                frequencyTrend,
                quotaRemaining: member.quota || 0,
                membershipExpiry: member.membership_expiry,
                daysUntilExpiry,
                riskLevel,
                riskReasons,
            });
        }
    }

    // Sort by risk level (high first) then by days since last booking
    return atRiskMembers.sort((a, b) => {
        const riskOrder = { high: 0, medium: 1, low: 2 };
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
            return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        }
        // Secondary sort: days since last booking (more days = higher on list)
        const aDays = a.daysSinceLastBooking ?? 999;
        const bDays = b.daysSinceLastBooking ?? 999;
        return bDays - aDays;
    });
}

/**
 * Get detailed activity stats for a specific member
 */
export async function getMemberActivityStats(
    venueId: string,
    memberPhone: string
): Promise<MemberActivityStats | null> {
    const today = new Date();
    const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
    const sixtyDaysAgo = format(subDays(today, 60), 'yyyy-MM-dd');
    const ninetyDaysAgo = format(subDays(today, 90), 'yyyy-MM-dd');

    // Get member
    const { data: member, error: memberError } = await supabase
        .from('customers')
        .select('id')
        .eq('venue_id', venueId)
        .eq('phone', memberPhone)
        .single();

    if (memberError || !member) return null;

    // Get all bookings for this member
    const { data: allBookings, error: allError } = await supabase
        .from('bookings')
        .select('id, booking_date')
        .eq('venue_id', venueId)
        .eq('phone', memberPhone)
        .order('booking_date', { ascending: false });

    if (allError) throw allError;

    const bookings = allBookings || [];
    const lastBookingDate = bookings.length > 0 ? bookings[0].booking_date : null;

    const bookingsLast30Days = bookings.filter(b => b.booking_date >= thirtyDaysAgo).length;
    const bookingsLast60Days = bookings.filter(b => b.booking_date >= sixtyDaysAgo).length;
    const bookingsLast90Days = bookings.filter(b => b.booking_date >= ninetyDaysAgo).length;

    return {
        memberId: member.id,
        totalBookings: bookings.length,
        lastBookingDate,
        bookingsLast30Days,
        bookingsLast60Days,
        bookingsLast90Days,
        averageMonthlyBookings: Math.round((bookingsLast90Days / 3) * 10) / 10,
    };
}
