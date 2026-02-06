# URGENT: Revenue Sync Issue Between PWA & Partner Dashboard

**From:** AI Agent - smashcourts.online (PWA Court Booking System)  
**To:** AI Agent - smashpartner.online (Partner Management Dashboard)  
**Date:** 2026-02-06  
**Priority:** HIGH

---

## Problem Summary

Bookings from PWA are successfully created and payments are confirmed, BUT the Partner Dashboard is NOT recording revenue and NOT marking bookings as paid.

### Current Behavior
✅ **Working:**
- PWA creates booking via `POST /api/v1/bookings`
- Booking appears in Partner Dashboard
- User pays via Xendit Split Payment
- PWA detects payment as PAID

❌ **Not Working:**
- Partner Dashboard shows booking status = PENDING (not LUNAS)
- Partner Dashboard revenue = 0 (not updated)

---

## Technical Details

### What PWA is Sending

When payment is confirmed, PWA calls:

```http
PATCH https://smashpartner.online/api/v1/bookings/{booking_id}
Content-Type: application/json

{
  "status": "confirmed",
  "paid_amount": 27000
}
```

**Example Booking ID:** `866D1EDB-2C9D-421F-B31F-B3653B2A9B55`
**Expected Net Revenue:** Rp 27,000 (Gross: Rp 32,000 - Platform Fee: Rp 5,000)

### Expected Partner Behavior

Upon receiving this PATCH request, Partner system should:
1. Update `bookings.status` to `"LUNAS"` or `"confirmed"`
2. Record `paid_amount` (27000) as revenue
3. Update `bookings.paid_at` timestamp

---

## Possible Root Causes

### 1. PATCH Handler Not Processing `paid_amount`
Check if your `PATCH /api/v1/bookings/:id` endpoint handler is:
- Reading the `paid_amount` field from request body
- Actually updating the database with this value
- Triggering revenue calculation logic

### 2. Field Name Mismatch
PWA sends: `paid_amount`  
Partner expects: `total_paid`? `amount_paid`? `revenue`?

**Action Required:** Confirm the exact field name your database uses.

### 3. Status String Mismatch
PWA sends: `status: "confirmed"`  
Partner expects: `status: "LUNAS"`?

**Action Required:** Check what status value triggers the "paid" state in your system.

### 4. Missing Authorization
Does the PATCH endpoint require authentication headers that PWA is not sending?

---

## Debugging Steps (For Partner AI Agent)

### Step 1: Check Server Logs
Search your Vercel/server logs for:
```
PATCH /api/v1/bookings/866D1EDB-2C9D-421F-B31F-B3653B2A9B55
```

**Questions:**
- Is the request being received?
- What's the response status code? (200? 400? 500?)
- Are there any error messages?

### Step 2: Verify PATCH Endpoint Handler
Locate your handler (likely in `app/api/v1/bookings/[id]/route.ts` or similar).

**Check:**
- Does it read `request.body.paid_amount`?
- Does it update the database with: `UPDATE bookings SET ... WHERE id = ?`?
- Does it call revenue calculation or transaction logging?

### Step 3: Test Manually
Try this in your terminal:
```bash
curl -X PATCH https://smashpartner.online/api/v1/bookings/866D1EDB-2C9D-421F-B31F-B3653B2A9B55 \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed", "paid_amount": 27000}'
```

Does revenue update in your dashboard?

---

## Proposed Solution

### Option A: Fix Field Names
If the issue is field naming, update your PATCH handler to accept:
```typescript
// app/api/v1/bookings/[id]/route.ts
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { status, paid_amount } = await req.json();
  
  await db.bookings.update({
    where: { id: params.id },
    data: {
      status: status === 'confirmed' ? 'LUNAS' : status,
      total_paid: paid_amount,  // or whatever your field is called
      paid_at: new Date()
    }
  });
  
  // Trigger revenue calculation
  await updateDailyRevenue(paid_amount);
  
  return Response.json({ success: true });
}
```

### Option B: Use Different Endpoint
If PATCH is not working, we can switch to webhook approach:
```
POST /api/webhooks/pwa-payment-confirmed
```

---

## Next Steps

**Partner AI Agent, please:**
1. Check your server logs for PATCH requests from PWA
2. Share the PATCH handler code so we can verify the logic
3. Confirm the exact field names your database uses for:
   - Payment status (`status`? `payment_status`?)
   - Paid amount (`paid_amount`? `total_paid`? `revenue`?)
4. Test the PATCH endpoint manually and report results

**Response Format:**
Please update this file or create a new file with findings:
- Log snippets showing PATCH requests
- Current PATCH handler code
- Database schema for `bookings` table
- Test results

---

**Contact:** Akmal Hasan (Owner)  
**PWA URL:** https://smashcourts.online  
**Partner API Base:** https://smashpartner.online/api/v1