# Panduan Integrasi smashcourts.online → smashpartner.online

## Tujuan

Setelah menerima webhook "Invoices paid" dari Xendit, smashcourts.online harus **forward** data pembayaran ke smashpartner.online agar booking di admin panel juga terupdate.

---

## Endpoint

```
POST https://smashpartner.online/api/webhooks/pwa-sync
```

---

## Autentikasi

Menggunakan **HMAC-SHA256 signature** (bukan JWT).

### Header yang Diperlukan

| Header | Deskripsi |
|--------|-----------|
| `Content-Type` | `application/json` |
| `x-pwa-signature` | HMAC-SHA256 signature dari request body |

### Cara Generate Signature

```typescript
import crypto from 'crypto';

function generateSignature(payload: string, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
}

// Contoh penggunaan
const payload = JSON.stringify(data);
const secret = process.env.PWA_WEBHOOK_SECRET; // Shared secret
const signature = generateSignature(payload, secret);
```

---

## Payload Format

```typescript
interface PwaSyncPayload {
    event: 'booking.paid' | 'booking.updated';
    booking_id: string;      // UUID booking
    status: string;          // 'LUNAS', 'DP', dll
    paid_amount: number;     // Jumlah yang dibayar
    payment_method?: string; // 'QRIS', 'VA', dll (opsional)
    payment_details?: {      // Detail tambahan (opsional)
        invoice_id?: string;
        payment_id?: string;
        [key: string]: any;
    };
    timestamp: string;       // ISO 8601 format
}
```

### Contoh Payload

```json
{
    "event": "booking.paid",
    "booking_id": "b24a8a76-edb7-4b0c-950b-3144cc4d7ec6",
    "status": "LUNAS",
    "paid_amount": 32000,
    "payment_method": "QRIS",
    "payment_details": {
        "invoice_id": "INV-123456"
    },
    "timestamp": "2026-02-04T23:00:00.000Z"
}
```

---

## Implementasi di smashcourts.online

### 1. Tambahkan Environment Variable

```env
PWA_WEBHOOK_SECRET=your-shared-secret-here
SMASHPARTNER_SYNC_URL=https://smashpartner.online/api/webhooks/pwa-sync
```

> **PENTING:** Nilai `PWA_WEBHOOK_SECRET` harus **SAMA PERSIS** dengan yang ada di smashpartner.online.

### 2. Buat Utility Function

```typescript
// lib/partner-sync.ts
import crypto from 'crypto';

const SYNC_URL = process.env.SMASHPARTNER_SYNC_URL || 'https://smashpartner.online/api/webhooks/pwa-sync';
const SECRET = process.env.PWA_WEBHOOK_SECRET || '';

interface SyncPayload {
    event: 'booking.paid' | 'booking.updated';
    booking_id: string;
    status: string;
    paid_amount: number;
    payment_method?: string;
    payment_details?: Record<string, any>;
    timestamp: string;
}

function generateSignature(payload: string): string {
    return crypto
        .createHmac('sha256', SECRET)
        .update(payload)
        .digest('hex');
}

export async function syncBookingToPartner(data: Omit<SyncPayload, 'timestamp'>): Promise<boolean> {
    try {
        const payload: SyncPayload = {
            ...data,
            timestamp: new Date().toISOString()
        };

        const payloadString = JSON.stringify(payload);
        const signature = generateSignature(payloadString);

        const response = await fetch(SYNC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-pwa-signature': signature
            },
            body: payloadString
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('[Partner Sync] Failed:', error);
            return false;
        }

        console.log('[Partner Sync] Success for booking:', data.booking_id);
        return true;

    } catch (error) {
        console.error('[Partner Sync] Error:', error);
        return false;
    }
}
```

### 3. Panggil di Xendit Webhook Handler

Di handler webhook Xendit (setelah "Invoices paid" diterima):

```typescript
// Contoh di route handler webhooks/xendit
import { syncBookingToPartner } from '@/lib/partner-sync';

// ... setelah update local database ...

// Sync ke smashpartner.online
await syncBookingToPartner({
    event: 'booking.paid',
    booking_id: bookingId,          // UUID booking
    status: 'LUNAS',                // atau 'DP' jika bayar sebagian
    paid_amount: paidAmount,        // Jumlah yang dibayar
    payment_method: paymentMethod,  // 'QRIS', 'VA', dll
    payment_details: {
        invoice_id: xenditInvoiceId
    }
});
```

---

## Response

### Sukses (200)

```json
{
    "success": true,
    "message": "Booking synced successfully",
    "booking_id": "b24a8a76-edb7-4b0c-950b-3144cc4d7ec6"
}
```

### Error Responses

| Status | Error | Penyebab |
|--------|-------|----------|
| 401 | Missing x-pwa-signature header | Header signature tidak ada |
| 401 | Invalid webhook signature | Signature tidak cocok (secret berbeda) |
| 400 | Missing booking_id | Payload tidak lengkap |
| 404 | Booking not found | Booking tidak ada di database smashpartner |
| 500 | Internal server error | Error di server |

---

## Testing

### 1. Health Check

```bash
curl https://smashpartner.online/api/webhooks/pwa-sync
```

Response:
```json
{
    "endpoint": "/api/webhooks/pwa-sync",
    "description": "PWA Booking Sync Webhook",
    "methods": ["POST"],
    "headers": {
        "required": ["x-pwa-signature"],
        "description": "HMAC-SHA256 signature of the request body"
    }
}
```

### 2. Test dengan Payload

```bash
# Generate signature (contoh dengan Node.js)
SECRET="your-shared-secret"
PAYLOAD='{"event":"booking.paid","booking_id":"test-id","status":"LUNAS","paid_amount":50000,"timestamp":"2026-02-04T23:00:00Z"}'
SIGNATURE=$(echo -n $PAYLOAD | openssl dgst -sha256 -hmac $SECRET | cut -d' ' -f2)

# Send request
curl -X POST https://smashpartner.online/api/webhooks/pwa-sync \
  -H "Content-Type: application/json" \
  -H "x-pwa-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

---

## Checklist Implementasi

- [ ] Tambahkan `PWA_WEBHOOK_SECRET` ke environment variables
- [ ] Nilai secret **SAMA** dengan yang di smashpartner.online
- [ ] Buat utility function `syncBookingToPartner`
- [ ] Panggil sync setelah menerima webhook "Invoices paid" dari Xendit
- [ ] Test dengan booking baru

---

## Catatan Penting

1. **Secret harus sama** - `PWA_WEBHOOK_SECRET` di smashcourts.online harus identik dengan di smashpartner.online
2. **Gunakan booking_id yang benar** - Pastikan booking_id adalah UUID yang sama di kedua database
3. **Retry logic** - Pertimbangkan untuk menambahkan retry jika sync gagal
4. **Logging** - Tambahkan logging untuk debugging

---

## Kontak

Jika ada masalah dengan endpoint ini, hubungi tim smashpartner.online.
