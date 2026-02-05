import axios from 'axios';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const WEBHOOK_SECRET = process.env.PWA_WEBHOOK_SECRET || "kMVBNvrwz5PD188zU7D0FlVu3YzJVL8fQKJ8n39W64A="; // Fallback to hardcoded for testing
const TARGET_URL = 'http://localhost:3001/api/webhooks/pwa-sync'; // Switching to 3001 based on .env.local

// Real data from User's Xendit Payload
const payload = {
    event: 'booking.paid',
    booking_id: "57da844b-c013-4e71-9c8e-895ee21a69b8", // The ID from Xendit external_id
    payment_status: "PAID",
    payment_method: "QR_CODE",
    paid_amount: 32000,
    total_amount: 32000,
    customer_name: "Akmal Hasan (Simulated)",
    customer_email: "akmal.hasan.mulyadi@gmail.com",
    customer_phone: "08123456789", // Placeholder
    booking_details: {
        // Minimal details needed
        court_name: "Lapangan 3",
        date: "2026-02-05", // Today
        time: "10:00 - 11:00"
    }
};

async function simulateWebhook() {
    try {
        console.log('--- Simulating PWA Sync Webhook ---');
        console.log('Target URL:', TARGET_URL);
        console.log('Payload:', JSON.stringify(payload, null, 2));

        // Generate Signature
        const signature = crypto
            .createHmac('sha256', WEBHOOK_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');

        console.log('Generated Signature:', signature);

        const response = await axios.post(TARGET_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-pwa-signature': signature
            }
        });

        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
        console.log('--- Success ---');

    } catch (error: any) {
        console.error('Error simulating webhook:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

simulateWebhook();
