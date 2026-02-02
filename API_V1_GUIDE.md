# Smash Partner API Integration Guide

**Target Audience:** Developers of the *Website Badminton Court Booking System*.
**Purpose:** Instructions on how to connect your booking website to the GOR Management System (PWA Smash).

---

## 🚀 1. Configuration (Environment Variables)

In your Booking Website project (e.g., Next.js), add these to your `.env` or Vercel Project Settings:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SMASH_API_BASE_URL` | The URL of the deployed PWA Smash. **Must use HTTPS**. | `https://pwa-smash.vercel.app/api/v1` |
| `SMASH_API_TOKEN` | The long JWT token generated from PWA Smash. | `eyJhbGciOiJIUz...` |

> **⚠️ Security Note:** Do not expose `SMASH_API_TOKEN` to the browser (client-side) if possible. Use Next.js API Routes (Server Components) to proxy requests to this API to keep the token hidden.

---

## 🔐 2. Authentication

All requests to the smash partner API must be authenticated.

*   **Method:** Bearer Token
*   **Header:** `Authorization: Bearer <YOUR_SMASH_API_TOKEN>`

**Example Request (Node.js/Fetch):**
```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_SMASH_API_BASE_URL}/venues`, {
  headers: {
    'Authorization': `Bearer ${process.env.SMASH_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 📡 3. Key Endpoints for Booking System

### A. Get Available Venues
Display list of venues on your homepage. Now includes photo and total courts.

*   **Endpoint:** `GET /venues`
*   **Query Params:**
    *   `is_active=true` (Filter for open venues)
    *   `limit=10`
*   **Response Codes:** `200 OK`
*   **Example Response:**
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "name": "GOR Badminton Center",
          "address": "Jl. Olahraga No. 123",
          "photo_url": "https://.../venue-photos/uuid.jpg", 
          "courts_count": 3,
          "operating_hours_start": 8,
          "operating_hours_end": 23,
          "booking_tolerance": 15
        }
      ]
    }
    ```

### B. Get Venue Details (with Courts)
Fetch detailed information about a specific venue, including its list of courts.

*   **Endpoint:** `GET /venues/:id`
*   **Response Codes:** `200 OK`
*   **Example Response:**
    ```json
    {
      "data": {
        "id": "uuid",
        "name": "GOR Badminton Center",
        "photo_url": "https://...",
        "courts": [
          {
            "id": "court_uuid_1",
            "name": "Lapangan 1",
            "court_number": 1,
            "hourly_rate": 50000
          }
        ]
      }
    }
    ```

### C. Get Courts Details Only
Specifically fetch just the courts for a venue, useful for pricing pages.

*   **Endpoint:** `GET /venues/:id/courts`
*   **Response Codes:** `200 OK`
*   **Example Response:**
    ```json
    {
      "data": [
        {
          "id": "court_uuid_1",
          "name": "Lapangan 1",
          "is_active": true,
          "hourly_rate": 50000
        }
      ]
    }
    ```

### D. Check Availability (Real-time)
Check which slots are available for a specific date across all courts in a venue.

*   **Endpoint:** `GET /venues/:id/availability`
*   **Query Params:**
    *   `date` (Required): `YYYY-MM-DD`
*   **Response Codes:** `200 OK`
*   **Example Response:**
    ```json
    {
      "data": {
        "venue_id": "uuid",
        "date": "2026-02-02",
        "operating_hours": { "start": 8, "end": 23 },
        "courts": [
          {
            "court_id": "court_uuid_1",
            "court_name": "Lapangan 1",
            "slots": [
              { "time": "08:00", "available": true, "price": 50000 },
              { "time": "09:00", "available": false, "status": "confirmed" }
            ]
          }
        ]
      }
    }
    ```

### E. Create Booking
When a user finishes payment on your website.

*   **Endpoint:** `POST /bookings`
*   **Payload:**
    ```json
    {
      "venue_id": "uuid",
      "court_id": "uuid",
      "booking_date": "2026-02-02",
      "start_time": "10:00",
      "duration": 1, 
      "customer_name": "User Name",
      "phone": "0812..."
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "success": true,
      "data": { "id": "booking_uuid", "status": "pending" }
    }
    ```

### F. Update Booking Status (Payment Confirmation)
Update payment status or confirm a booking after payment gateway success.

*   **Endpoint:** `PATCH /bookings/:id`
*   **Payload:**
    ```json
    {
      "status": "confirmed", // or "paid"
      "paid_amount": 50000
    }
    ```
*   **Response Codes:** `200 OK`

---

## ⚠️ Common Errors

| Code | Meaning | Solution |
| :--- | :--- | :--- |
| `401` | **Unauthorized** | Check your `SMASH_API_TOKEN`. |
| `403` | **Forbidden** | Check CORS (Origin) or Invalid Token. |
| `404` | **Not Found** | Wrong Endpoint URL or Venue/Booking ID. |
| `409` | **Conflict** | Slot already double-booked. |