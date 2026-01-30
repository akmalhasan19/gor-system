# Xendit Payment Integration Guide

This guide outlines the steps to verify the Xendit integration and the remaining setup required for it to work.

## 1. Setup Environment Variables
You must update your `.env` (or `.env.local`) file with your Xendit API keys.
If you are using Test Mode, use the Development keys.

```bash
# .env.local

# Get this from Xendit Dashboard > Settings > API Keys
XENDIT_SECRET_KEY=xnd_development_...

# Set this yourself and configure it in Xendit Dashboard Webhooks
XENDIT_CALLBACK_TOKEN=your_secure_random_token_here
```

## 2. Configure Xendit Webhooks
1. Login to Xendit Dashboard.
2. Go to **Settings > Developers > Callbacks**.
3. Set the **Callback URL** for all relevant events (Virtual Accounts, QR Codes) to:
   `https://your-domain.com/api/webhooks/xendit`
   *(For local development, use ngrok or similar to expose your localhost to the internet)*.
4. Set the **Callback Verification Token** to match `XENDIT_CALLBACK_TOKEN`.

## 3. Verify Database Migration
A new migration file `supabase/migrations/20260130130000_create_payments_table.sql` has been created.
Ensure your Supabase database has this table applied.
Use `npx supabase migration up` if using local CLI, or run the SQL content manually in Supabase SQL Editor.

## 4. Testing the Integration (POS)
1. Go to POS page.
2. Add items to cart.
3. Click "Bayar".
4. Select **"ONLINE (XENDIT)"** tab.
5. Click **"Lanjut ke Pembayaran"**.
6. The system will generate a pending transaction and show the payment interface.
7. Select **QRIS** or **Transfer (VA)**.
   - **QRIS**: Scan the QR code using Xendit Test Simulator or banking app (if production).
   - **VA**: Use the VA Number in Xendit VA Simulator to pay.
8. Once paid, the UI should automatically update to "Pembayaran Berhasil" and print the receipt.

## 5. Troubleshooting
- If Payment doesn't update: Check Webhook logs in Xendit Dashboard and your server logs.
- Ensure `XENDIT_CALLBACK_TOKEN` matches.
- Ensure your server is publicly accessible for Webhooks.
