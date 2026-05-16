# SoNo Deployment & Setup Guide

**Version:** 2.0  
**Last Updated:** 2026-05-16

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+ (use `node --version` to check)
- npm or pnpm (recommended: pnpm)
- Supabase account (free tier available)
- Resend account (free tier available)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/sono.git
cd sono
```

### 2. Install Dependencies

```bash
pnpm install
# or: npm install
```

### 3. Set Up Supabase Project

**Create new project:**

1. Go to https://supabase.com → Sign in
2. Click "New project"
3. Fill in project details:
   - Name: "sono-dev" (or any name)
   - Password: Generate strong password
   - Region: Closest to you
4. Click "Create new project"
5. Wait for project to initialize (2-3 minutes)

**Get credentials:**

1. Project → Settings → API
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 4. Run Database Migrations

**Option A: Supabase Dashboard (Recommended)**

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire contents of `supabase/migrations/0001_init.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Repeat with `supabase/migrations/0002_multi_user_books.sql`

**Option B: Supabase CLI**

```bash
# Install CLI (if not already)
npm install -g supabase

# Initialize local project
supabase init

# Link to remote project
supabase link

# Run migrations
supabase db push
```

**Verify:**

In SQL Editor, run:

```sql
SELECT * FROM information_schema.tables WHERE table_schema = 'public';
```

Should show: `profiles`, `debt_books`, `debts`, `payments`

### 5. Set Up Email Service (Resend)

**Create Resend account:**

1. Go to https://resend.com → Sign up
2. Verify email
3. Go to API Keys
4. Create new API key
5. Copy API key → `RESEND_API_KEY`

### 6. Create Environment File

**Create `.env.local` in project root:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email
RESEND_API_KEY=re_...

# Webhooks
WEBHOOK_SECRET=dev_secret_change_in_prod

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important:**
- Never commit `.env.local` to git
- Use strong `WEBHOOK_SECRET` in production
- Keep `SUPABASE_SERVICE_ROLE_KEY` private

### 7. Set Up Supabase Storage (Receipts)

**Create bucket:**

1. Supabase Dashboard → Storage → Buckets
2. Click "New bucket"
3. Name: `receipts`
4. Public: OFF (keep private)
5. Click "Create bucket"

**Create RLS policies:**

In SQL Editor, paste and run:

```sql
-- Already created by 0002_multi_user_books.sql
-- Verify policies exist:
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

Should show:
- `receipts_debtor_upload` — Debtors can upload to own folder
- `receipts_member_read` — Creditors/debtors can read receipts

### 8. Configure Webhook (Supabase Realtime)

**Enable Realtime:**

1. Supabase Dashboard → Database → Replication
2. Enable for `payments` table:
   - Toggle "Realtime" ON
   - Select: `INSERT` (only)

**Webhook URL:**

Set in your deployment platform (Vercel, etc.):
- Webhook URL: `https://your-app.com/api/webhooks/payment-created`
- Secret: `process.env.WEBHOOK_SECRET`

**For local testing:**

Use a tunnel (ngrok, localtunnel) to expose localhost:

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3000

# Copy https URL from ngrok output
# Use as NEXT_PUBLIC_APP_URL in .env.local
```

### 9. Start Development Server

```bash
pnpm dev
# or: npm run dev

# App runs at http://localhost:3000
```

### 10. Test Signup & Login

1. Open http://localhost:3000
2. Click "Login"
3. Sign up with email
4. Verify email (check inbox or Supabase Auth logs)
5. Logged in → Dashboard at `/books`

## Production Deployment

### Hosting Options

| Platform | Setup | Cost | Pros |
|----------|-------|------|------|
| **Vercel** (Recommended) | Git push | Free tier | Zero config, automatic deploys |
| **Netlify** | Git push | Free tier | Similar to Vercel |
| **AWS Lambda** | Manual | Pay per request | More control, overkill for small apps |
| **Self-hosted** (VPS) | Docker/PM2 | ~$5-20/month | Full control, more work |

### Deploy to Vercel (Recommended)

**Steps:**

1. Push code to GitHub:

```bash
git remote add origin https://github.com/your-org/sono.git
git push -u origin main
```

2. Go to https://vercel.com → Sign in → "New Project"
3. Select your GitHub repo
4. Click "Import"
5. Configure environment variables:
   - Add all variables from `.env.local`
   - **⚠️ Never include `.env` file itself**
6. Click "Deploy"
7. Wait for build to complete

**Custom domain:**

1. Vercel Dashboard → Project → Settings → Domains
2. Add custom domain (e.g., `sono.example.com`)
3. Update DNS records (Vercel provides instructions)
4. Update `NEXT_PUBLIC_APP_URL` to custom domain

### Configure Webhooks (Production)

**Update Supabase Realtime:**

1. Supabase Dashboard → Database → Replication
2. For `payments` table, verify Realtime enabled
3. In your app, webhook URL is: `https://your-domain.com/api/webhooks/payment-created`

**Test webhook:**

1. Create test payment (as debtor)
2. Check creditor's email
3. If no email, check:
   - Resend dashboard for errors
   - Supabase logs for webhook trigger
   - Console output for exceptions

### Database Backup (Production)

**Supabase backups:**

1. Dashboard → Settings → Backups
2. Enable daily backups (automatic)
3. Or manual backup: "Back up now"
4. Restore from backup if needed

### Monitoring & Logging

**Supabase Logs:**

1. Dashboard → Logs → Recent Events
2. Filter by table (payments, debts, etc.)
3. Look for RLS violations, errors

**Vercel Logs:**

1. Vercel Dashboard → Project → Deployments
2. Click latest deployment
3. View build and runtime logs

**Email Logs (Resend):**

1. Resend Dashboard → Emails
2. See delivery status, bounces, clicks

## Configuration Reference

### Environment Variables

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | `https://xxx.supabase.co` | From Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | `eyJ...` | Anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | `eyJ...` | Service role (secret) — webhooks only |
| `RESEND_API_KEY` | ✅ | `re_...` | From Resend → API Keys |
| `WEBHOOK_SECRET` | ✅ | Random string | Use strong random value |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://sono.example.com` | Your app's public URL |

### Supabase Auth Configuration

**Email templates (optional):**

1. Dashboard → Authentication → Email Templates
2. Customize signup/password reset emails
3. Update confirmation URL if needed

**OAuth (future):**

1. Dashboard → Authentication → Providers
2. Add Google, GitHub, etc. (not required for v2.0)

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"

```bash
pnpm install @supabase/supabase-js
```

### "SUPABASE_URL is not set"

Check `.env.local` exists and has correct variables:

```bash
cat .env.local | grep SUPABASE_URL
```

If empty, add to `.env.local` and restart dev server.

### "RLS policy violation"

Likely your user isn't a book member. Check:

```sql
SELECT * FROM debt_books WHERE id = 'book-id';
-- Should show book with your user_id as creditor_id or debtor_id
```

### "Email not sending"

1. Check Resend API key is valid
2. Check Resend dashboard for bounces
3. Verify creditor email is correct
4. Check webhook endpoint logs

### "Webhook not triggering"

1. Verify Realtime enabled on `payments` table
2. Check webhook URL is correct in your deployment
3. Verify `WEBHOOK_SECRET` matches in app
4. Check Supabase webhook logs

## Development Workflow

### Local Setup

```bash
# Install deps
pnpm install

# Start dev server
pnpm dev

# Run linter
pnpm lint

# Build (test production build)
pnpm build
pnpm start
```

### Testing Payments (Local)

1. Create two test users
2. User A: Create book with User B
3. User A: Add debt
4. User B: Submit payment
5. Check User A's email (Resend test mode)
6. User A: Approve/reject payment

### Database Changes

1. Create migration: `supabase/migrations/XXXX_description.sql`
2. Test locally (SQL Editor or CLI)
3. Run migrations (Supabase Dashboard or CLI)
4. Commit and push

## Scaling

### Current Limits

- **Users:** <100 (free Supabase tier)
- **Books:** <10,000 (comfortable)
- **Payments:** <100,000 (comfortable)

### When to Upgrade

| Metric | Free Tier | Pro Tier |
|--------|-----------|----------|
| Storage | 1 GB | 8 GB |
| Bandwidth | 2 GB/month | 50 GB/month |
| Concurrent Users | ~100 | >1000 |
| Cost | Free | $25/month |

Upgrade in Supabase Dashboard → Settings → Billing.

### Performance Optimization

- Add pagination to `/books` if users have >50 books
- Add pagination to `/books/[bookId]/payments` if >1000 payments
- Optimize images before upload (already done with `compressImage()`)

## Security Checklist

- [ ] `.env.local` not committed to git
- [ ] `WEBHOOK_SECRET` is strong random string
- [ ] `SUPABASE_SERVICE_ROLE_KEY` kept secret
- [ ] Storage bucket is private (not public)
- [ ] RLS policies enabled on all tables
- [ ] Backups automated daily
- [ ] SSL/TLS enabled (automatic with Vercel/Supabase)

## Disaster Recovery

### Data Loss

1. Restore from Supabase backup
2. Contact Supabase support if issue

### Compromised Keys

1. Rotate all keys in Supabase → Settings → API
2. Update environment variables
3. Redeploy app

### Email Service Down

1. Users can still use app
2. Payments accepted (email is best-effort)
3. Check Resend status page

---

**Related Docs:**
- [Code Standards](./code-standards.md) — Environment variables section
- [System Architecture](./system-architecture.md) — Security & monitoring
- [Migration Guide](./migration-guide.md) — Upgrading from v1.0
