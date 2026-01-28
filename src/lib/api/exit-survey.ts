import { supabase } from '@/lib/supabase';

// Types
export interface ExitSurveyReason {
    id: string;
    label: string;
}

export interface ExitSurveyResponse {
    id: string;
    venue_id: string;
    customer_id: string;
    reasons: string[];
    other_reason?: string;
    feedback?: string;
    membership_expiry?: string;
    survey_sent_at?: string;
    completed_at?: string;
    created_at: string;
    customer?: {
        name: string;
        phone: string;
    };
}

export interface ExitSurveyStats {
    totalResponses: number;
    reasonBreakdown: { reason: string; count: number; percentage: number }[];
    averageReasonsPerResponse: number;
}

// Standard exit survey reasons
export const EXIT_SURVEY_REASONS: ExitSurveyReason[] = [
    { id: 'too_expensive', label: 'Harga terlalu mahal' },
    { id: 'facility_poor', label: 'Fasilitas kurang memadai' },
    { id: 'location_far', label: 'Lokasi terlalu jauh' },
    { id: 'moved_city', label: 'Pindah kota/domisili' },
    { id: 'busy_schedule', label: 'Kesibukan lain' },
    { id: 'poor_service', label: 'Pelayanan kurang ramah' },
    { id: 'found_alternative', label: 'Menemukan tempat lain yang lebih baik' },
    { id: 'health_issue', label: 'Masalah kesehatan' },
    { id: 'not_playing', label: 'Sudah tidak bermain badminton lagi' },
    { id: 'other', label: 'Lainnya' },
];

/**
 * Submit exit survey response (public - no auth required)
 */
export async function submitExitSurvey(
    venueId: string,
    customerId: string,
    reasons: string[],
    otherReason?: string,
    feedback?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('exit_surveys')
            .insert({
                venue_id: venueId,
                customer_id: customerId,
                reasons,
                other_reason: otherReason,
                feedback,
                completed_at: new Date().toISOString(),
            });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Failed to submit exit survey:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get exit survey responses for a venue
 */
export async function getExitSurveyResponses(
    venueId: string,
    limit: number = 50,
    offset: number = 0
): Promise<{ data: ExitSurveyResponse[] | null; error: Error | null; count: number }> {
    const { data, error, count } = await supabase
        .from('exit_surveys')
        .select(`
            *,
            customer:customers(name, phone)
        `, { count: 'exact' })
        .eq('venue_id', venueId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .range(offset, offset + limit - 1);

    return {
        data: data as ExitSurveyResponse[] | null,
        error: error ? new Error(error.message) : null,
        count: count || 0,
    };
}

/**
 * Get exit survey statistics for a venue
 */
export async function getExitSurveyStats(venueId: string): Promise<ExitSurveyStats> {
    const { data, error } = await supabase
        .from('exit_surveys')
        .select('reasons')
        .eq('venue_id', venueId)
        .not('completed_at', 'is', null);

    if (error || !data || data.length === 0) {
        return {
            totalResponses: 0,
            reasonBreakdown: [],
            averageReasonsPerResponse: 0,
        };
    }

    // Count reason occurrences
    const reasonCounts: Record<string, number> = {};
    let totalReasons = 0;

    data.forEach((survey) => {
        const reasons = survey.reasons as string[];
        reasons.forEach((reason) => {
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
            totalReasons++;
        });
    });

    // Convert to sorted array with percentages
    const reasonBreakdown = Object.entries(reasonCounts)
        .map(([reason, count]) => ({
            reason,
            count,
            percentage: Math.round((count / data.length) * 100),
        }))
        .sort((a, b) => b.count - a.count);

    return {
        totalResponses: data.length,
        reasonBreakdown,
        averageReasonsPerResponse: Math.round((totalReasons / data.length) * 10) / 10,
    };
}

/**
 * Check if customer already submitted exit survey
 */
export async function hasSubmittedExitSurvey(
    venueId: string,
    customerId: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('exit_surveys')
        .select('id')
        .eq('venue_id', venueId)
        .eq('customer_id', customerId)
        .not('completed_at', 'is', null)
        .limit(1);

    if (error) return false;
    return data && data.length > 0;
}

/**
 * Get customer info for survey page (public - limited info)
 */
export async function getCustomerForSurvey(
    venueId: string,
    customerId: string
): Promise<{ name: string; venueName: string } | null> {
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('name')
        .eq('id', customerId)
        .eq('venue_id', venueId)
        .single();

    if (customerError || !customer) return null;

    const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('name')
        .eq('id', venueId)
        .single();

    if (venueError || !venue) return null;

    return {
        name: customer.name,
        venueName: venue.name,
    };
}
