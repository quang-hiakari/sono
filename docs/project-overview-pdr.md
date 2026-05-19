# SoNo: Project Overview & Product Development Requirements

**Project Name:** SoNo (Sổ Nợ - Debt Ledger)  
**Version:** 2.1 (Multi-user Debt Books + Country/Bank Profiles)  
**Status:** Implemented  
**Last Updated:** 2026-05-18

## Executive Summary

SoNo is a collaborative debt-tracking application that enables any two registered users to create named debt books and manage payments with creditor approval workflows. Version 2.0 represents a complete architectural redesign from a hardcoded 2-user model (owner/sister) to a fully flexible multi-user system where:

- **Any user** can create a debt book with any other registered user
- **Role assignment** is derived per-book (creditor/debtor), not global
- **Payments require approval** from the creditor before counting toward balance
- **Email notifications** keep stakeholders informed at key moments

## Vision

Enable flexible, transparent debt tracking between family members, friends, and colleagues with built-in accountability through payment approval workflows.

## Core Features

### 1. Multi-user Debt Books (Version 2.0)

**Requirement:** Any registered user can create a named debt book with another user, establishing themselves as creditor and the other as debtor.

**Acceptance Criteria:**
- User can navigate to `/books/new`
- Form allows searching for partner by email
- Book creation stores `creditor_id` (creator) and `debtor_id` (partner)
- Book appears on both users' dashboards (groupped by role)
- Only creditor can edit/delete book

**Technical Details:**
- `debt_books` table: `{id, name, creditor_id, debtor_id, created_at}`
- RLS: Both users can view; only creditor can edit
- No hardcoded roles; role determined by comparing `auth.uid()` to book fields

### 2. Debt Management

**Requirement:** Creditor can add debts (record amounts owed) within a book.

**Acceptance Criteria:**
- Creditor navigates to `/books/[bookId]/debts`
- Form fields: title, amount, date, notes
- Debt stored in `debts` table with `book_id`, `creditor_id`, `amount`
- Debts listed in creation order (newest first)
- Amount must be > 0
- Debtor can view debts (read-only)

**Technical Details:**
- `debts` table: `{id, book_id, creditor_id, title, amount, debt_date, notes, created_at}`
- RLS: Creditor full access; debtor read-only
- Index: `debts(book_id, created_at DESC)` for listing

### 3. Payment Submission & Approval Workflow

**Requirement:** Debtor can submit payments; creditor must approve before payment counts toward balance.

**Acceptance Criteria:**

**Debtor Flow:**
1. Debtor navigates to `/books/[bookId]/payments/new`
2. Form fields: amount, note, receipt (image, optional)
3. Submit creates `payments` row with `status='pending'`, `receipt_url`
4. Webhook fires, creditor receives email notification
5. Debtor sees "pending" badge on payment history

**Creditor Flow:**
1. Creditor receives email with payment details, debtor name, receipt (if provided), approval link
2. Creditor navigates to `/books/[bookId]/payments`
3. Views "Pending Approvals" queue
4. Can approve (→ `status='approved'`) or reject (→ `status='rejected'`, reason stored)
5. If rejected, debtor receives email with rejection reason
6. Ledger updates to reflect only approved payments

**Acceptance Criteria:**
- `payments` table: `{id, book_id, debtor_id, amount, status, receipt_url, rejection_reason, reviewed_at, created_at}`
- Status enum: `'pending' | 'approved' | 'rejected'`
- Only approved payments count toward `ledger.paid`
- `ledger.remaining = total_debts - approved_payments`
- Webhook sends email on payment creation (best-effort)
- Email sent on rejection (best-effort, non-blocking)

**Technical Details:**
- Webhook endpoint: `/api/webhooks/payment-created`
- Webhook triggered on `payments` insert via Supabase Realtime
- Webhook fetches creditor email, creates signed receipt URL (7-day expiry), sends via Resend
- `rejectPayment` server action sends rejection email
- Image compression before upload (quality 0.7)

### 4. Ledger & Balance Tracking

**Requirement:** Dashboard displays book summary with total debt, paid amount, remaining balance, and pending payment count.

**Acceptance Criteria:**
- Dashboard at `/books/[bookId]` shows:
  - Book name + partner name
  - Total debt (sum of all debts)
  - Approved payments (sum of approved payments)
  - Remaining balance (total - approved)
  - Pending approval count
- Updates reflect latest state after payment approval/rejection
- Calculations correct even with many debts/payments

**Technical Details:**
- Query: `getLedgerTotals(bookId)` in `lib/queries/book-ledger.ts`
- Calculation: SQL `SUM()` (not client-side)
- Revalidation: `revalidatePath` after approval/rejection

### 5. Email Notifications

**Requirement:** Key events trigger email notifications to relevant users.

**Events & Recipients:**
1. **Payment Submitted** → Creditor
   - Who: Debtor's name
   - What: Payment amount, note, receipt link (if provided)
   - Where: Link to approval page
   - When: Immediately (async webhook)

2. **Payment Rejected** → Debtor
   - Who: Creditor's name
   - What: Payment amount, rejection reason
   - Where: Link to dashboard
   - When: Immediately (server action)

**Acceptance Criteria:**
- Emails sent to correct recipients
- Email failures don't block operations
- Receipt URLs expire after 7 days
- Email content is clear and actionable
- Webhook secret validated on every request

**Technical Details:**
- Service: Resend (resend.com)
- Webhook Secret: `process.env.WEBHOOK_SECRET`
- Signed URLs: 7-day expiry for receipts
- Error Handling: Logged, non-blocking

### 6. Authentication & Authorization

**Requirement:** Users register and authenticate; access control enforced per-book.

**Acceptance Criteria:**
- Sign-up/login via Supabase Auth
- Session stored in httpOnly cookie
- User profile created on signup
- Protected routes redirect unauthenticated users to `/login`
- RLS enforces: user can only access books where they are creditor/debtor
- Server actions verify authorization (creditor/debtor check)

**Technical Details:**
- Auth Provider: Supabase Auth
- Middleware: `middleware.ts` refreshes session
- Current User: `lib/auth/get-current-user.ts`
- RLS: All queries filtered by `auth.uid()`

### 7. Country-Specific Bank Profiles

**Requirement:** Users can specify their country (Vietnam/Japan) and select from a curated list of country-specific banks for account details.

**Acceptance Criteria:**
- User navigates to `/profile`
- Country selector: toggle between "Vietnam" and "Japan"
- Bank field replaced with searchable dropdown showing 30 Vietnamese or 20 Japanese banks
- Bank list filters dynamically when country changes
- Bank ID stored in database; UI displays bank short name (e.g., "Vietcombank", "MUFG")
- Profile persists country and bank selection
- All text (country, bank labels, placeholders) supports i18n (English, Vietnamese, Japanese)

**Technical Details:**
- `profiles.country` column: TEXT, default 'VN'
- `banks` reference table: `{id, country, name, short_name, bin, swift}`
- Bank query: `getBanksByCountry(country: 'VN' | 'JP')` returns sorted list
- UI Component: `BankSelect` with search + modal overlay (mobile-optimized)
- API route: `GET /api/banks?country=VN|JP` for dynamic list refresh
- i18n keys: country, countryVN, countryJP, selectBank, bankSearch, bankNotFound, bankNamePlaceholder

## Non-Functional Requirements

### Performance

| Metric | Target | Implementation |
|--------|--------|-----------------|
| Page Load | <1s | Next.js caching + revalidation |
| Payment Submission | <100ms | Server action validation |
| Email Delivery | <5s | Async webhook (non-blocking) |
| Receipt Upload | <2s | Image compression + Supabase Storage |

### Scalability

- Support 1000+ books per user (paginate if needed)
- Support 10,000+ payments per book (indexed by status)
- Support 100+ concurrent users (Supabase managed)

### Availability

- 99.9% uptime (Supabase SLA)
- Email failures tolerate 5% loss (non-critical)
- Graceful degradation if email down

### Security

- End-to-end encrypted via HTTPS
- RLS enforces access control at database level
- Secrets in environment variables (not code)
- Webhook authentication via secret header
- Storage receipts user-namespaced
- Signed URLs for receipt access

### Usability

- Mobile-responsive design
- Clear payment approval workflow
- Instant email notifications
- No complex setup required

## Architecture Overview

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Next.js 15.5, TypeScript |
| Styling | Tailwind CSS, Radix UI |
| Backend | Next.js Server Actions, Server Components |
| Database | Supabase (PostgreSQL), Row-Level Security |
| Email | Resend |
| Storage | Supabase Storage |
| Auth | Supabase Auth |

### Data Model

```
User (Supabase Auth)
  ↓
Profile (profiles table)
  ↓
Debt Books (debt_books table; user is creditor or debtor)
  ├─ Debts (debts table; scoped by book)
  └─ Payments (payments table; scoped by book, multi-status)
```

### Key Workflows

1. **Book Creation:** User creates book → stored with creditor_id → visible to both users
2. **Debt Creation:** Creditor adds debt → stored with book_id → affects total balance
3. **Payment Flow:** Debtor submits → email to creditor → creditor approves/rejects → email to debtor (if rejected)
4. **Balance Calc:** Ledger sums approved payments only

## Comparison: Version 1.0 vs 2.0

| Aspect | v1.0 | v2.0 |
|--------|------|------|
| **Users** | 2 (hardcoded: owner, sister) | Any number of independent books |
| **Role Assignment** | Global (profiles.role) | Per-book (derived from debt_books) |
| **Books** | Single implicit book | Multiple named books (any pair) |
| **Payment Status** | None (auto-counted) | Multi-status (pending/approved/rejected) |
| **Approvals** | None | Required (creditor approves) |
| **Notifications** | None | Payment submitted + rejection |
| **Routes** | /owner, /sister | /books, /books/[bookId]/* |

## Implementation Status

### Completed (v2.0)

- ✅ Multi-user debt books with creditor/debtor roles
- ✅ Payment approval workflow (pending/approved/rejected)
- ✅ Email notifications (payment submitted, rejected)
- ✅ Ledger balance tracking (total, paid, remaining, pending)
- ✅ Receipt upload + storage
- ✅ RLS policies for access control
- ✅ Database migrations (0001_init.sql, 0002_multi_user_books.sql)
- ✅ Server actions for mutations
- ✅ Webhook for payment notifications
- ✅ Authentication (Supabase Auth)

### Future Enhancements

- [ ] Payment history filtering/search
- [ ] Batch debt uploads (CSV)
- [ ] Recurring debts / subscriptions
- [ ] Multi-currency support
- [ ] Invoice generation (PDF)
- [ ] Settlement reminders (scheduled emails)
- [ ] Mobile app (React Native)
- [ ] Dark mode

## Success Metrics

### User Engagement

- Monthly active users (target: 100+)
- Books created per user (target: avg 2-3)
- Payments submitted per book (target: avg 10+)
- Email open rate (target: >50%)

### System Health

- Webhook success rate (target: >99%)
- Email delivery rate (target: >95%)
- RLS violation attempts (monitor for abuse)
- Error rate (target: <0.1%)

### Business Impact

- User retention after 30 days (target: >60%)
- NPS score (target: >40)
- Support tickets (target: <1 per 100 users)

## Known Limitations

1. **No Data Migration:** v1.0 → v2.0 requires manual re-entry (old schema incompatible)
2. **Email Failures Non-Critical:** Payments accepted even if email fails
3. **Receipt Optional:** Payments can be submitted without proof
4. **No Pagination:** User dashboards assume <50 books; may need pagination for power users
5. **Manual Settlement:** Users must track who paid whom; no "settle balance" feature

## Roadmap

### Phase 1: Core (v2.0) ✅
- Multi-user books
- Payment approval
- Email notifications
- Ledger tracking

### Phase 2: Polish (v2.1) - Future
- Batch debt import
- Payment history filters
- Invoice generation
- UI improvements

### Phase 3: Scale (v3.0) - Future
- Mobile app
- Dark mode
- Multi-currency
- Recurring debts

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Email service down | Creditors can't receive notifications | Log events; users can check dashboard manually |
| Storage quota exceeded | Can't upload receipts | Monitor usage; consider compression |
| RLS misconfiguration | Data leak | Test policies; audit logs |
| Payment approval deadlock | Pending payments never resolved | Reminder emails; admin override |

## Stakeholders

- **Users:** Family members, friends managing shared debts
- **Developer:** Maintains code, fixes bugs
- **Support:** Helps users with issues (minimal, self-service app)

## Documentation

- **Codebase Summary:** Overview of files, structure, database schema
- **System Architecture:** Component diagrams, data flow, performance
- **Code Standards:** Naming, patterns, security, testing
- **This Document:** Requirements, vision, roadmap, risks

## Questions & Open Items

None at this time. v2.0 fully implemented and documented.

---

**Last Review:** 2026-05-16  
**Next Review:** TBD (when Phase 2 features begin)
