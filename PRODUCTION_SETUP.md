# Production Setup Guide

This guide covers the essential steps to deploy the Smash Partner GOR System to production (Vercel).

## Required Environment Variables

### 1. Application URL
```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```
**Purpose**: Base URL for the application, used for generating links and callbacks.

### 2. Supabase Configuration

#### Public Variables (Safe to expose to client)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Server-Only Variables (⚠️ KEEP SECRET!)
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
**Where to get**: Supabase Dashboard → Project Settings → API

### 3. Admin Signup Security (⚠️ REQUIRED for admin registration)

```bash
ADMIN_SIGNUP_SECRET=your_very_secure_random_string
```

**Purpose**: Protects the `/api/auth/admin-signup` endpoint in production.

**⚠️ CRITICAL**: Without this variable, the admin signup route will return `404` in production as a security measure.

**How to generate a secure secret**:
```bash
# Using OpenSSL (Mac/Linux)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or use any password generator with 32+ characters
```

**Usage**: When calling the admin signup endpoint, include this secret in headers:
```typescript
fetch('/api/auth/admin-signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-secret-key': 'your_secret_here'
  },
  body: JSON.stringify({ email, password })
})
```

### 4. Payment Integration (Xendit)

```bash
XENDIT_SECRET_KEY=xnd_production_your_key_here
XENDIT_CALLBACK_TOKEN=your_callback_token_here
```
**Where to get**: Xendit Dashboard → Settings → API Keys

### 5. WhatsApp Integration (Optional - Fonnte)

```bash
FONNTE_MASTER_TOKEN=your_fonnte_token_here
```
**Where to get**: https://fonnte.com/

---

## Deployment Checklist

### Step 1: Vercel Project Setup

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your Git repository

2. **Configure Build Settings**
   - Framework Preset: `Next.js`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

### Step 2: Add Environment Variables

1. Navigate to: **Project Settings → Environment Variables**

2. Add each variable from the list above:
   - Click "Add Variable"
   - Enter variable name
   - Enter variable value
   - Select environments: `Production`, `Preview`, `Development` (as needed)
   - Click "Save"

3. **Required for production**:
   - ✅ `NEXT_PUBLIC_APP_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `ADMIN_SIGNUP_SECRET` (if you want admin signup enabled)
   - ✅ `XENDIT_SECRET_KEY` (for payment features)
   - ✅ `XENDIT_CALLBACK_TOKEN` (for payment webhooks)

### Step 3: Deploy

1. **Initial Deployment**
   - Vercel will automatically deploy after connecting the repository
   - Wait for build to complete (~2-3 minutes)

2. **Verify Deployment**
   - Check deployment logs for any errors
   - Visit your production URL
   - Test critical features:
     - [ ] Login functionality
     - [ ] Admin signup (if enabled)
     - [ ] PWA installation
     - [ ] Payment integration
     - [ ] Database connections

### Step 4: Post-Deployment Configuration

1. **Update Supabase Allowed URLs**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel production URL to:
     - Site URL
     - Redirect URLs

2. **Update Xendit Webhook URL**
   - Go to Xendit Dashboard → Settings → Webhooks
   - Set callback URL to: `https://your-app.vercel.app/api/webhooks/xendit`

3. **Test Payment Flow**
   - Make a test transaction
   - Verify webhook callback is received
   - Check transaction status updates

---

## Troubleshooting

### Admin Signup Returns 404

**Symptom**: `/api/auth/admin-signup` returns 404 in production

**Cause**: Missing `ADMIN_SIGNUP_SECRET` environment variable

**Solution**:
1. Add `ADMIN_SIGNUP_SECRET` to Vercel environment variables
2. Redeploy the application
3. Verify the secret matches what the frontend sends in `x-admin-secret-key` header

**Alternative**: Create admin users directly via Supabase Dashboard or CLI.

### Icons Not Loading (Manifest Error)

**Symptom**: Browser console shows: `Download error or resource isn't a valid image`

**Cause**: Icon routes not properly configured for production

**Solution**:
1. Verify all icon files exist in `/public` or are dynamically generated
2. Check manifest configuration in `src/app/manifest.ts`
3. Test icon routes individually: `/icon`, `/apple-icon`, etc.

### Database Connection Failed

**Symptom**: 400/500 errors when accessing database features

**Cause**: Missing or incorrect Supabase credentials

**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Check `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Ensure your Vercel deployment URL is in Supabase allowed URLs

---

## Security Recommendations

### 🔒 Critical Security Measures

1. **Never commit `.env` files to Git**
   - Already configured in `.gitignore`
   - Double-check before pushing

2. **Rotate secrets regularly**
   - Admin signup secret
   - Service role keys
   - API keys

3. **Use different secrets for staging vs production**
   - Prevent accidental production impacts during testing

4. **Monitor webhook endpoints**
   - Set up logging for Xendit callbacks
   - Alert on suspicious activity

5. **Enable Supabase Row Level Security (RLS)**
   - Already implemented in migrations
   - Regularly audit RLS policies

### 🚨 Emergency Procedures

**If a secret is compromised:**
1. Immediately generate a new secret
2. Update environment variable in Vercel
3. Redeploy application
4. Rotate all related API keys
5. Review access logs for unauthorized usage

---

## Support

For issues with:
- **Vercel Deployment**: [Vercel Documentation](https://vercel.com/docs)
- **Supabase Setup**: [Supabase Documentation](https://supabase.com/docs)
- **Xendit Integration**: [Xendit API Docs](https://developers.xendit.co/)

For application-specific issues, refer to project documentation or contact the development team.
