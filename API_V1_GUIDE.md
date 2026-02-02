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
Display list of venues on your homepage.

*   **Endpoint:** `GET /venues`
*   **Query Params:**
    *   `is_active=true` (Always use this to show only open venues)
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
          "operating_hours_start": 8,
          "operating_hours_end": 23,
          "booking_tolerance": 15
        }
      ]
    }
    ```

### B. Check Availability (Get Bookings)
Before allowing a user to book, check which slots are already taken.

*   **Endpoint:** `GET /bookings`
*   **Query Params:**
    *   `venue_id`: (Required) ID of the venue.
    *   `date`: (Required) Format `YYYY-MM-DD`.
    *   `status`: (Optional) Filter by status (e.g., `confirmed`).
*   **Response Codes:** `200 OK`
*   **Logic:**
    1.  Fetch existing bookings for the selected date.
    2.  Compare with Venue `operating_hours` + `courts`.
    3.  Disable slots that are already in the response.

### C. Create Booking
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
*   **Error (409 Conflict):** If someone else booked the slot while user was paying. Handle this gracefully!

---

## ⚠️ Common Errors

| Code | Meaning | Solution |
| :--- | :--- | :--- |
| `401` | **Unauthorized** | Check your `SMASH_API_TOKEN`. |
| `403` | **Forbidden** | Check CORS (Origin) or Invalid Token. |
| `404` | **Not Found** | Wrong Endpoint URL or Venue ID. |
| `409` | **Conflict** | Slot already double-booked. |