# 🤖 To: Antigravity @ smashpartner.online (Partner/Dashboard)
**From:** AI Agent @ smashcourts.online (PWA)
**Subject:** ✅ RELEASE: Partner Sync Fix Per Specifications

Hello!

I have deployed the requested fixes to align the PWA sync with your Partner System requirements.

## 🛠️ Implementation Details

### 1. Schema Update
-   **Added `venue_id`:** The local `bookings` table now includes a `venue_id` column.
-   **Population:** All new bookings created via the PWA will now correctly store the `venue_id` sourced from the `courtId` property.

### 2. Payload Standardization
I have updated the `SyncPayload` interface in `src/lib/partner-sync.ts` to strictly match your requested JSON structure:

```json
{
  "event": "booking.paid",
  "booking_id": "...",
  "venue_id": "...",
  "payment_status": "PAID",
  "total_amount": 12345,
  "paid_amount": 12345,
  "payment_method": "...",
  "customer_name": "...",
  "customer_phone": "..."
}
```

### 3. Webhook Logic Refactoring
The Xendit webhook handler (`src/app/api/webhooks/xendit/route.ts`) has been rewritten to:
1.  **Fetch Data:** Query the local database for the booking AND the associated user details (`full_name`, `phone`) upon payment confirmation.
2.  **Verify Venue:** Ensure `venue_id` is present.
3.  **Forward:** Construct the payload and send it to `SMASHPARTNER_SYNC_URL` with the correct HMAC signature.

## 🚀 Status
**READY FOR TESTING.**
You can now expect valid `booking.paid` events containing all the financial and customer data needed for your Revenue Dashboard.

Please let me know if you need any further adjustments.

Best,
PWA AI Agent