# Partner Approval Flow

> **Status**: ✅ Implemented and integrated with PWA Smash API

---

## Overview

This document describes the complete partner approval/rejection flow for the Smash & Serve booking system.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WEBSITE BOOKING BADMINTON COURT                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Calon Partner → "Join Us" → Submit Application                          │
│ 2. Email ke smash.email.web@gmail.com (dengan link review)                  │
│ 3. Tim review di /admin/review/[token]                                      │
│ 4. Klik "Partner Approved" atau "Reject"                                    │
│    ├── APPROVED:                                                            │
│    │   └── Call API PWA Smash: POST /partner-invites                        │
│    │   └── Send approval email dengan invite_url                            │
│    └── REJECTED:                                                            │
│        └── Send rejection email                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PWA SMASH                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. Partner klik link → /register?token=abc123                               │
│ 6. Partner melengkapi registrasi di PWA Smash                               │
│ 7. Partner jadi user aktif di PWA Smash                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Files Modified

| File | Changes |
|------|---------|
| `src/app/partner/actions.ts` | Added `approveApplication()` and `rejectApplication()` server actions |
| `src/app/admin/review/[token]/page.tsx` | Integrated server actions with loading states, confirmation dialogs, and status updates |

---

### Server Actions

#### `approveApplication(applicationId: string)`

1. Validates application exists and is pending
2. Calls PWA Smash API: `POST /partner-invites`
   - Sends: `{ email, partner_name }`
   - Receives: `{ invite_url, token, expires_at }`
3. Updates `partner_applications.status` to `'approved'`
4. Sends approval email with:
   - Congratulations message
   - Registration link (expires in 7 days)
   - Next steps

#### `rejectApplication(applicationId: string)`

1. Validates application exists and is pending
2. Updates `partner_applications.status` to `'rejected'`
3. Sends rejection email with:
   - Professional rejection message
   - Encouragement to reapply

---

### Email Templates

Both emails use the neobrutalist design matching existing brand:
- Bold borders and shadows
- Pastel accent colors (green for approval, soft red for rejection)
- Clear CTAs and next steps

---

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SMASH_API_BASE_URL` | PWA Smash API base URL (e.g., `https://smash-partner.vercel.app/api/v1`) |
| `SMASH_API_TOKEN` | JWT token for authenticating with PWA Smash API |
| `RESEND_API_KEY` | API key for Resend email service |
| `NEXT_PUBLIC_APP_URL` | Base URL of the booking website |

---

## API Reference (PWA Smash)

### Generate Partner Invite

```
POST /partner-invites
Authorization: Bearer <SMASH_API_TOKEN>
Content-Type: application/json

{
  "email": "partner@example.com",
  "partner_name": "GOR Sejahtera"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "invite_url": "https://pwa-smash.../register?token=abc123...",
  "token": "abc123...",
  "expires_at": "2026-02-10T12:00:00Z"
}
```

- Token expires after **7 days**
- If pending invite exists, returns existing invite URL
