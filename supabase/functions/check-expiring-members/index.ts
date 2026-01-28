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
    type: '30_DAYS' | '7_DAYS' | 'EXPIRED',
    customerName: string,
    expiryDate: string,
    venueName: string,
    quotaRemaining: number
): string {
    const formattedDate = new Date(expiryDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    switch (type) {
        case '30_DAYS':
            return `Halo ${customerName}! 👋\n\nIni adalah pengingat bahwa membership Anda di *${venueName}* akan berakhir pada *${formattedDate}*.\n\n${quotaRemaining > 0 ? `Anda masih memiliki *${quotaRemaining} sisa quota*.` : ''}\n\nPerpanjang sekarang untuk terus menikmati harga khusus member! 🏸\n\nTerima kasih! 🙏`

        case '7_DAYS':
            return `⏰ *PENGINGAT PENTING* ⏰\n\nHalo ${customerName}!\n\nMembership Anda di *${venueName}* akan berakhir dalam *7 HARI* (${formattedDate}).\n\n${quotaRemaining > 0 ? `⚠️ Anda masih memiliki *${quotaRemaining} sisa quota* yang AKAN HANGUS!` : ''}\n\nJangan sampai kelewatan! Perpanjang sekarang! 📞`

        case 'EXPIRED':
            return `Halo ${customerName},\n\nMembership Anda di *${venueName}* sudah *BERAKHIR* pada ${formattedDate}.\n\nKami sangat berharap Anda bisa kembali bergabung! 🏸\n\nHubungi kami untuk info perpanjangan dan promo khusus member lama.\n\nSampai jumpa kembali! 👋`

        default:
            return `Halo ${customerName}, ini adalah pengingat dari ${venueName}.`
    }
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

        // Get all venues
        const { data: venues, error: venuesError } = await supabase
            .from('venues')
            .select('id, name')

        if (venuesError) {
            throw venuesError
        }

        const venueMap = new Map<string, string>()
        venues?.forEach((v: Venue) => venueMap.set(v.id, v.name))

        // Query 1: Members expiring in exactly 30 days
        const { data: expiring30, error: error30 } = await supabase
            .from('customers')
            .select('*')
            .eq('is_member', true)
            .eq('membership_expiry', in30DaysStr)

        if (!error30 && expiring30) {
            for (const customer of expiring30) {
                const venueName = venueMap.get(customer.venue_id) || 'Venue Anda'
                const message = generateMessage('30_DAYS', customer.name, customer.membership_expiry, venueName, customer.quota || 0)

                const sendResult = await sendWhatsApp(customer.phone, message, fonnteToken)

                // Log to reminder_logs
                await supabase.from('reminder_logs').insert({
                    venue_id: customer.venue_id,
                    customer_id: customer.id,
                    reminder_type: '30_DAYS',
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
                    reminderType: '30_DAYS',
                    status: sendResult.success ? 'SENT' : 'FAILED',
                    error: sendResult.error
                })

                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        // Query 2: Members expiring in exactly 7 days
        const { data: expiring7, error: error7 } = await supabase
            .from('customers')
            .select('*')
            .eq('is_member', true)
            .eq('membership_expiry', in7DaysStr)

        if (!error7 && expiring7) {
            for (const customer of expiring7) {
                const venueName = venueMap.get(customer.venue_id) || 'Venue Anda'
                const message = generateMessage('7_DAYS', customer.name, customer.membership_expiry, venueName, customer.quota || 0)

                const sendResult = await sendWhatsApp(customer.phone, message, fonnteToken)

                await supabase.from('reminder_logs').insert({
                    venue_id: customer.venue_id,
                    customer_id: customer.id,
                    reminder_type: '7_DAYS',
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
                    reminderType: '7_DAYS',
                    status: sendResult.success ? 'SENT' : 'FAILED',
                    error: sendResult.error
                })

                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        // Query 3: Members expired yesterday (just expired notification)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const { data: expired, error: errorExpired } = await supabase
            .from('customers')
            .select('*')
            .eq('is_member', true)
            .eq('membership_expiry', yesterdayStr)

        if (!errorExpired && expired) {
            for (const customer of expired) {
                const venueName = venueMap.get(customer.venue_id) || 'Venue Anda'
                const message = generateMessage('EXPIRED', customer.name, customer.membership_expiry, venueName, customer.quota || 0)

                const sendResult = await sendWhatsApp(customer.phone, message, fonnteToken)

                await supabase.from('reminder_logs').insert({
                    venue_id: customer.venue_id,
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
