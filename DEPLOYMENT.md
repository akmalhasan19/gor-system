# Deployment Guide - GOR System

Complete guide for deploying the GOR System to Vercel.

## Prerequisites

Before deploying, ensure you have:

- ✅ A [Vercel account](https://vercel.com/signup) (free tier works)
- ✅ A [Supabase project](https://supabase.com) with the database migrations applied
- ✅ Your Supabase credentials ready (URL, anon key, service role key)
- ✅ Git repository pushed to GitHub/GitLab/Bitbucket

## Step 1: Prepare Your Repository

1. **Verify `.gitignore`** - Ensure `.env*` files are ignored (already configured)
2. **Commit changes**:
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Configure your project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. Click **"Deploy"** (don't worry about environment variables yet)

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts and link to your project
```

## Step 3: Configure Environment Variables

> [!IMPORTANT]
> Your initial deployment will fail without environment variables. This is expected!

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables for **all environments** (Production, Preview, Development):

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your Vercel deployment URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/api) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Supabase Dashboard → Settings → API → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Supabase Dashboard → Settings → API → Project API keys → `service_role` (⚠️ **Keep this secret!**) |

4. **Important**: After adding variables, click **"Redeploy"** on your latest deployment

## Step 4: Apply Database Migrations

Ensure your Supabase database has all the necessary tables and functions:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Run all migration files from `supabase/migrations/` in order:
   - `20260127_create_shifts.sql`
   - `20260127_get_shift_totals.sql`
   - And any other migration files

> [!TIP]
> You can also use the Supabase CLI to apply migrations:
> ```bash
> supabase db push
> ```

## Step 5: Verify Deployment

1. Visit your production URL: `https://your-app.vercel.app`
2. Test the following:
   - ✅ Login page loads correctly
   - ✅ User authentication works
   - ✅ Database connection is successful
   - ✅ Public schedule page works: `/public/schedule`
   - ✅ All features function as expected

## Post-Deployment Configuration

### Custom Domain (Optional)

1. Go to **Settings** → **Domains** in Vercel
2. Add your custom domain (e.g., `gor.yourdomain.com`)
3. Update `NEXT_PUBLIC_APP_URL` environment variable to your custom domain
4. Redeploy

### Environment-Specific Variables

If you need different values for Preview vs Production:

1. In Vercel Dashboard → **Environment Variables**
2. Uncheck environments you don't want the variable in
3. Add separate variables for each environment

## Troubleshooting

### Build Fails

**Error**: `Missing environment variables`
- **Solution**: Add all required environment variables in Vercel Dashboard, then redeploy

**Error**: `Module not found` or dependency issues
- **Solution**: Ensure `package.json` is up to date and pushed to Git
- Try: Delete `node_modules` and `.next`, then commit and redeploy

### Runtime Errors

**Error**: `Failed to connect to Supabase`
- **Solution**: Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project is not paused (free tier auto-pauses after inactivity)

**Error**: `Unauthorized` or `Permission denied`
- **Solution**: Check Row Level Security (RLS) policies in Supabase
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly for server-side operations

### Performance Issues

- **Slow initial load**: Consider enabling Edge Functions or upgrading Vercel plan
- **Region latency**: Vercel is configured to deploy to Singapore (`sin1`). Change in `vercel.json` if needed

## Continuous Deployment

Vercel automatically redeploys when you push to your Git repository:

- **Production**: Pushes to `main` branch → Production deployment
- **Preview**: Pushes to other branches → Preview deployment

## Security Checklist

Before going live:

- [ ] Verify `.env` is in `.gitignore` and not committed
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is only in Vercel (never in client code)
- [ ] Supabase RLS policies are properly configured
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Test authentication flows thoroughly
- [ ] Review Supabase usage and set up billing alerts

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Supabase Documentation](https://supabase.com/docs)

---

**Need Help?** Check Vercel deployment logs for detailed error messages: Project → Deployments → Click deployment → View Function Logs
