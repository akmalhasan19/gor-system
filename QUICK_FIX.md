# 🚀 Fix Production Error - Quick Guide

## Problem
- ❌ 404 error on `/api/auth/admin-signup`
- ⚠️ Apple icon manifest error

## Solution: Add Missing Environment Variable

### Step 1: Generate Secure Secret

Run this command to generate a secure random string:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or use this as a temporary value:
```
smash-prod-admin-2026-secure-xyz-789
```

### Step 2: Add to Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project: **smash-partner** (or your deployment)
3. Go to: **Settings** → **Environment Variables**
4. Click **"Add Variable"**
5. Add:
   - **Name**: `ADMIN_SIGNUP_SECRET`
   - **Value**: (paste the generated secret)
   - **Environments**: Check ✅ **Production**
6. Click **Save**

### Step 3: Redeploy

1. Go to: **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete (~2 minutes)

### Step 4: Verify

1. Visit your production URL
2. Try to create admin account
3. Should work now! ✅

---

## Why This Happened

The `/api/auth/admin-signup` route is **intentionally disabled in production** when the `ADMIN_SIGNUP_SECRET` environment variable is missing. This is a security feature to prevent unauthorized admin account creation.

The code checks:
```typescript
if (!IS_DEV && !MASTER_SECRET) {
    // Return 404 - route disabled
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
```

---

## Apple Icon Issue

The apple-icon error is likely a side effect. After adding the environment variable and redeploying, check if it's resolved. If not:

1. Clear browser cache
2. Check manifest at: `https://your-app.vercel.app/manifest.webmanifest`
3. Verify icon loads at: `https://your-app.vercel.app/apple-icon`

---

## Need More Details?

See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for complete deployment guide.
