# SoNo Codebase Summary

**Version:** 2.0 (Multi-user Debt Books)  
**Last Updated:** 2026-05-16  
**Tech Stack:** Next.js 15.5, React 19, TypeScript, Supabase (PostgreSQL), Tailwind CSS

## Overview

SoNo is a collaborative debt tracking application enabling any two users to create named debt books and manage payments with approval workflows. Unlike the previous hardcoded 2-user model (owner/sister), the new architecture is fully multi-user: any registered user can create books with other users, with dynamic role assignment (creditor/debtor) per book.

## Architecture Highlights

### 1. Database Schema (Multi-user Model)

**Core Tables:**

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User profiles (no global roles) | id, email, full_name, created_at |
| `debt_books` | Named debt containers between two users | id, name, creditor_id, debtor_id, created_at |
| `debts` | Individual debts within a book | id, book_id, creditor_id, title, amount, debt_date |
| `payments` | Payments with approval workflow | id, book_id, debtor_id, amount, receipt_url, status (pending/approved/rejected), rejection_reason, reviewed_at |

**Key Relationships:**
- `debt_books`: creditor (lender) and debtor (borrower), neither can be null
- `debts`: scoped to a book; amount always > 0
- `payments`: scoped to a book; status controls whether they count toward balance

**RLS (Row-Level Security):**
- Users can only see books where they are creditor or debtor
- Only creditors can create/update books
- Only debtors can create payments; only creditors can approve/reject
- Storage receipts: debtors upload; creditors and debtors can read their own

### 2. Application Routes

```
/                          → Redirect to /books (if auth) or /login
/login                     → Auth entry point
/books                     → List user's books (grouped: creditor/debtor)
/books/new                 → Create new book (select partner)
/books/[bookId]            → Book dashboard (summary, balance)
/books/[bookId]/debts      → List debts
/books/[bookId]/debts/new  → Add debt (creditors only)
/books/[bookId]/payments   → Payment history + approval queue
/books/[bookId]/payments/new → Submit payment (debtors only)
```

**Key Change:** Replaced `/owner` and `/sister` routes with `/books/[bookId]/` scoped routes.

### 3. Role Assignment

**Old Model:** Global role in `profiles` (owner/sister)  
**New Model:** Role derived per-book:
- **Creditor:** User who created the book (can view, create debts, approve/reject payments)
- **Debtor:** Partner added to book (can submit payments; payments require creditor approval to count)

Role is determined at query-time by comparing `auth.uid()` against `debt_books.creditor_id` or `debtor_id`.

### 4. Payment Approval Workflow

1. **Debtor submits** payment (POST `/books/[bookId]/payments/new`)
   - `status = 'pending'`, `receipt_url` optional, `created_at` recorded
   - Webhook triggers → creditor receives email notification

2. **Creditor reviews** (GET `/books/[bookId]/payments`)
   - Sees pending payments with receipt (if provided)
   - Can approve or reject with reason

3. **Approve:** `status = 'approved'`, `reviewed_at` set
   - Payment amount counted toward balance

4. **Reject:** `status = 'rejected'`, `rejection_reason` stored, `reviewed_at` set
   - Debtor notified via email
   - Payment does not count toward balance

### 5. Email Notifications

**Payment Submitted (Webhook):**
- Triggered by `payments` insert via Realtime
- Endpoint: `/api/webhooks/payment-created`
- Sent to: Creditor
- Content: debtor name, amount, note, receipt (signed URL), approval link

**Payment Rejected:**
- Triggered by `rejectPayment` server action
- Sent to: Debtor
- Content: creditor name, amount, rejection reason

## File Organization

```
app/
├── books/
│   ├── page.tsx              → List all books
│   ├── layout.tsx            → Books container layout
│   ├── loading.tsx
│   ├── new/
│   │   ├── page.tsx          → Create book form
│   │   └── actions.ts        → createBook server action
│   └── [bookId]/
│       ├── page.tsx          → Book dashboard (summary)
│       ├── layout.tsx
│       ├── error.tsx
│       ├── loading.tsx
│       ├── components/
│       │   └── book-shell.tsx → Header + nav tabs
│       ├── debts/
│       │   ├── page.tsx      → Debts list
│       │   ├── new/page.tsx  → Create debt form
│       │   ├── actions.ts    → createDebt server action
│       │   └── components/
│       │       └── debts-list.tsx
│       └── payments/
│           ├── page.tsx      → Payment history + pending queue
│           ├── new/page.tsx  → Submit payment form
│           ├── actions.ts    → createPayment, approvePayment, rejectPayment
│           └── components/
│               ├── payment-form.tsx
│               ├── payment-approval-card.tsx
│               └── payment-status-badge.tsx
├── login/
│   ├── page.tsx
│   └── actions.ts            → signIn server action
├── logout/
│   └── route.ts
├── layout.tsx                → Root layout
├── page.tsx                  → Redirect handler
├── error.tsx
├── loading.tsx
├── not-found.tsx
└── api/
    └── webhooks/
        └── payment-created/
            └── route.ts      → Email on payment submission

lib/
├── auth/
│   └── get-current-user.ts   → Current auth user + profile
├── queries/
│   ├── books.ts              → getMyBooks, getBook, getPartnerName
│   └── book-ledger.ts        → Totals, debts, payments (all/pending/mine)
├── email/
│   ├── send-payment-notification.ts   → Creditor notification
│   └── send-rejection-notification.ts → Debtor notification
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   ├── admin.ts
│   └── middleware.ts
├── format/
│   ├── currency.ts           → VND formatting
│   └── date.ts               → Date formatting
├── upload/
│   ├── upload-receipt.ts     → Receipt to storage
│   └── compress-image.ts     → Image compression
├── env.ts                    → Environment validation
└── utils.ts                  → Utilities

components/
├── ui/                       → Radix + Tailwind components
├── shell/
│   └── page-container.tsx
└── ...

supabase/
├── migrations/
│   ├── 0001_init.sql         → Old schema (hardcoded 2-user)
│   └── 0002_multi_user_books.sql → New schema (multi-user)
└── config.toml
```

## Key Query Patterns

### Get User's Books
```typescript
// lib/queries/books.ts: getMyBooks(userId)
// Returns: DebtBook[] where user is creditor OR debtor
```

### Get Book Details
```typescript
// lib/queries/books.ts: getBook(bookId)
// Returns: Single book with creditor_id, debtor_id, name
// Respects RLS: user must be member
```

### Calculate Ledger Totals
```typescript
// lib/queries/book-ledger.ts: getLedgerTotals(bookId)
// total = sum of all debts in book
// paid = sum of approved payments
// remaining = total - paid
// pendingCount = count of pending payments
```

### List Payments
```typescript
// lib/queries/book-ledger.ts:
// getAllPayments(bookId) → all payments (any status)
// getPendingPayments(bookId) → pending only (for creditor queue)
// getMyPayments(bookId, debtorId) → my submissions (for debtor history)
```

## Server Actions

| Action | File | Owner | Effect |
|--------|------|-------|--------|
| `createBook` | books/new/actions.ts | Creditor (creator) | Insert debt_book, revalidate list |
| `createDebt` | [bookId]/debts/actions.ts | Creditor | Insert debt, revalidate dashboard |
| `createPayment` | [bookId]/payments/actions.ts | Debtor | Insert payment (status='pending'), webhook triggers |
| `approvePayment` | [bookId]/payments/actions.ts | Creditor | Update status='approved', revalidate |
| `rejectPayment` | [bookId]/payments/actions.ts | Creditor | Update status='rejected', send email, revalidate |

## Authentication & Secrets

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` → Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Client-side key (public)
- `SUPABASE_SERVICE_ROLE_KEY` → Server-side admin key (secret)
- `RESEND_API_KEY` → Email service (secret)
- `WEBHOOK_SECRET` → Webhook auth header (secret)
- `NEXT_PUBLIC_APP_URL` → Public app URL (for email links)

**Auth Flow:**
1. Supabase Auth (email/password)
2. Session stored in cookies (middleware)
3. `getCurrentUser()` fetches auth.user + profiles row
4. RLS enforces data isolation

## Testing & Debugging

**Inspect Queries:**
- Use Supabase SQL Editor to query tables/policies
- Check webhook logs in Realtime dashboard

**Debug Payment Workflow:**
- Check `payments.status` (pending/approved/rejected)
- Verify `reviewed_at` timestamp on approval/rejection
- Check `rejection_reason` for rejected payments

**Email Issues:**
- Webhook logs: `console.error` in `/api/webhooks/payment-created/route.ts`
- Email logs: Resend dashboard

## Migration Path (0001 → 0002)

**0001_init.sql** (Old):
- `profiles.role` (owner/sister)
- `debts.owner_id` (no book scope)
- `payments.sister_id` (no approval)

**0002_multi_user_books.sql** (New):
1. Drop old RLS policies
2. Drop old `debts`, `payments` tables
3. Drop `profiles.role` column
4. Create `debt_books` (creditor, debtor)
5. Create new `debts` (book_id, creditor_id)
6. Create new `payments` (book_id, status, rejection_reason)
7. Create new RLS policies (per-book access)

**Data Loss:** Old debts/payments deleted; profile roles removed. No data recovery possible.

## Performance Considerations

- **Indexes:** debt_books by creditor/debtor; debts by book; payments by book/status/debtor
- **RLS:** User must be book member to query; large collections may need pagination
- **Revalidation:** `revalidatePath` on /books, /books/[bookId], /books/[bookId]/payments
- **Email:** Async webhook (non-blocking); failures logged but don't block payment creation

## Security

- **RLS:** All tables protected; no admin bypass in user queries
- **Storage:** Receipts user-namespaced (`{userId}/{filename}`)
- **Webhook:** `x-webhook-secret` header authenticated
- **Secrets:** Environment variables, never committed

---

**Related Docs:**
- [Project Overview & PDR](./project-overview-pdr.md)
- [System Architecture](./system-architecture.md)
- [Code Standards](./code-standards.md)
