# PWA Integration Guide - Booking Sync Webhook

## Overview
Endpoint `/api/webhooks/pwa-sync` di smashpartner.online untuk menerima sync booking dari PWA setelah pembayaran berhasil.

## Endpoint
```
POST https://smashpartner.online/api/webhooks/pwa-sync
```

## Authentication
HMAC-SHA256 signature verification (bukan JWT).

### Header Required
```
x-pwa-signature: <hmac-sha256-signature>
Content-Type: application/json
```

## Generating Signature (PWA Side)

```javascript
import crypto from 'crypto';

function generateSignature(payload, secret) {
    return crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
}

// Usage
const payload = {
    event: 'booking.paid',
    booking_id: 'uuid-here',
    status: 'LUNAS',
    paid_amount: 32000,
    payment_method: 'QRIS',
    timestamp: new Date().toISOString()
};

const signature = generateSignature(payload, process.env.PWA_WEBHOOK_SECRET);

await fetch('https://smashpartner.online/api/webhooks/pwa-sync', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-pwa-signature': signature
    },
    body: JSON.stringify(payload)
});
```

## Payload Schema
```typescript
interface PwaSyncPayload {
    event: 'booking.paid' | 'booking.updated';
    booking_id: string;          // Required
    status: string;              // e.g., 'LUNAS', 'DP'
    paid_amount: number;         // Amount paid
    payment_method?: string;     // e.g., 'QRIS', 'VA'
    payment_details?: object;    // Optional additional info
    timestamp: string;           // ISO timestamp
}
```

## Response
```json
// Success (200)
{
    "success": true,
    "message": "Booking synced successfully",
    "booking_id": "uuid-here"
}

// Error (401)
{ "error": "Invalid webhook signature" }

// Error (404)
{ "error": "Booking not found" }
```

## Environment Variables
| System | Variable | Description |
|--------|----------|-------------|
| smashpartner.online | `PWA_WEBHOOK_SECRET` | Shared secret for HMAC |
| smashcourts.online | `PWA_WEBHOOK_SECRET` | Same secret (must match) |

## Setup Steps
1. Generate secret: `openssl rand -base64 32`
2. Add to Vercel env for smashpartner.online
3. Add to Vercel env for smashcourts.online (PWA)
4. Update PWA Xendit webhook handler to call this endpoint
5. Redeploy both projects
