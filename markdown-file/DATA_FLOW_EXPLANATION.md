# Data Flow Explanation: smashcourts.online to smashpartner.online

This document explains how booking data flows from the public booking site (`smashcourts.online`) to the admin dashboard (`smashpartner.online`) and how revenue is calculated.

## 1. The PWA Sync Process (Backend)

When a user pays for a booking on `smashcourts.online`:

1.  **Payment Success**: Xendit/Midtrans notifies `smashcourts.online`.
2.  **Webhook Trigger**: `smashcourts.online` sends a signed webhook request to `smashpartner.online`.
    *   **Endpoint**: `POST https://smashpartner.online/api/webhooks/pwa-sync`
    *   **Payload**: Contains `booking_id`, `status` (LUNAS/DP), and `paid_amount`.
    *   **Security**: Verifies `x-pwa-signature` using a shared secret.

3.  **Database Update**:
    *   `smashpartner.online` validates the signature.
    *   If valid, it updates the **`bookings`** table in Supabase.
    *   Sets `status = 'LUNAS'` (or 'DP') and `paid_amount = ...`.

## 2. Dashboard Update Process (Frontend)

The Dashboard on `smashpartner.online` expects to show this data in real-time.

1.  **Realtime Subscription**:
    *   The admin app (`smashpartner.online`) connects to Supabase Realtime channel.
    *   It listens for `UPDATE` events on the `bookings` table.

2.  **Store Update**:
    *   When the database updates (via step 1), Supabase pushes the change to the connected client.
    *   The App Store (`useAppStore`) receives the update.
    *   **Crucial Filter**: The store *only* accepts updates if:
        *   `venue_id` matches the current venue.
        *   `booking_date` matches the **locally selected date** (default: Today).

3.  **Revenue Calculation**:
    *   The "Pendapatan Hari Ini" card in `DashboardView` calculates revenue as:
        ```typescript
        const totalRevenue = bookings
            .filter(b => b.status === 'LUNAS' || b.status === 'DP')
            .reduce((sum, b) => sum + (b.paidAmount || 0), 0);
        ```
    *   **Note**: This sums up *all* loaded bookings for the selected date.

## 3. Why Data Might Not appear?

If `smashcourts.online` says it sent the data, but the dashboard doesn't show it, check these:

1.  **Date Mismatch**:
    *   Is the booking date *exactly* today? (Watch out for Timezone differences).
    *   The Dashboard matches `YYYY-MM-DD` string. If the booking is for "tomorrow" or the server time assumes it's "yesterday", it won't show on "Today's" view.

2.  **Venue ID Mismatch**:
    *   Does the booking belong to the *currently selected venue*?

3.  **Webhook Failure**:
    *   Did `smashcourts.online` *actually* get a 200 OK from `smashpartner.online`?
    *   Check server logs for `[PWA Sync]` messages.

4.  **Realtime Connection**:
    *   Is the specific admin client connected to the internet and Supabase Realtime?
    *   A page refresh force-reloads data from the DB, which bypasses potential realtime glitches.
