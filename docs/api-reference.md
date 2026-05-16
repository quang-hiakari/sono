# SoNo API Reference

**Version:** 2.0  
**Last Updated:** 2026-05-16

## Overview

SoNo uses Next.js Server Actions for mutations and Server Components for queries. No RESTful API exposed to clients; all data access via Supabase with Row-Level Security.

## Authentication

All endpoints require Supabase session (httpOnly cookie, managed by middleware).

```typescript
// Verify current user
const me = await getCurrentUser();
if (!me) {
  return redirect('/login');
}
```

## Server Actions

Server Actions are async functions marked with `'use server'`. Called from form submissions or client code.

### Books

#### `createBook(formData: FormData)`

**File:** `app/books/new/actions.ts`

**Description:** Create a new debt book.

**Parameters:**

```typescript
FormData {
  name: string                    // Book name (required)
  partner_email: string          // Partner email (required, must be registered)
}
```

**Returns:**

```typescript
{
  error?: string                 // Error message if failed
} | { redirect?: string }        // Redirect on success
```

**Permissions:** Authenticated users only; any user can create.

**Example:**

```typescript
const formData = new FormData();
formData.append('name', 'House Rent');
formData.append('partner_email', 'sister@example.com');

const result = await createBook(formData);
if (result.error) {
  console.error(result.error);
}
```

**Side Effects:**
- Inserts row into `debt_books` table
- Revalidates `/books` page
- Redirects to `/books` on success

### Debts

#### `createDebt(bookId: string, formData: FormData)`

**File:** `app/books/[bookId]/debts/actions.ts`

**Description:** Add a debt to a book.

**Parameters:**

```typescript
FormData {
  title: string                  // Debt description (required)
  amount: number                 // Amount (required, must be > 0)
  debt_date: string             // Date of debt (YYYY-MM-DD, required)
  notes?: string                // Optional notes
}
```

**Returns:**

```typescript
{
  error?: string
}
```

**Permissions:** Only creditor of book can create debts.

**Example:**

```typescript
const formData = new FormData();
formData.append('title', 'Lunch');
formData.append('amount', '100000');
formData.append('debt_date', '2026-05-16');
formData.append('notes', 'At restaurant XYZ');

const result = await createDebt(bookId, formData);
if (result.error) {
  toast.error(result.error);
}
```

**Side Effects:**
- Inserts row into `debts` table
- Revalidates `/books/[bookId]` and `/books/[bookId]/debts`

### Payments

#### `createPayment(bookId: string, formData: FormData)`

**File:** `app/books/[bookId]/payments/actions.ts`

**Description:** Submit a payment for approval.

**Parameters:**

```typescript
FormData {
  amount: number                 // Amount (required, must be > 0)
  note?: string                 // Optional note (max 500 chars)
  receipt_path: string          // Storage path of receipt (required)
}
```

**Returns:**

```typescript
{
  error?: string
}
```

**Permissions:** Only debtor of book can create payments.

**Example:**

```typescript
const formData = new FormData();
formData.append('amount', '50000');
formData.append('note', 'Paid half of lunch');
formData.append('receipt_path', 'receipts/{userId}/receipt_123.jpg');

const result = await createPayment(bookId, formData);
if (result.error) {
  toast.error(result.error);
  return;
}
// Email sent to creditor (async)
toast.success('Payment submitted for approval');
```

**Side Effects:**
- Inserts row into `payments` table with `status='pending'`
- Triggers webhook `/api/webhooks/payment-created` (async)
- Webhook sends email to creditor
- Revalidates payment pages

#### `approvePayment(bookId: string, paymentId: string)`

**File:** `app/books/[bookId]/payments/actions.ts`

**Description:** Approve a pending payment.

**Parameters:**

```typescript
bookId: string        // Book ID
paymentId: string     // Payment ID
```

**Returns:**

```typescript
{
  error?: string
}
```

**Permissions:** Only creditor of book can approve.

**Example:**

```typescript
const result = await approvePayment(bookId, paymentId);
if (result.error) {
  toast.error(result.error);
} else {
  toast.success('Payment approved');
}
```

**Side Effects:**
- Updates `payments` row: `status='approved'`, `reviewed_at=now()`
- Revalidates `/books/[bookId]` and `/books/[bookId]/payments`
- Ledger recalculates

#### `rejectPayment(bookId: string, paymentId: string, reason: string)`

**File:** `app/books/[bookId]/payments/actions.ts`

**Description:** Reject a pending payment and notify debtor.

**Parameters:**

```typescript
bookId: string        // Book ID
paymentId: string     // Payment ID
reason: string        // Rejection reason (sent to debtor)
```

**Returns:**

```typescript
{
  error?: string
}
```

**Permissions:** Only creditor of book can reject.

**Example:**

```typescript
const result = await rejectPayment(bookId, paymentId, 'Receipt unclear');
if (result.error) {
  toast.error(result.error);
} else {
  toast.success('Payment rejected');
  // Email sent to debtor (async)
}
```

**Side Effects:**
- Updates `payments` row: `status='rejected'`, `rejection_reason`, `reviewed_at=now()`
- Sends email to debtor via `sendRejectionNotification()` (async, non-blocking)
- Revalidates `/books/[bookId]` and `/books/[bookId]/payments`

## Webhook Endpoints

### POST `/api/webhooks/payment-created`

**Description:** Triggered by Supabase Realtime when payment is inserted. Sends email to creditor.

**Headers:**

```
x-webhook-secret: {WEBHOOK_SECRET}  // Required; verified server-side
Content-Type: application/json
```

**Body (from Supabase Realtime):**

```json
{
  "type": "INSERT",
  "record": {
    "id": "uuid",
    "book_id": "uuid",
    "debtor_id": "uuid",
    "amount": 50000,
    "receipt_url": "receipts/...",
    "note": "Payment note",
    "status": "pending",
    "created_at": "2026-05-16T10:30:00Z"
  }
}
```

**Response:**

```json
{
  "status": 200,
  "message": "ok"
}
```

**Errors:**

| Code | Message | Cause |
|------|---------|-------|
| 401 | Unauthorized | Invalid webhook secret |
| 400 | Bad request | Missing payment ID |
| 404 | Payment not found | Payment ID not in DB |

**Side Effects:**
- Fetches payment + creditor + debtor details
- Creates signed receipt URL (7-day expiry)
- Sends email via Resend to creditor
- Logs failures (non-blocking)

## Query Functions

Query functions are called from Server Components. They use Supabase client and are RLS-protected.

### Authentication

#### `getCurrentUser(): Promise<User | null>`

**File:** `lib/auth/get-current-user.ts`

**Returns:**

```typescript
{
  user: {           // Supabase Auth user
    id: string
    email: string
  }
  profile: {        // profiles table row
    id: string
    email: string
    full_name: string | null
    created_at: string
  }
} | null
```

**Example:**

```typescript
const me = await getCurrentUser();
if (!me) {
  return redirect('/login');
}
console.log(me.user.email);  // Auth email
console.log(me.profile.full_name);  // Profile data
```

### Books

#### `getMyBooks(userId: string): Promise<DebtBook[]>`

**File:** `lib/queries/books.ts`

**Description:** Get all books where user is creditor or debtor.

**Returns:**

```typescript
{
  id: string
  name: string
  creditor_id: string
  debtor_id: string
  created_at: string
}[]
```

**Example:**

```typescript
const me = await getCurrentUser();
const books = await getMyBooks(me!.id);
const creditorBooks = books.filter(b => b.creditor_id === me.id);
const debtorBooks = books.filter(b => b.debtor_id === me.id);
```

#### `getBook(bookId: string): Promise<DebtBook>`

**File:** `lib/queries/books.ts`

**Description:** Get single book (RLS-protected; throws if user not member).

**Returns:**

```typescript
{
  id: string
  name: string
  creditor_id: string
  debtor_id: string
  created_at: string
}
```

**Example:**

```typescript
const book = await getBook(bookId);
const isCreditor = book.creditor_id === me.id;
```

#### `getPartnerName(book: DebtBook, userId: string): string`

**File:** `lib/queries/books.ts`

**Description:** Get partner's display name for a book.

**Example:**

```typescript
const partnerName = getPartnerName(book, me.id);
// Returns full_name or email of the other user
```

### Ledger

#### `getLedgerTotals(bookId: string): Promise<LedgerTotals>`

**File:** `lib/queries/book-ledger.ts`

**Description:** Calculate totals for a book.

**Returns:**

```typescript
{
  total: number              // Sum of all debts
  paid: number              // Sum of approved payments
  remaining: number         // total - paid
  pendingCount: number      // Count of pending payments
}
```

**Example:**

```typescript
const totals = await getLedgerTotals(bookId);
console.log(`Balance: ${totals.remaining} VND`);
console.log(`Pending approvals: ${totals.pendingCount}`);
```

#### `getDebts(bookId: string): Promise<Debt[]>`

**File:** `lib/queries/book-ledger.ts`

**Description:** List all debts in book.

**Returns:**

```typescript
{
  id: string
  book_id: string
  title: string
  amount: number
  notes: string | null
  debt_date: string       // YYYY-MM-DD
  created_at: string
}[]
```

#### `getAllPayments(bookId: string): Promise<Payment[]>`

**File:** `lib/queries/book-ledger.ts`

**Description:** List all payments in book (any status).

**Returns:**

```typescript
{
  id: string
  book_id: string
  debtor_id: string
  amount: number
  receipt_url: string | null
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  reviewed_at: string | null
  created_at: string
}[]
```

#### `getPendingPayments(bookId: string): Promise<Payment[]>`

**File:** `lib/queries/book-ledger.ts`

**Description:** List pending payments (for creditor approval queue).

**Returns:** Same as `getAllPayments`, filtered to `status='pending'`.

#### `getMyPayments(bookId: string, debtorId: string): Promise<Payment[]>`

**File:** `lib/queries/book-ledger.ts`

**Description:** List payments submitted by specific debtor.

**Returns:** Same as `getAllPayments`, filtered to debtor.

## Utility Functions

### Formatters

#### `formatCurrency(amount: number): string`

**File:** `lib/format/currency.ts`

**Example:**

```typescript
formatCurrency(100000)  // "100.000 VND"
formatCurrency(50000.5)  // "50.000,5 VND"
```

#### `formatDate(isoString: string): string`

**File:** `lib/format/date.ts`

**Example:**

```typescript
formatDate('2026-05-16T10:30:00Z')  // "16/05/2026 10:30"
```

### Upload

#### `uploadReceipt(file: File, userId: string): Promise<string>`

**File:** `lib/upload/upload-receipt.ts`

**Description:** Upload receipt image to storage and return path.

**Returns:** Storage path (e.g., `receipts/{userId}/receipt_123.jpg`)

**Example:**

```typescript
const path = await uploadReceipt(file, me.id);
// Use path in createPayment formData
```

#### `compressImage(file: File, quality?: number, maxSize?: number): Promise<File>`

**File:** `lib/upload/compress-image.ts`

**Description:** Compress image before upload.

**Parameters:**

```typescript
file: File                 // Input image
quality?: number          // 0-1 (default 0.7)
maxSize?: number          // Max dimension in px (default 100)
```

**Returns:** Compressed File object

## Email Services

### `sendPaymentNotification(options: PaymentEmailOptions)`

**File:** `lib/email/send-payment-notification.ts`

**Parameters:**

```typescript
{
  to: string                // Creditor email
  debtorName: string       // Debtor's display name
  amount: number           // Payment amount
  note?: string            // Payment note
  createdAt: string        // ISO timestamp
  receiptUrl?: string      // Signed URL to receipt
  approvalUrl: string      // Link to approval page
}
```

**Example:**

```typescript
await sendPaymentNotification({
  to: creditor.email,
  debtorName: debtor.full_name ?? debtor.email,
  amount: 50000,
  note: 'Lunch payment',
  createdAt: payment.created_at,
  receiptUrl: signedUrl,
  approvalUrl: `${appUrl}/books/${bookId}/payments`,
});
```

### `sendRejectionNotification(options: RejectionEmailOptions)`

**File:** `lib/email/send-rejection-notification.ts`

**Parameters:**

```typescript
{
  to: string                // Debtor email
  creditorName: string     // Creditor's display name
  amount: number           // Payment amount
  reason?: string          // Rejection reason
  dashboardUrl: string     // Link to dashboard
}
```

**Example:**

```typescript
await sendRejectionNotification({
  to: debtor.email,
  creditorName: creditor.full_name ?? creditor.email,
  amount: 50000,
  reason: 'Receipt unclear',
  dashboardUrl: `${appUrl}/books/${bookId}/payments`,
});
```

## Error Handling

### Server Action Errors

Server actions return `{ error: string }` on failure.

```typescript
const result = await createPayment(bookId, formData);
if (result.error) {
  toast.error(result.error);  // User-friendly message
  return;
}
```

### Query Errors

Queries throw errors on RLS violations or DB errors.

```typescript
try {
  const book = await getBook(bookId);
} catch (err) {
  // User not member of book, or book not found
  return redirect('/books');
}
```

### Email Errors

Email failures logged but don't block operations.

```typescript
try {
  await sendPaymentNotification({...});
} catch (err) {
  console.error('Email failed:', err);
  // Payment created; email is best-effort
}
```

## Rate Limiting

No explicit rate limiting. Supabase may enforce connection limits. Monitor logs for throttling.

## Pagination

Not implemented. Queries return all results.

**Recommendations for Large Datasets:**
- If user has >50 books, paginate `/books` (implement `limit` + `offset`)
- If book has >1000 payments, paginate `/books/[bookId]/payments`

## Versioning

Current version: **2.0**

No breaking changes planned for v2.0.x (patch updates).

Version 3.0 (future) may introduce:
- Pagination
- Batch API for bulk operations
- GraphQL (alternative to REST)

---

**Related Docs:**
- [Code Standards](./code-standards.md)
- [System Architecture](./system-architecture.md)
- [Codebase Summary](./codebase-summary.md)
