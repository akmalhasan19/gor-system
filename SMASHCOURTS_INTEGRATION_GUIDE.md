# SmashCourts API Integration Guide

This guide details the API endpoints available for external software to connect with the SmashCourts platform. The API allows partners and third-party applications to manage bookings, view venues, check availability, and synchronize payment usage.

---

## 🔐 Authentication

### Partner API (v1)
All requests to `/api/v1/*` must be authenticated using a **Bearer Token (JWT)**.

- **Header:** `Authorization: Bearer <YOUR_JWT_TOKEN>`
- **Security:** Tokens are signed using the `API_JWT_SECRET`.
- **CORS:** Requests directly from browsers must originate from allowed domains (e.g., `WEBSITE_SMASH_URL`). Server-to-server requests are not subject to CORS restricted origins if no `Origin` header is sent.

### Webhooks
Webhooks (e.g., for payment sync) use **HMAC-SHA256 Signature Verification**.

- **Header:** `x-pwa-signature`
- **Verification:** The signature is a hex digest of the request body signed with `PWA_WEBHOOK_SECRET`.

### Public API
Public endpoints (`/api/public/*`) do not require authentication but are subject to **Rate Limiting**.

---

## 🌐 Base URLs

- **Production:** `https://smashpartner.online/api`
- **Staging/Dev:** `http://localhost:3000/api` (Local)

---

## 🚀 Partner API Resources (v1)

Base Path: `/v1`

### 1. 🏟️ Venues

#### Get All Venues
Retrieve a paginated list of venues.

- **Endpoint:** `GET /v1/venues`
- **Query Parameters:**
  - `page` (int, default: 1): Page number.
  - `limit` (int, default: 10): Items per page.
  - `is_active` (boolean): Filter by active status.
  - `sort` (string): Sort column (prefix with `-` for descending, e.g., `-created_at`).

#### Get Venue Courts
Retrieve a list of courts for a specific venue.

- **Endpoint:** `GET /v1/venues/{id}/courts`
- **Response:** Array of court objects (id, name, hourly_rate, etc.).

#### Get Venue Availability
Get availability grid for a specific date.

- **Endpoint:** `GET /v1/venues/{id}/availability`
- **Query Parameters:**
  - `date` (required): Format `YYYY-MM-DD`
- **Response:**
  ```json
  {
    "data": {
      "venue_id": "...",
      "date": "2024-03-20",
      "operating_hours": { "start": 8, "end": 22 },
      "courts": [
        {
          "court_id": "...",
          "court_name": "Court A",
          "slots": [
            { "time": "08:00", "available": true, "price": 50000, "status": "available" },
            { "time": "09:00", "available": false, "status": "booked" }
          ]
        }
      ]
    }
  }
  ```

### 2. 📅 Bookings

#### List Bookings
Retrieve a list of bookings.

- **Endpoint:** `GET /v1/bookings`
- **Query Parameters:**
  - `page`, `limit`
  - `venue_id`: Filter by venue.
  - `date`: Filter by date (`YYYY-MM-DD`).
  - `status`: Filter by status (`pending`, `confirmed`, `LUNAS`, `cancelled`).
  - `sort`: Sort order.

#### Create Booking
Create a new booking. Checks availability and calculates price automatically.

- **Endpoint:** `POST /v1/bookings`
- **Body (`application/json`):**
  ```json
  {
    "venue_id": "uuid",
    "court_id": "uuid",
    "booking_date": "YYYY-MM-DD",
    "start_time": "HH:MM",
    "duration": 1, // Hours (integer)
    "customer_name": "John Doe",
    "phone": "08123456789"
  }
  ```
- **Response (201 Created):** Returns created booking object.
- **Errors:**
  - `409 Conflict`: Time slot already booked.
  - `400 Bad Request`: Validation failure.

#### Update Booking
Update booking status or payment details.

- **Endpoint:** `PATCH /v1/bookings/{id}`
- **Body (`application/json`):**
  ```json
  {
    "status": "LUNAS", // Options: confirmed, LUNAS, DP, cancelled
    "paid_amount": 50000, // Optional: if omitted during 'LUNAS', defaults to full price
    "price": 50000 // Optional override
  }
  ```

---

## 📡 Webhooks

### PWA Payment Sync
Synchronize booking payment status from external PWA.

- **Endpoint:** `POST /webhooks/pwa-sync`
- **Headers:** `x-pwa-signature: <HMAC_SHA256>`
- **Body:**
  ```json
  {
    "event": "booking.paid",
    "booking_id": "uuid",
    "status": "LUNAS",
    "paid_amount": 50000,
    "payment_method": "QRIS",
    "timestamp": "ISO_STRING"
  }
  ```

---

## 🌍 Public API (Client Facing)

Base Path: `/public`

- **`GET /public/courts`**: List all active courts with venue details.
- **`POST /public/bookings`**: Create a public booking (simplified version of v1).
- **`POST /public/auto-cancel`**: Trigger auto-cancellation of unpaid bookings (Requires `venueId` in body).

---

## ⚠️ Error Handling

The API uses standard HTTP status codes:

- `200/201`: Success
- `400`: Bad Request (Validation Error)
- `401`: Unauthorized (Invalid Token/Signature)
- `403`: Forbidden (CORS or Scope)
- `404`: Not Found
- `409`: Conflict (Double Booking)
- `429`: Too Many Requests (Rate Limit Exceeded)
- `500`: Internal Server Error