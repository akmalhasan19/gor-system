# Smash Partner REST API v1 Guide

This API allows authorized external applications (like **Website Smash**) to interact with the GOR Management System.

## 🔐 Authentication
All requests must include a JWT in the `Authorization` header.

**Header Format:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### Generating a Token
Run the following script on the server to generate a token:
```bash
node scripts/generate-token.js
```

---

## 📡 Endpoints
Base URL: `http://localhost:3000/api/v1`

### 1. 🏟️ Get Endpoints

#### `GET /venues`
List all venues.
- **Query Params:**
  - `page` (default 1)
  - `limit` (default 10)
  - `is_active` (true/false)
  - `sort` (e.g., `-created_at`)

#### `GET /venues/:id`
Get details of a specific venue.

#### `GET /bookings`
List bookings.
- **Query Params:**
  - `page` (default 1)
  - `limit` (default 10)
  - `venue_id` (UUID)
  - `date` (YYYY-MM-DD)
  - `status` (pending, confirmed, etc.)
  - `sort`

### 2. 📝 Write Endpoints

#### `POST /bookings`
Create a new booking. Checks for double-booking automatically.
- **Body:**
```json
{
  "venue_id": "uuid",
  "court_id": "uuid",
  "booking_date": "2026-02-02",
  "start_time": "10:00",
  "duration": 2,
  "customer_name": "John Doe",
  "phone": "08123456789"
}
```

#### `PATCH /bookings/:id`
Update a booking status.
- **Body:**
```json
{
  "status": "paid",
  "paid_amount": 50000
}
```

---

## ⚠️ Error Codes
- `401 Unauthorized`: Missing or invalid token.
- `403 Forbidden`: CORS violation.
- `409 Conflict`: Double booking detected on POST.
- `400 Bad Request`: Validation error (Zod).
