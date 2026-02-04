# PWA Court Sync Documentation - Review & Suggestions

**Reviewed by:** Smash Partner AI Agent  
**Date:** 2026-02-04  
**Document:** `pwa_court_sync_docs.md`

---

## Overview

After reviewing the documentation and comparing it with the actual implementation in this codebase, I found several discrepancies and areas for improvement.

---

## Discrepancies Found

### 1. Booking Status Terminology

**Documentation says:**
> `status` | `'pending'` (updated to `'confirmed'` via Xendit webhook)

**Actual implementation:**
The Xendit webhook (`src/app/api/webhooks/xendit/route.ts`) updates booking status to `'LUNAS'`, not `'confirmed'`.

```typescript
// From webhooks/xendit/route.ts (line 164)
.update({
    status: 'LUNAS',  // ← Actual status used
    paid_amount: item.price,
    in_cart_since: null
})
```

> [!IMPORTANT]
> The PWA side should use `'LUNAS'` or be aware that `'confirmed'` is not used in Partner Dashboard.

---

### 2. Missing `smashApi.createBooking()` Function

**Documentation says:**
> Partner App calls `smashApi.createBooking()` to PWA API (existing flow).

**Actual implementation:**
There is no `smashApi.createBooking()` function in this codebase. The booking creation flow is handled by:
- `src/lib/api/bookings.ts` → `createBooking()` (direct Supabase insert)
- `src/app/api/v1/bookings/route.ts` → REST API endpoint for external calls

The documentation may be referring to the PWA side calling the Partner API, not the other way around. This should be clarified.

---

### 3. Court Sync Logic Not Found

**Documentation says:**
> Partner App checks if the `court_id` exists in its local `courts` table, and if not found, fetches court details from PWA response and inserts it locally.

**Actual implementation:**
No such "auto-sync" logic exists in `src/lib/api/bookings.ts`. The `createBooking()` function:
1. Converts `courtId` (number) to UUID via querying local `courts` table
2. **Throws an error** if court is not found

```typescript
// From bookings.ts (line 89-90)
if (courtError || !court) {
    throw new Error(`Court with number ${courtNumber} not found`);
}
```

> [!WARNING]
> If a court doesn't exist locally, the booking will **fail**, not auto-sync.

---

### 4. Data Flow Direction Unclear

**Documentation says:**
> This is a one-way sync (PWA → Partner).

**Actual implementation context:**
- The Partner Dashboard has its own Supabase database
- Bookings are created directly in Partner's Supabase, not synced from PWA
- The Xendit webhook updates records in **Partner's database**

The documentation implies data flows FROM PWA TO Partner, but in reality:
- Courts must exist in Partner's `courts` table beforehand
- Bookings are created locally, not received from PWA

---

### 5. Missing User Context

**Documentation says:**
> `user_id` | Current logged-in user

**Actual implementation:**
The `bookings` table uses `customer_name` and `phone`, not a `user_id` foreign key. The API endpoint (`src/app/api/v1/bookings/route.ts`) does not handle `user_id` at all.

---

## Suggestions for Documentation Update

### Corrected Flow

```
1. User selects court/time on PWA Smash
2. PWA Smash calls Partner API: POST /api/v1/bookings
3. Partner API validates, calculates price, inserts booking with status='pending'
4. Partner API returns booking data (including ID and price)
5. PWA Smash creates Xendit payment using booking ID as external_id
6. User pays via Xendit
7. Xendit sends webhook to Partner: POST /api/webhooks/xendit
8. Partner updates: payment → 'PAID', transaction → 'PAID', booking → 'LUNAS'
```

### Recommended Changes to Documentation

| Section | Current | Should Be |
|---------|---------|-----------|
| Booking status after payment | `'confirmed'` | `'LUNAS'` |
| Court sync behavior | Auto-create if missing | Error if missing (require pre-seeding) |
| Data source | `smashApi.createBooking()` | Partner's internal API or `/api/v1/bookings` |
| User tracking | `user_id` | `customer_name` + `phone` |

---

## Action Items for PWA Side

1. **Update status expectations**: Expect `'LUNAS'` instead of `'confirmed'` when checking booking status
2. **Pre-seed courts**: Ensure courts exist in Partner DB before allowing bookings (or implement actual sync)
3. **Clarify API direction**: Update docs to show PWA → Partner API → Partner DB flow

---

## Contact

For any questions about the Partner side implementation, feel free to check:
- [Xendit Webhook Route](file:///c:/Users/user/smash-partner/src/app/api/webhooks/xendit/route.ts)
- [Bookings API](file:///c:/Users/user/smash-partner/src/lib/api/bookings.ts)
- [V1 Bookings Endpoint](file:///c:/Users/user/smash-partner/src/app/api/v1/bookings/route.ts)
