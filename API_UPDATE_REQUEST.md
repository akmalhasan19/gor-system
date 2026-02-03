
# 🐛 API Bug Report & Update Request: Booking Creation Fails (500 Internal Server Error)

**To:** PWA Smash AI Agent / Developer
**From:** Website Booking System Integration Team
**Severity:** Critical (Blocker)

## 🚨 The Issue
When trying to create a booking via the API endpoint `POST /bookings`, the server returns a **500 Internal Server Error** with a specific database constraint violation message.

### Error Response received:
```json
{
  "error": "null value in column \"price\" of relation \"bookings\" violates not-null constraint"
}
```

## 🔍 Diagnosis
The error indicates that the **server-side logic is trying to insert the booking into the `bookings` table but is inserting `NULL` into the `price` column**, which is not allowed.

Since the `API_IMPLEMENTATION_GUIDE.md` (Section 3.E) **does not** include a `price` field in the request payload, the server is expected to:
1.  **Calculate the price automatically** based on the `court_id`, `start_time`, and `duration`.
2.  OR, if the client is supposed to send the price, the API Documentation is incorrect and needs to be updated (though server-side calculation is safer).

### Current Payload being sent (as per documentation):
```json
{
  "venue_id": "uuid...",
  "court_id": "uuid...",
  "booking_date": "2026-02-03",
  "start_time": "10:00",
  "duration": 1, 
  "customer_name": "Web User",
  "phone": "08123456789"
}
```

## ✅ Requested Solution (Action Plan for PWA Smash Agent)

Please update the `POST /api/v1/bookings` endpoint handler in the PWA Smash backend to include the specified logic.

**Option A (Recommended - Secure): Server-Side Calculation**
Modify the API route handler to:
1.  Fetch the `Court` details using the `court_id`.
2.  Get the `hourly_rate` from the court data.
3.  Calculate `total_price = hourly_rate * duration`.
4.  Include this calculated `total_price` in the `INSERT` query to the `bookings` table.

**Option B (Alternative): Accept Price in Payload**
If you prefer the client to calculate it:
1.  Update the `bookings` table schema to allow nulls (not recommended) OR update the API schema to accept `price` in the body.
2.  **Update the Documentation** to reflect that `price` is a required field.

### Suggested Code Fix (Pseudocode for Option A)

```typescript
// Inside POST /bookings handler
const { court_id, duration, ...rest } = req.body;

// 1. Fetch Court Rate
const court = await db.courts.findUnique({ where: { id: court_id } });
if (!court) throw new Error("Court not found");

// 2. Calculate Price
const totalPrice = court.hourly_rate * duration;

// 3. Create Booking with Price
const booking = await db.bookings.create({
  data: {
    ...rest,
    court_id,
    duration,
    price: totalPrice, // <--- FIX: Ensure this is populated
    status: 'pending'
  }
});
```

Please confirm once this fix is applied so we can retry the integration test.