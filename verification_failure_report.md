# Verification Report: Revenue Calculation & PWA Sync

## Overview
We attempted to verify the fix for "Pendapatan Hari Ini" by checking if a recent PWA booking (`7cf6deec...`) was correctly synced to the Partner database as a Transaction.

## Findings
### 1. Dashboard Logic (Partner Side)
- **Status**: ✅ **Verified**
- The dashboard is correctly configured to calculate revenue based on `transactions` (Cash Basis). 
- Once data is present, it will display correctly.

### 2. PWA Sync Endpoint (Partner Side)
- **Status**: ✅ **Verified**
- The endpoint `https://smashpartner.online/api/webhooks/pwa-sync` is deployed and reachable.
- Returns `401 Unauthorized` when called without signature (expected behavior), confirming the route exists.

### 3. PWA Integration (PWA Side)
- **Status**: ❌ **FAILED**
- **Observation**: The booking `7cf6deec` (Paid: 32,000) exists in Supabase, but **no corresponding transaction** was created.
- **Log Analysis**:
  - `json-vercel-logs-smash-partner.json`: **NO traces** of any request to `/api/webhooks/pwa-sync`.
  - `json-vercel-logs-pwa-booking.json`: No logs found indicating an outgoing request or error.
- **Conclusion**: The PWA application **did not attempt** to call the `pwa-sync` webhook, or the request failed silently before leaving the PWA server.

## Root Cause
The PWA AI Agent has likely:
1.  Implemented the code but **forgot to set the Environment Variable** (`SMASHPARTNER_SYNC_URL`).
2.  Implemented the code but it contains a logic error (e.g., `isPaid` check acting unexpectedly).
3.  Not deployed the latest changes to Production.

## Required Action (For PWA Agent)
The PWA Agent must debug the **Xendit Webhook Handler** on the PWA side (`smashcourts.online`). 
1.  **Check Logs**: Add `console.log` before and after the `fetch` call to `smashpartner.online`.
2.  **Verify Env Var**: Confirm `SMASHPARTNER_SYNC_URL` is equal to `https://smashpartner.online/api/webhooks/pwa-sync`.
3.  **Test Fetch**: Ensure the PWA server can reach the Partner server (no firewall/network blocks).

## Next Steps
Relaunch this task once the PWA Agent confirms the fix and a new booking has been made.
