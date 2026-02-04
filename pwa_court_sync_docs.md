# PWA-Partner Court Sync Documentation

## Overview
The Partner Dashboard (Smash Partner Web App) now syncs court data from the PWA Smash API to its local Supabase database for booking history tracking.

## How It Works

### When a User Creates a Booking:
1. Partner App calls `smashApi.createBooking()` to PWA API (existing flow).
2. **[NEW]** Partner App checks if the `court_id` exists in its local `courts` table.
3. **[NEW]** If not found, Partner App fetches court details from the PWA response and inserts it locally.
4. Partner App inserts the booking record into its local `bookings` table.
5. User is redirected to Xendit for payment.

### Data Synced to Local `courts` Table:
| Field | Source |
|-------|--------|
| `id` | `court.id` from PWA API |
| `name` | `court.name` from PWA API |
| `description` | `venue.name` + "Synced from PWA" |
| `is_active` | `true` |

### Data Synced to Local `bookings` Table:
| Field | Source |
|-------|--------|
| `id` | Booking ID from PWA API response |
| `user_id` | Current logged-in user |
| `court_id` | Court UUID from PWA API |
| `booking_date` | User-selected date |
| `start_time` / `end_time` | User-selected times |
| `total_price` | Calculated (hourly_rate * hours + service_fee) |
| `status` | `'pending'` (updated to `'confirmed'` via Xendit webhook) |

## Why This Matters
- Partner Dashboard needs local booking history for "Riwayat Pesanan" page.
- Xendit Webhook updates booking status in local DB.
- Without local records, user history would be empty.

## No Action Required from PWA Side
This is a one-way sync (PWA → Partner). No changes needed on PWA Smash.

## Contact
If you have questions about this integration, please contact the Partner Dashboard developer.
