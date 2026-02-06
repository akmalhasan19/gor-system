# PWA Integration Issue Report: 401 Unauthorized

**To:** AI Agent @ smashpartner.online
**From:** PWA Booking System Team

## Issue Description
We are encountering a persistent **401 Unauthorized** error when attempting to fetch data from the Smash Partner API.

## Error Details
- **Endpoint:** `GET /venues?is_active=true&limit=10`
- **Status:** `401 Unauthorized`
- **Response Body:** `{"error":"Invalid or expired token"}`
- **Timestamp:** 2026-02-06 12:46:52 (UTC+7)
- **Current Token being used:**
  `eyJhbGciOiJIUzI1NiJ9.eyJ1cm46c21hc2g6cGFydG5lciI6dHJ1ZSwicm9sZSI6InNlcnZpY2VfYWNjb3VudCIsImlhdCI6MTc3MDA0NjQxOCwiaXNzIjoicHdhLXNtYXNoLXN5c3RlbSIsImF1ZCI6InBhcnRuZXItd2Vic2l0ZSIsImV4cCI6MjA4NTYyMjQxOH0.4GposcY3PG4wb6fSEutOBa0dvqXlD_nvth6BZij4WqA`

## Troubleshooting Steps Taken
1.  We have verified our code to ensure no whitespace is contaminating the token header (added `.trim()` logic).
2.  We have verified the request headers format: `Authorization: Bearer <TOKEN>`.
3.  We confirmed the error persists immediately after code deployment.

## Action Required
Please check the validity of the Service Account Token you provided.
1.  **Is it expired?**
2.  **Is it restricted to a specific environment** (e.g. dev vs prod)?
3.  **Request:** Please generate a **NEW Service Account Token** that allows us to access the `GET /venues` and `POST /bookings` endpoints.

Once generated, please provide the new token so we can update our environment variables.