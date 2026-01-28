// Supabase Edge Function: check-expiring-members
// This function checks for members with expiring memberships and sends WhatsApp reminders

import { createClient } from '@supabase/supabase-js'

// CORS headers for Edge Functions
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Customer {
    id: string
    name: string
    phone: string
    isMember: boolean
    membershipExpiry: string
    quota: number
    venue_id: string
}

interface Venue {
    id: string
    name: string
}

interface ReminderResult {
    customerId: string
    customerName: string
    reminderType: '30_DAYS' | '7_DAYS' | 'EXPIRED'
    status: 'SENT' | 'FAILED'
    error?: string
}

// Generate message based on reminder type
function generateMessage(
    type: 'WARNING' | 'EXPIRED' | '30_DAYS' | '7_DAYS', // Backward compatibility
    customerName: string,
    expiryDate: string,
    venueName: string,
    quotaRemaining: number,
    daysBefore: number = 0
): string {
    const formattedDate = new Date(expiryDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    if (type === 'EXPIRED') {
        return `Halo ${customerName},\n\nMembership Anda di *${venueName}* sudah *BERAKHIR* pada ${formattedDate}.\n\nKami sangat berharap Anda bisa kembali bergabung! 🏸\n\nHubungi kami untuk info perpanjangan dan promo khusus member lama.\n\nSampai jumpa kembali! 👋`
    }

    // Generic warning message
    return `⏰ *PENGINGAT MEMBER* ⏰\n\nHalo ${customerName}!\n\nMembership Anda di *${venueName}* akan berakhir dalam *${daysBefore} HARI* (${formattedDate}).\n\n${quotaRemaining > 0 ? `⚠️ Anda masih memiliki *${quotaRemaining} sisa quota*.\n` : ''}\nPerpanjang sekarang sebelum harga naik! 🏸\n\nTerima kasih! 🙏`
}

// Format phone number to international format
function formatPhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1)
    }
    if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned
    }
    return cleaned
}

// Send WhatsApp message via Fonnte
async function sendWhatsApp(phone: string, message: string, apiToken: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': apiToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: formatPhone(phone),
                message: message,
                countryCode: '62'
            })
        })

        const data = await response.json()

        if (data.status === true || data.status === 'true') {
            return { success: true, messageId: data.id || data.detail?.id }
        } else {
            return { success: false, error: data.reason || data.detail || 'Unknown error' }
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Network error' }
    }
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const fonnteToken = Deno.env.get('FONNTE_API_TOKEN')

        if (!fonnteToken) {
            return new Response(
                JSON.stringify({ error: 'FONNTE_API_TOKEN not configured' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        // Create Supabase admin client
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get today's date
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Calculate date thresholds
        const in30Days = new Date(today)
        in30Days.setDate(in30Days.getDate() + 30)
        const in30DaysStr = in30Days.toISOString().split('T')[0]

        const in7Days = new Date(today)
        in7Days.setDate(in7Days.getDate() + 7)
        const in7DaysStr = in7Days.toISOString().split('T')[0]

        const todayStr = today.toISOString().split('T')[0]

        const results: ReminderResult[] = []

        // Query 1: Get all venues with their settings
        const { data: venues, error: venuesError } = await supabase
            .from('venues')
            .select('id, name, reminder_configuration')
            .eq('is_active', true)

        if (venuesError) throw venuesError

        for (const venue of venues) {
            const config = venue.reminder_configuration as {
                warnings?: { days_before: number, enabled: boolean }[],
                expired_message_enabled?: boolean
            } || { warnings: [], expired_message_enabled: true } // Default fallback

            // 1. Process Warnings (e.g. 30 days, 7 days before)
            if (config.warnings && Array.isArray(config.warnings)) {
                for (const warning of config.warnings) {
                    if (!warning.enabled) continue

                    const targetDate = new Date(today)
                    targetDate.setDate(targetDate.getDate() + warning.days_before)
                    const targetDateStr = targetDate.toISOString().split('T')[0]

                    // Find members expiring on this specific date
                    const { data: expiringMembers, error: memberError } = await supabase
                        .from('customers')
                        .select('*')
                        .eq('venue_id', venue.id)
                        .eq('is_member', true)
                        .eq('membership_expiry', targetDateStr)

                    if (!memberError && expiringMembers && expiringMembers.length > 0) {
                        for (const customer of expiringMembers) {
                            const message = generateMessage(
                                'WARNING',
                                customer.name,
                                customer.membership_expiry,
                                venue.name,
                                customer.quota || 0,
                                warning.days_before
                            )

                            const sendResult = await sendWhatsApp(customer.phone, message, fonnteToken)

                            // Log
                            await supabase.from('reminder_logs').insert({
                                venue_id: venue.id,
                                customer_id: customer.id,
                                reminder_type: `${warning.days_before}_DAYS`,
                                channel: 'WHATSAPP',
                                message_content: message,
                                phone_number: customer.phone,
                                status: sendResult.success ? 'SENT' : 'FAILED',
                                external_message_id: sendResult.messageId,
                                error_message: sendResult.error,
                                sent_at: sendResult.success ? new Date().toISOString() : null
                            })

                            results.push({
                                customerId: customer.id,
                                customerName: customer.name,
                                reminderType: `${warning.days_before}_DAYS` as any,
                                status: sendResult.success ? 'SENT' : 'FAILED',
                                error: sendResult.error
                            })

                            // Rate limit
                            await new Promise(resolve => setTimeout(resolve, 1000))
                        }
                    }
                }
            }

            // 2. Process Expired (Yesterday)
            if (config.expired_message_enabled !== false) {
                const yesterday = new Date(today)
                yesterday.setDate(yesterday.getDate() - 1)
                const yesterdayStr = yesterday.toISOString().split('T')[0]

                const { data: expiredMembers, error: expiredError } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('venue_id', venue.id)
                    .eq('is_member', true)
                    .eq('membership_expiry', yesterdayStr)

                if (!expiredError && expiredMembers && expiredMembers.length > 0) {
                    for (const customer of expiredMembers) {
                        const message = generateMessage(
                            'EXPIRED',
                            customer.name,
                            customer.membership_expiry,
                            venue.name,
                            customer.quota || 0
                        )

                        const sendResult = await sendWhatsApp(customer.phone, message, fonnteToken)

                        await supabase.from('reminder_logs').insert({
                            venue_id: venue.id,
                            customer_id: customer.id,
                            reminder_type: 'EXPIRED',
                            channel: 'WHATSAPP',
                            message_content: message,
                            phone_number: customer.phone,
                            status: sendResult.success ? 'SENT' : 'FAILED',
                            external_message_id: sendResult.messageId,
                            error_message: sendResult.error,
                            sent_at: sendResult.success ? new Date().toISOString() : null
                        })

                        results.push({
                            customerId: customer.id,
                            customerName: customer.name,
                            reminderType: 'EXPIRED',
                            status: sendResult.success ? 'SENT' : 'FAILED',
                            error: sendResult.error
                        })

                        await new Promise(resolve => setTimeout(resolve, 1000))
                    }
                }
            }
        }

        // Summary
        const summary = {
            totalProcessed: results.length,
            sent: results.filter(r => r.status === 'SENT').length,
            failed: results.filter(r => r.status === 'FAILED').length,
            details: results
        }

        console.log('Reminder job completed:', summary)

        return new Response(
            JSON.stringify(summary),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error in check-expiring-members:', error)
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
