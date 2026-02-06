# Debugging Advice: Duplicate Booking Error

**Issue:** `Failed to save booking to local DB`
**Error Code:** `23505` (Unique Constraint Violation)
**Constraint:** `unique_booking` on `(court_id, booking_date, start_time)`

---

## 🔍 Analysis

The error indicates that **your PWA application** is trying to **INSERT** a booking into your local database, but a booking for that **same court, date, and time already exists**.

### Likely Causes

1.  **Slot Already Reserved (Pending Booking):**
    *   Many booking flows work like this: `Select Slot` -> `Create Pending Booking` -> `Pay`.
    *   If you already created a "Pending" booking when the user selected the slot, and now `CreateBooking` tries to **INSERT** a new record (instead of UPDATING the existing one), it will fail because the slot is taken by the pending booking.

2.  **Race Condition / Double Click:**
    *   The user might have clicked the "Book" button twice.
    *   The first click created the booking.
    *   The second click tried to create it again and failed.

3.  **Flow Logic Flaw:**
    *   **Current Flow (Suspected):** `Create Invoice` -> `INSERT Booking`
    *   If `INSERT` fails, you are left with an orphan Xendit Invoice but no saved booking.

---

## 🛠️ Recommended Fixes

### Fix 1: Use UPSERT (Insert or Update)

Instead of a plain `INSERT`, use an `UPSERT` logic. If the booking slot exists, update it (e.g., with the new Invoice ID).

```typescript
// Supabase Example
const { data, error } = await supabase
  .from('bookings')
  .upsert({ 
    court_id, 
    booking_date, 
    start_time,
    // ... other fields
    xendit_invoice_id: invoice.id 
  }, { 
    onConflict: 'court_id, booking_date, start_time' 
  })
```

### Fix 2: Check & Update Pattern

If you want to be stricter (only allow if it's the SAME user's pending booking):

```typescript
// 1. Check if slot is taken
const { data: existing } = await supabase
  .from('bookings')
  .select('*')
  .eq('court_id', ...)
  .eq('booking_date', ...)
  .eq('start_time', ...)
  .single();

if (existing) {
  // 2. If it's the same user and PENDING, update it
  if (existing.user_id === currentUser.id && existing.status === 'pending') {
     return await updateBooking(existing.id, { xendit_invoice_id: invoice.id });
  } else {
     throw new Error("Slot already taken by another user");
  }
} else {
  // 3. Insert new
  return await insertBooking(...);
}
```

### Fix 3: Reserve First, Then Pay

Ensure your flow is:
1.  **Reserve:** Insert Booking (Status: Pending) -> *Occupies the slot*
2.  **Pay:** Create Invoice
3.  **Update:** Update Booking with Invoice ID

If step 1 fails (Duplicate Key), tell the user "Slot unavailable".

---

**Note:** This error is happening in **your PWA's local database**, not the Partner database. You need to adjust your `createBooking` logic in the PWA code.
