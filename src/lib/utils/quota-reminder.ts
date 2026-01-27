import { supabase } from '../supabase';
import { Venue } from '../api/venues';
import { Customer } from '../constants';

export async function checkLowQuotaMembers(venueId: string) {
    console.log("Checking for low quota members...");

    const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_member', true)
        .eq('quota', 1);

    if (error) throw error;

    return customers || [];
}

export function generateQuotaReminderLink(customer: Customer) {
    const text = `Halo ${customer.name}, sisa kuota main anda tinggal 1. Segera topup untuk kenyamanan booking berikutnya. Terima kasih!`;
    return `https://wa.me/${customer.phone.replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

// Fonnte API Support
export async function sendFonnteMessage(token: string, target: string, message: string) {
    try {
        const formData = new FormData();
        formData.append('target', target);
        formData.append('message', message);
        formData.append('countryCode', '62'); // Optional, default is often 62 for Indonesia based gateways

        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token,
            },
            body: formData
        });

        const result = await response.json();
        console.log("Fonnte Response:", result);
        return result;
    } catch (error) {
        console.error("Fonnte Error:", error);
        throw error;
    }
}

export async function sendQuotaReminders(venueId: string, token?: string) {
    const members = await checkLowQuotaMembers(venueId);

    if (!token) {
        // Fallback or just return list for manual handling
        return { success: false, message: "Token not provided", members };
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const m of members) {
        const phone = m.phone.replace(/\D/g, ''); // Ensure numeric
        const text = `Halo ${m.name}, reminder dari GOR. Sisa kuota main anda tinggal ${m.quota}. Segera topup ya!`;

        try {
            await sendFonnteMessage(token, phone, text);
            sentCount++;
        } catch (e) {
            failedCount++;
        }
    }

    return { success: true, sent: sentCount, failed: failedCount, members };
}
