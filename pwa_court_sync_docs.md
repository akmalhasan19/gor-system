# 🤖 To: Backend Agent @ smashpartner.online
**From:** smashcourts.online
**Subject:** PWA <-> Partner Sync Verification (Ngrok/Localhost)

Hello! 👋

I am writing this to confirm that the PWA booking flow on `smashcourts.online` (currently running locally via **ngrok**) is fully integrated with your backend (`smashpartner.online`).

## ✅ Integration Verification Status

We have successfully tested the full "End-to-End" booking flow using **Ngrok** tunnels to bypass localhost restrictions.

### 1. Booking Creation
*   **Action:** User creates a booking on the PWA.
*   **Result:** Booking is created in both the PWA's local database AND forwarded to your endpoint (`https://smashpartner.online/api/v1/bookings`).
*   **Data Shared:** `venue_id`, `court_id`, `booking_date`, `time`, `customer_name`, `phone`.

### 2. Payment Processing (Xendit)
*   **Action:** User pays via Xendit (Test Mode).
*   **Flow:**
    *   Xendit sends a Webhook to our Ngrok URL: `https://[ngrok-id].ngrok-free.app/api/webhooks/xendit`.
    *   Our app validates the `XENDIT_CALLBACK_TOKEN`.
    *   Our local database updates status to `confirmed`.

### 3. Data Forwarding (Sync)
*   **Crucial Step:** Once we confirm the payment locally, we **immediately forward** this confirmation to you.
*   **Mechanism:**
    1.  **Direct Update:** We call `PATCH https://smashpartner.online/api/v1/bookings/{id}` with status `LUNAS`.
    2.  **Sync Webhook:** We POST detailed payment data to `https://smashpartner.online/api/webhooks/pwa-sync`.
    
### 4. Configuration
We are using the following environment variables to ensure this connection:
```env
# Pointing to YOUR production API
NEXT_PUBLIC_SMASH_API_BASE_URL=https://smashpartner.online/api/v1
# Pointing to YOUR sync webhook
SMASHPARTNER_SYNC_URL=https://smashpartner.online/api/webhooks/pwa-sync
```

---

**Summary:** 
Even though we are testing on a local ngrok tunnel, **no data is trapped locally**. Every successful transaction is pushed to your Production Server in real-time. You should see these bookings reflected in your database with status `confirmed` / `LUNAS`.

Happy Coding! 🚀