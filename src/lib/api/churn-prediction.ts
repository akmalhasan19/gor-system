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

// ============================================
// Win-back Promo Functions
// ============================================

export interface WinbackConfig {
    enabled: boolean;
    promo_code_prefix: string;
    promo_code_suffix_length: number;
    default_discount_percent: number;
    validity_days: number;
    auto_send_enabled: boolean;
    message_template: string;
}

export interface WinbackPromoLog {
    id: string;
    venue_id: string;
    customer_id: string;
    risk_level: 'high' | 'medium' | 'low';
    promo_code: string;
    discount_percent: number;
    valid_until: string;
    message_content: string;
    phone_number: string;
    status: 'SENT' | 'FAILED' | 'REDEEMED' | 'EXPIRED';
    sent_at: string;
    redeemed_at?: string;
    customer?: {
        name: string;
        phone: string;
    };
}

/**
 * Generate a promo code based on venue configuration
 */
export function generatePromoCode(config: WinbackConfig): string {
    const prefix = config.promo_code_prefix || 'COMEBACK';
    const suffixLength = config.promo_code_suffix_length || 6;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0, O, 1, I)
    let suffix = '';
    for (let i = 0; i < suffixLength; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${suffix}`;
}

/**
 * Get venue's win-back configuration
 */
export async function getWinbackConfig(venueId: string): Promise<WinbackConfig | null> {
    const { data, error } = await supabase
        .from('venues')
        .select('winback_configuration')
        .eq('id', venueId)
        .single();

    if (error || !data) return null;
    return data.winback_configuration as WinbackConfig;
}

/**
 * Update venue's win-back configuration
 */
export async function updateWinbackConfig(
    venueId: string,
    config: Partial<WinbackConfig>
): Promise<{ success: boolean; error?: string }> {
    // Get current config first
    const current = await getWinbackConfig(venueId);
    const updatedConfig = { ...current, ...config };

    const { error } = await supabase
        .from('venues')
        .update({ winback_configuration: updatedConfig })
        .eq('id', venueId);

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true };
}

/**
 * Send win-back promo to an at-risk member
 */
export async function sendWinbackPromo(
    venueId: string,
    member: AtRiskMember,
    venueName: string,
    config?: WinbackConfig
): Promise<{ success: boolean; promoCode?: string; error?: string }> {
    try {
        // Get config if not provided
        const winbackConfig = config || await getWinbackConfig(venueId);
        if (!winbackConfig) {
            return { success: false, error: 'Win-back configuration not found' };
        }

        // Generate promo code
        const promoCode = generatePromoCode(winbackConfig);
        const discountPercent = winbackConfig.default_discount_percent || 15;
        const validityDays = winbackConfig.validity_days || 7;

        // Calculate valid until date
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validityDays);
        const validUntilStr = format(validUntil, 'yyyy-MM-dd');
        const validUntilFormatted = format(validUntil, 'dd MMMM yyyy');

        // Generate message from template
        let message = winbackConfig.message_template ||
            'Halo {name}! 👋\n\nKami kangen sama kamu di {venue}! 🏸\n\nGunakan kode promo *{promo_code}* untuk dapat diskon *{discount}%* booking lapangan.\n\nBerlaku sampai {valid_until}.\n\nYuk main lagi! 💪';

        message = message
            .replace(/{name}/g, member.name)
            .replace(/{venue}/g, venueName)
            .replace(/{promo_code}/g, promoCode)
            .replace(/{discount}/g, discountPercent.toString())
            .replace(/{valid_until}/g, validUntilFormatted);

        // Send WhatsApp message
        const { sendWhatsAppMessage } = await import('./whatsapp');
        const sendResult = await sendWhatsAppMessage({
            phone: member.phone,
            message,
        });

        // Log the promo
        await supabase.from('winback_promo_logs').insert({
            venue_id: venueId,
            customer_id: member.id,
            risk_level: member.riskLevel,
            promo_code: promoCode,
            discount_percent: discountPercent,
            valid_until: validUntilStr,
            message_content: message,
            phone_number: member.phone,
            status: sendResult.success ? 'SENT' : 'FAILED',
            external_message_id: sendResult.messageId,
            error_message: sendResult.error,
            sent_at: sendResult.success ? new Date().toISOString() : null,
        });

        if (!sendResult.success) {
            return { success: false, error: sendResult.error };
        }

        return { success: true, promoCode };
    } catch (error) {
        console.error('Failed to send win-back promo:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get win-back promo logs for a venue
 */
export async function getWinbackPromoLogs(
    venueId: string,
    limit: number = 50,
    offset: number = 0
): Promise<{ data: WinbackPromoLog[] | null; error: Error | null; count: number }> {
    const { data, error, count } = await supabase
        .from('winback_promo_logs')
        .select(`
            *,
            customer:customers(name, phone)
        `, { count: 'exact' })
        .eq('venue_id', venueId)
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit - 1);

    return {
        data: data as WinbackPromoLog[] | null,
        error: error ? new Error(error.message) : null,
        count: count || 0,
    };
}

/**
 * Mark a promo code as redeemed
 */
export async function redeemPromoCode(
    promoCode: string,
    venueId: string
): Promise<{ success: boolean; discount_percent?: number; error?: string }> {
    // Find the promo
    const { data: promo, error: findError } = await supabase
        .from('winback_promo_logs')
        .select('*')
        .eq('promo_code', promoCode)
        .eq('venue_id', venueId)
        .eq('status', 'SENT')
        .single();

    if (findError || !promo) {
        return { success: false, error: 'Promo code not found or already used' };
    }

    // Check if expired
    if (new Date(promo.valid_until) < new Date()) {
        await supabase
            .from('winback_promo_logs')
            .update({ status: 'EXPIRED' })
            .eq('id', promo.id);
        return { success: false, error: 'Promo code has expired' };
    }

    // Mark as redeemed
    const { error: updateError } = await supabase
        .from('winback_promo_logs')
        .update({
            status: 'REDEEMED',
            redeemed_at: new Date().toISOString(),
        })
        .eq('id', promo.id);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    return { success: true, discount_percent: promo.discount_percent };
}
