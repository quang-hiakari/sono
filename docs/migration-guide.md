# SoNo Migration Guide: v1.0 → v2.0

**Version:** 2.0  
**Last Updated:** 2026-05-16  
**⚠️ WARNING:** This migration is destructive. Old data cannot be recovered.

## Overview

SoNo v2.0 represents a complete architectural redesign. The database schema changed fundamentally:

| Aspect | v1.0 | v2.0 |
|--------|------|------|
| **Role Model** | Global (owner/sister) | Per-book (creditor/debtor) |
| **Books** | Single implicit book | Multiple named books |
| **Tables** | debts, payments | debt_books, debts, payments (new structure) |
| **Payment Status** | None | pending/approved/rejected |

**Key Impact:** Old debts and payments are **deleted during migration**. User profiles are preserved.

## Pre-Migration Checklist

Before running migration, ensure:

- [ ] Production database backed up (if applicable)
- [ ] All stakeholders informed of data loss
- [ ] Users have copied important debt/payment records elsewhere
- [ ] Testing environment prepped for validation
- [ ] Supabase access available

## Migration Steps

### Step 1: Backup (Optional but Recommended)

**In Supabase SQL Editor:**

```sql
-- Export old debts (if needed)
COPY debts TO STDOUT;

-- Export old payments (if needed)
COPY payments TO STDOUT;

-- Or use Supabase dashboard: Database → Backups
```

### Step 2: Run Migration SQL

**File:** `supabase/migrations/0002_multi_user_books.sql`

**Process:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `0002_multi_user_books.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify no errors

**What the migration does:**
1. Drops old RLS policies (profiles, debts, payments, storage)
2. Drops old debts and payments tables (cascades to FK dependencies)
3. Removes `profiles.role` column
4. Creates `debt_books` table (creditor_id, debtor_id)
5. Creates new `debts` table (book_id, creditor_id)
6. Creates new `payments` table (book_id, debtor_id, status)
7. Creates new RLS policies (book-scoped access)
8. Creates storage policies for receipts

### Step 3: Verify Migration Success

**In Supabase SQL Editor, run:**

```sql
-- Check debt_books table exists
SELECT COUNT(*) FROM debt_books;  -- Should return 0

-- Check debts table has new structure
\d debts;  -- Should show: id, book_id, creditor_id, title, amount, ...

-- Check payments table has status column
\d payments;  -- Should show: id, book_id, debtor_id, amount, status, ...

-- Check profiles.role is removed
\d profiles;  -- Should NOT show role column

-- Check indexes created
SELECT * FROM pg_indexes WHERE tablename IN ('debt_books', 'debts', 'payments');
```

**Expected Results:**
- ✅ All new tables exist
- ✅ All new columns present
- ✅ All indexes created
- ✅ Old role column removed
- ✅ RLS enabled on all tables

### Step 4: Create First Test Book

1. Log in to SoNo app
2. Navigate to `/books/new`
3. Enter:
   - Book name: "Test Book"
   - Partner email: (another registered user, or create one)
4. Click "Create"
5. Verify book appears on both users' dashboards

### Step 5: Test Payment Workflow

**As Creditor:**
1. Navigate to `/books/[bookId]/debts`
2. Click "Add Debt"
3. Enter: title, amount, date
4. Verify debt appears on dashboard

**As Debtor:**
1. Navigate to `/books/[bookId]/payments/new`
2. Submit payment with amount and optional receipt
3. Verify payment status is "pending"

**As Creditor (back):**
1. Check email for payment notification
2. Navigate to `/books/[bookId]/payments`
3. Approve or reject payment
4. Verify ledger updates (paid, remaining)

## Data Recovery (Manual)

**If old data needs to be preserved:**

### Option 1: Manual Re-entry

Users can manually re-create debts and payments in the new system.

**Steps:**
1. Export old data from backup (CSV)
2. Have each user manually add debts in new system
3. Skip old payments (can't retroactively approve/reject)

### Option 2: Custom Migration Script

If you have many users with data, write a custom migration:

**Example (Python + Supabase):**

```python
import os
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Fetch all profiles
profiles = supabase.table("profiles").select("*").execute()

# For each pair of users, create a book
users = profiles.data
if len(users) >= 2:
    user1, user2 = users[0], users[1]
    book = supabase.table("debt_books").insert({
        "name": "Imported Debts",
        "creditor_id": user1["id"],
        "debtor_id": user2["id"],
    }).execute()
    
    book_id = book.data[0]["id"]
    
    # Recreate old debts (example)
    # supabase.table("debts").insert({
    #     "book_id": book_id,
    #     "creditor_id": user1["id"],
    #     "title": "...",
    #     "amount": 50000,
    #     ...
    # }).execute()

print("Migration complete")
```

This approach requires Supabase admin access and custom scripting.

### Option 3: Supabase Support

Contact Supabase support to request:
- Data export from old schema
- Custom transformation + re-import

## Post-Migration Tasks

### 1. Update Environment Variables (if needed)

Verify `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
WEBHOOK_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Test Webhook

Ensure payment submission emails work:

1. Submit a test payment (as debtor)
2. Check creditor's email inbox (and spam)
3. Verify email contains:
   - Debtor name
   - Amount
   - Receipt link (if provided)
   - Approval link

If email doesn't arrive:
- Check Resend dashboard for delivery status
- Verify `RESEND_API_KEY` is valid
- Check webhook logs in Supabase

### 3. Restart App

```bash
# Stop dev server
Ctrl+C

# Rebuild
npm run build

# Start
npm run dev
```

### 4. Clear Browser Cache

Old cached pages may show errors.

```bash
# Clear localStorage, cookies, cache
# DevTools → Application → Clear storage
```

### 5. Test All Workflows

- [ ] Sign up new user
- [ ] Create book with existing user
- [ ] Add debt (creditor)
- [ ] Submit payment (debtor)
- [ ] Approve payment (creditor)
- [ ] Reject payment (creditor)
- [ ] Verify ledger updates
- [ ] Verify emails sent

## Rollback Plan

**If migration fails:**

### Option 1: Restore from Backup

1. Go to Supabase Dashboard → Backups
2. Select pre-migration backup
3. Click "Restore"
4. Wait for restore to complete
5. Verify old tables restored

### Option 2: Revert Migration

If you have the backup data, re-apply v1.0 schema:

```sql
-- Restore from 0001_init.sql
-- (requires dropping 0002 tables first)

DROP TABLE payments CASCADE;
DROP TABLE debts CASCADE;
DROP TABLE debt_books CASCADE;

ALTER TABLE profiles ADD COLUMN role TEXT CHECK (role IN ('owner', 'sister'));

-- Recreate old tables, indexes, RLS...
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "payment" table not found | Migration incomplete | Rerun 0002_multi_user_books.sql |
| "role" column still exists | Migration didn't run | Check Supabase SQL Editor for errors |
| Book creation fails | RLS blocking | Verify `books_creditor_insert` policy exists |
| Email not sent | Webhook secret mismatch | Check `WEBHOOK_SECRET` env var |
| Old debts missing | Intentional (dropped during migration) | Manual re-entry required |

## FAQ

**Q: Can I recover old debts and payments?**

A: No. Migration drops old tables. Backup before migrating if data recovery needed.

**Q: Do user profiles get deleted?**

A: No. Only `profiles.role` column is removed. Email, full_name, created_at preserved.

**Q: How long does migration take?**

A: <1 second for typical database size (<1000 rows).

**Q: Can I run migration in production?**

A: Yes, but backup first. Migration is atomic (all-or-nothing).

**Q: What if multiple users are using the app during migration?**

A: Pause access, run migration, verify, then resume. Alternatively, migrate during low-traffic window.

**Q: Can I revert to v1.0?**

A: Only if you restore from a backup. Migration is destructive.

## Timeline

**Recommended Timeline:**

- Day 1: Announce migration to users
- Day 2: Users backup important records
- Day 3: Run migration in staging
- Day 4: Test all workflows in staging
- Day 5: Run migration in production (during low-traffic window)
- Days 6-7: Monitor logs, respond to issues

## Support

**If migration fails or data is lost:**

1. Check Supabase logs: Dashboard → Logs → Recent Events
2. Review SQL Editor history for errors
3. Contact Supabase support: https://supabase.com/support
4. Open GitHub issue: Include error messages, SQL executed

---

**Related Docs:**
- [Project Overview & PDR](./project-overview-pdr.md) — v1.0 vs v2.0 comparison
- [Codebase Summary](./codebase-summary.md) — Database schema details
- [System Architecture](./system-architecture.md) — New architecture overview
