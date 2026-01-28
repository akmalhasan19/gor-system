import { supabase } from '@/lib/supabase';

// Types
export interface ReminderLog {
    id: string;
    venue_id: string;
    customer_id: string;
    reminder_type: '30_DAYS' | '7_DAYS' | 'EXPIRED' | 'MANUAL';
    channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
    message_content: string;
    phone_number: string;
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';
    external_message_id?: string;
    error_message?: string;
    sent_at?: string;
    delivered_at?: string;
    read_at?: string;
    created_at: string;
    updated_at: string;
    // Joined fields
    customer?: {
        name: string;
        phone: string;
    };
}

export interface ReminderStats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
}

/**
 * Get reminder logs for a venue
 */
export async function getReminderLogs(
    venueId: string,
    limit: number = 50,
    offset: number = 0
): Promise<{ data: ReminderLog[] | null; error: Error | null; count: number }> {
    const { data, error, count } = await supabase
        .from('reminder_logs')
        .select(`
            *,
            customer:customers(name, phone)
        `, { count: 'exact' })
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    return {
        data: data as ReminderLog[] | null,
        error: error ? new Error(error.message) : null,
        count: count || 0
    };
}

/**
 * Get reminder stats for a venue
 */
export async function getReminderStats(venueId: string): Promise<ReminderStats> {
    const { data, error } = await supabase
        .from('reminder_logs')
        .select('status')
        .eq('venue_id', venueId);

    if (error || !data) {
        return { total: 0, sent: 0, failed: 0, pending: 0 };
    }

    return {
        total: data.length,
        sent: data.filter(r => r.status === 'SENT' || r.status === 'DELIVERED' || r.status === 'READ').length,
        failed: data.filter(r => r.status === 'FAILED').length,
        pending: data.filter(r => r.status === 'PENDING').length
    };
}

/**
 * Manually send reminder to a specific customer
 */
export async function sendManualReminder(
    venueId: string,
    customerId: string,
    customerName: string,
    customerPhone: string,
    venueName: string,
    expiryDate: string,
    quota: number = 0
): Promise<{ success: boolean; error?: string }> {
    // Import dynamically to avoid SSR issues
    const { sendWhatsAppMessage, generateReminderMessage } = await import('./whatsapp');

    const message = generateReminderMessage({
        type: '7_DAYS', // Manual reminders use 7-day template
        customerName,
        expiryDate,
        venueName,
        quotaRemaining: quota
    });

    const result = await sendWhatsAppMessage({
        phone: customerPhone,
        message
    });

    // Log the reminder
    await supabase.from('reminder_logs').insert({
        venue_id: venueId,
        customer_id: customerId,
        reminder_type: 'MANUAL',
        channel: 'WHATSAPP',
        message_content: message,
        phone_number: customerPhone,
        status: result.success ? 'SENT' : 'FAILED',
        external_message_id: result.messageId,
        error_message: result.error,
        sent_at: result.success ? new Date().toISOString() : null
    });

    return {
        success: result.success,
        error: result.error
    };
}

/**
 * Get members expiring soon (for preview/manual selection)
 */
export async function getExpiringMembers(
    venueId: string,
    daysAhead: number = 30
): Promise<{ data: any[] | null; error: Error | null }> {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_member', true)
        .gte('membership_expiry', todayStr)
        .lte('membership_expiry', futureDateStr)
        .order('membership_expiry', { ascending: true });

    return {
        data,
        error: error ? new Error(error.message) : null
    };
}

/**
 * Trigger the Edge Function manually (requires service role key)
 */
export async function triggerReminderJob(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const response = await fetch('/api/reminders/trigger', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'Failed to trigger reminder job' };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}
