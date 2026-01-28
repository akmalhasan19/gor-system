/**
 * WhatsApp API Helper
 * Uses Fonnte API for sending WhatsApp messages
 * @see https://fonnte.com/api
 */

// Types
export interface WhatsAppMessage {
    phone: string;
    message: string;
    countryCode?: string;
}

export interface WhatsAppResponse {
    success: boolean;
    messageId?: string;
    error?: string;
}

export interface ReminderTemplate {
    type: '30_DAYS' | '7_DAYS' | 'EXPIRED';
    customerName: string;
    expiryDate: string;
    venueName: string;
    quotaRemaining?: number;
}

/**
 * Format phone number to international format
 */
export function formatPhoneNumber(phone: string, countryCode: string = '62'): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');

    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // Remove country code if already present
    if (cleaned.startsWith(countryCode)) {
        cleaned = cleaned.substring(countryCode.length);
    }

    // Return with country code
    return `${countryCode}${cleaned}`;
}

/**
 * Generate reminder message based on template type
 */
export function generateReminderMessage(template: ReminderTemplate): string {
    const { type, customerName, expiryDate, venueName, quotaRemaining } = template;

    const formattedDate = new Date(expiryDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    switch (type) {
        case '30_DAYS':
            return `Halo ${customerName}! 👋

Ini adalah pengingat bahwa membership Anda di *${venueName}* akan berakhir pada *${formattedDate}*.

${quotaRemaining && quotaRemaining > 0 ? `Anda masih memiliki *${quotaRemaining} sisa quota* yang bisa digunakan.` : ''}

Perpanjang sekarang untuk terus menikmati harga khusus member! 🏸

Hubungi kami atau datang langsung ke venue untuk perpanjangan.

Terima kasih! 🙏`;

        case '7_DAYS':
            return `⏰ *PENGINGAT PENTING* ⏰

Halo ${customerName}!

Membership Anda di *${venueName}* akan berakhir dalam *7 HARI* (${formattedDate}).

${quotaRemaining && quotaRemaining > 0 ? `⚠️ Anda masih memiliki *${quotaRemaining} sisa quota* yang AKAN HANGUS jika tidak digunakan!` : ''}

Jangan sampai kelewatan! Perpanjang sekarang untuk tetap menikmati benefit member.

Hubungi kami segera! 📞`;

        case 'EXPIRED':
            return `Halo ${customerName},

Membership Anda di *${venueName}* sudah *BERAKHIR* pada ${formattedDate}.

Kami sangat berharap Anda bisa kembali bergabung bersama kami! 🏸

Hubungi kami untuk info perpanjangan dan promo khusus member lama.

Sampai jumpa kembali! 👋`;

        default:
            return `Halo ${customerName}, ini adalah pengingat dari ${venueName}.`;
    }
}

/**
 * Send WhatsApp message via Fonnte API
 * Requires FONNTE_API_TOKEN environment variable
 */
export async function sendWhatsAppMessage(
    message: WhatsAppMessage,
    apiToken?: string
): Promise<WhatsAppResponse> {
    const token = apiToken || process.env.FONNTE_API_TOKEN || process.env.NEXT_PUBLIC_FONNTE_API_TOKEN;

    if (!token) {
        console.error('FONNTE_API_TOKEN not configured');
        return {
            success: false,
            error: 'WhatsApp API token not configured'
        };
    }

    const formattedPhone = formatPhoneNumber(message.phone, message.countryCode);

    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                target: formattedPhone,
                message: message.message,
                countryCode: message.countryCode || '62'
            })
        });

        const data = await response.json();

        if (data.status === true || data.status === 'true') {
            return {
                success: true,
                messageId: data.id || data.detail?.id
            };
        } else {
            return {
                success: false,
                error: data.reason || data.detail || 'Unknown error'
            };
        }
    } catch (error) {
        console.error('WhatsApp API error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}

/**
 * Send bulk WhatsApp messages (with rate limiting)
 */
export async function sendBulkWhatsAppMessages(
    messages: WhatsAppMessage[],
    apiToken?: string,
    delayMs: number = 1000
): Promise<WhatsAppResponse[]> {
    const results: WhatsAppResponse[] = [];

    for (let i = 0; i < messages.length; i++) {
        const result = await sendWhatsAppMessage(messages[i], apiToken);
        results.push(result);

        // Add delay between messages to avoid rate limiting
        if (i < messages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}
