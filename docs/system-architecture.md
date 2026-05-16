# SoNo System Architecture

**Version:** 2.0 (Multi-user Debt Books)  
**Last Updated:** 2026-05-16

## System Overview

SoNo is a multi-user debt tracking platform where any two registered users can create named debt books and manage payments with creditor approval workflows.

### High-Level Flow

```
User Registration
  ↓
Authentication (Supabase Auth)
  ↓
Dashboard (/books)
  ├─ Create Book (/books/new)
  ├─ View Books (grouped: creditor/debtor)
  └─ Select Book → Book Dashboard (/books/[bookId])
      ├─ Debts tab → View/Create debts (creditor only)
      ├─ Payments tab → View/Submit payments, approval queue
      └─ Summary → Totals, balance, pending count
```

## Component Architecture

### 1. Frontend Layer

**Technology:** React 19 (Server Components), Next.js 15.5, TypeScript, Tailwind CSS

**Key Components:**

| Component | Purpose | Location |
|-----------|---------|----------|
| `books/page.tsx` | List all user books (creditor/debtor grouped) | app/books/page.tsx |
| `BookCard` | Individual book preview | app/books/page.tsx |
| `BookShell` | Book container (header, nav tabs) | app/books/[bookId]/components/book-shell.tsx |
| `DebtsList` | View/filter debts | app/books/[bookId]/debts/components/debts-list.tsx |
| `PaymentForm` | Submit payment (debtor) | app/books/[bookId]/payments/components/payment-form.tsx |
| `PaymentApprovalCard` | Review/approve/reject (creditor) | app/books/[bookId]/payments/components/payment-approval-card.tsx |
| `PaymentStatusBadge` | Status indicator (pending/approved/rejected) | app/books/[bookId]/payments/components/payment-status-badge.tsx |

**Data Patterns:**
- Server Components for data fetching (no client-side queries)
- Server Actions for mutations (createPayment, approvePayment, rejectPayment)
- Revalidation via `revalidatePath` on mutations
- Form submission via FormData (Zod validation server-side)

### 2. Backend Layer

**Technology:** Next.js API routes, TypeScript, Supabase SDK

**Key Server Actions:**

```typescript
// Book Management
createBook(formData) → insert debt_books, revalidate /books

// Debt Management (creditor only)
createDebt(bookId, formData) → insert debts, revalidate dashboard

// Payment Management
createPayment(bookId, formData) → insert payments (status='pending'), webhook fires
approvePayment(bookId, paymentId) → update status='approved', revalidate
rejectPayment(bookId, paymentId, reason) → update status='rejected', send email, revalidate
```

**Key Queries:**

```typescript
// Current user
getCurrentUser() → auth.user + profiles row

// Book data
getMyBooks(userId) → debt_books where user is creditor or debtor
getBook(bookId) → single debt_book (RLS-protected)
getPartnerName(book, userId) → opposite party's name

// Ledger calculations
getLedgerTotals(bookId) → {total, paid, remaining, pendingCount}
getDebts(bookId) → all debts
getAllPayments(bookId) → all payments (any status)
getPendingPayments(bookId) → pending only (for creditor queue)
getMyPayments(bookId, debtorId) → my submissions
```

### 3. Database Layer

**Technology:** Supabase (PostgreSQL), Row-Level Security (RLS)

**Core Tables:**

```sql
-- Profiles (user directory)
profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ
)

-- Debt Books (container, defines creditor/debtor)
debt_books (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  creditor_id UUID (references profiles),
  debtor_id UUID (references profiles),
  created_at TIMESTAMPTZ
)

-- Debts (book-scoped, creditor-only write)
debts (
  id UUID PRIMARY KEY,
  book_id UUID (references debt_books),
  creditor_id UUID (references profiles),
  title TEXT NOT NULL,
  amount NUMERIC(12,2),
  notes TEXT,
  debt_date DATE,
  created_at TIMESTAMPTZ
)

-- Payments (book-scoped, multi-status)
payments (
  id UUID PRIMARY KEY,
  book_id UUID (references debt_books),
  debtor_id UUID (references profiles),
  amount NUMERIC(12,2),
  receipt_url TEXT,
  note TEXT,
  status TEXT ('pending'|'approved'|'rejected'),
  rejection_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

**RLS Policies:**

| Table | Policy | Condition |
|-------|--------|-----------|
| profiles | SELECT any | User is authenticated |
| debt_books | SELECT | User is creditor or debtor |
| debt_books | INSERT/UPDATE/DELETE | User is creditor |
| debts | SELECT | User is book member (creditor/debtor) |
| debts | INSERT/UPDATE/DELETE | User is creditor |
| payments | SELECT | User is book member |
| payments | INSERT | User is debtor of book |
| payments | UPDATE | User is creditor (for approval) |

**Indexes:**
- `debt_books(creditor_id)`, `debt_books(debtor_id)`
- `debts(book_id, created_at DESC)`
- `payments(book_id, created_at DESC)`, `payments(book_id, status)`, `payments(debtor_id, created_at)`

### 4. Authentication Layer

**Technology:** Supabase Auth (email/password), Next.js Middleware

**Flow:**

1. **Sign Up/Login** → Supabase Auth (magic link or email/password)
2. **Session** → Stored in httpOnly cookie (Supabase SSR middleware)
3. **Middleware** (`middleware.ts`) → Refresh session, set cookies
4. **Protected Routes** → Redirect unauthenticated users to `/login`
5. **Current User** → `getCurrentUser()` fetches auth.user + profiles row

**Key Functions:**

```typescript
// lib/auth/get-current-user.ts
getCurrentUser() → { user, profile } | null
```

### 5. Email Notification Layer

**Technology:** Resend (email service), Supabase Realtime webhooks

**Payment Submitted Workflow:**

1. Debtor creates payment (POST → server action)
2. Server action inserts row → Realtime fires insert event
3. Webhook endpoint: `/api/webhooks/payment-created`
4. Webhook verifies `x-webhook-secret` header
5. Fetches payment + creditor email
6. Sends email via Resend → creditor
7. Email contains: debtor name, amount, receipt (signed URL), approval link

**Payment Rejected Workflow:**

1. Creditor rejects payment (server action)
2. Server action fetches debtor email
3. Calls `sendRejectionNotification()`
4. Sends email via Resend → debtor
5. Email contains: creditor name, amount, rejection reason

**Email Functions:**

```typescript
// lib/email/send-payment-notification.ts
sendPaymentNotification({ to, debtorName, amount, note, receiptUrl, approvalUrl })

// lib/email/send-rejection-notification.ts
sendRejectionNotification({ to, creditorName, amount, reason, dashboardUrl })
```

### 6. Storage Layer

**Technology:** Supabase Storage (bucket: `receipts`)

**Upload Flow:**

1. User selects receipt image (payment form)
2. Image compressed via `compressImage()` (quality: 0.7, max 100x100px)
3. Uploaded to `receipts/{userId}/{filename}`
4. URL stored in `payments.receipt_url`

**RLS for Receipts:**

- Debtors can upload to their own folder
- Creditors can read debtors' receipts for approvals
- Debtors can read their own receipts

**Helper Functions:**

```typescript
// lib/upload/upload-receipt.ts
uploadReceipt(file, userId)

// lib/upload/compress-image.ts
compressImage(file, quality, maxSize)
```

## Data Flow Diagrams

### Payment Approval Flow

```
Debtor                          System                          Creditor
  │                               │                               │
  ├─ Submit Payment               │                               │
  │  (FormData: amount,           │                               │
  │   note, receipt)              │                               │
  └──────────────────────────────>│                               │
                                  │                               │
                       ┌──────────────────────┐                   │
                       │ Insert payments row  │                   │
                       │ status='pending'     │                   │
                       └──────────────────────┘                   │
                                  │                               │
                       ┌──────────────────────┐                   │
                       │ Realtime event fires │                   │
                       └──────────────────────┘                   │
                                  │                               │
                       ┌──────────────────────┐                   │
                       │ Webhook: fetch       │                   │
                       │ payment + creditor   │                   │
                       └──────────────────────┘                   │
                                  │                               │
                                  │  Email: Payment submitted     │
                                  ├──────────────────────────────>│
                                  │  (amount, debtor, receipt)    │
                                  │                               │
                                  │                    ┌─────────┐│
                                  │                    │ Review  ││
                                  │                    │ payment ││
                                  │                    └─────────┘│
                                  │                               │
                                  │  Approve/Reject              │
                                  │<──────────────────────────────┤
                                  │                               │
                       ┌──────────────────────┐                   │
                       │ Update status        │                   │
                       │ Approve: 'approved'  │                   │
                       │ Reject: 'rejected'   │                   │
                       └──────────────────────┘                   │
                                  │                               │
                       ┌──────────────────────┐                   │
                       │ If rejected: send    │                   │
                       │ rejection email      │                   │
                       └──────────────────────┘                   │
                                  │                               │
     Email: Payment rejected      │                               │
     (if rejected)               │                               │
  <──────────────────────────────┤                               │
  │                               │                               │
```

### Book Creation Flow

```
User (Creditor)                System              Partner (Debtor)
  │                              │                     │
  ├─ Create Book                 │                     │
  │  (name, partner_email)       │                     │
  └─────────────────────────────>│                     │
                                 │                     │
                    ┌────────────────────────┐         │
                    │ Insert debt_books row  │         │
                    │ creditor_id = user.id  │         │
                    │ debtor_id = partner.id │         │
                    └────────────────────────┘         │
                                 │                     │
                    ┌────────────────────────┐         │
                    │ Revalidate /books      │         │
                    └────────────────────────┘         │
                                 │                     │
  Redirect to /books              │                     │
  <─────────────────────────────┤                     │
  │                              │                     │
  │ Book visible on dashboard    │                     │
  │ (new book as creditor)       │                     │
  │                              │   Book auto-visible │
  │                              │   (by RLS)          │
  │                              │<────────────────────┤
  │                              │                     │
  │                              │   Book visible on   │
  │                              │   dashboard (as     │
  │                              │   debtor)           │
```

## State Management

**Pattern:** Next.js server-side with revalidation

- **Query State:** Fetched server-side on each request (no manual cache)
- **Mutations:** Server Actions with Zod validation
- **Revalidation:** `revalidatePath()` on create/update
- **Session:** Supabase cookies (auto-managed by middleware)

**No Client-Side State Library:** React Query, Redux, etc. not needed; Next.js caching handles data freshness.

## Performance & Scalability

### Current Optimizations

1. **Database Indexes:** Book queries, payment status filters
2. **RLS Queries:** Filtered at DB level; no fetching unauthorized rows
3. **Revalidation Scope:** Narrow paths (not full page tree)
4. **Image Compression:** Reduce storage & bandwidth
5. **Webhook Async:** Non-blocking email delivery

### Potential Bottlenecks

- **Large Payment Lists:** Ledger calculations sum all approved payments; consider pagination for 1000+ payments
- **Book Queries:** No pagination; user typically has <20 books
- **Email Failures:** Logged but non-critical; failed notifications don't block payments

## Security Considerations

### Database Security

- **RLS:** All user queries protected; no admin bypass in application code
- **Service Role:** Used only in webhooks (admin client) for fetching debtor email
- **Foreign Keys:** Enforce referential integrity

### Storage Security

- **Receipts:** User-namespaced folders; RLS enforces creditor/debtor access

### API Security

- **Webhook Auth:** `x-webhook-secret` header required
- **Server Actions:** `'use server'` ensures execution on server only
- **Environment Variables:** Secrets (.env.local, not committed)

### Email Security

- **Signed URLs:** Receipt URLs expire after 7 days
- **Email Content:** No sensitive data in URLs (only payment IDs and approval links)

## Error Handling

### User-Facing Errors

```typescript
// Server Actions return { error: string }
// UI displays toast notification
toast.error(result.error)
```

### System Errors

```typescript
// Logged to console.error
// Email failures don't block operations
// RLS violations return 403 (access denied)
```

### Graceful Degradation

- **Email Down:** Payments accepted; approval link inaccessible (user can log in)
- **Storage Down:** No receipts uploaded; payments processable without receipts
- **Webhook Down:** Creditor doesn't get email; can still access /books/[bookId]/payments/pending

## Monitoring & Debugging

### Key Metrics

- Payment submission count (webhook invocations)
- Email delivery rate (Resend dashboard)
- RLS denial rate (Supabase logs)
- Revalidation frequency (Next.js build metrics)

### Debug Points

1. **Webhook:** Check `/api/webhooks/payment-created` logs
2. **Email:** Check Resend dashboard + `console.error` in webhook
3. **RLS:** Test queries in Supabase SQL Editor
4. **Payments:** Inspect `payments.status`, `reviewed_at`, `rejection_reason`

### Useful Queries

```sql
-- All payments for a book
SELECT id, debtor_id, amount, status, created_at 
FROM payments 
WHERE book_id = '...' 
ORDER BY created_at DESC;

-- Pending approvals for creditor
SELECT p.id, p.amount, p.note, p.created_at, prof.full_name 
FROM payments p
JOIN profiles prof ON prof.id = p.debtor_id
WHERE p.book_id = '...' AND p.status = 'pending'
ORDER BY p.created_at ASC;

-- Ledger totals
SELECT 
  (SELECT SUM(amount) FROM debts WHERE book_id = '...') AS total_debt,
  (SELECT SUM(amount) FROM payments WHERE book_id = '...' AND status = 'approved') AS approved_payments,
  (SELECT COUNT(*) FROM payments WHERE book_id = '...' AND status = 'pending') AS pending_count;
```

---

**Related Docs:**
- [Codebase Summary](./codebase-summary.md)
- [Code Standards](./code-standards.md)
- [Project Overview & PDR](./project-overview-pdr.md)
