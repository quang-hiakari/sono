# SoNo Code Standards

**Version:** 2.0  
**Last Updated:** 2026-05-16

## Project Structure

### Directory Organization

```
proyecto-root/
├── app/                    # Next.js App Router
│   ├── books/             # Book management routes
│   ├── login/             # Auth routes
│   ├── api/               # API endpoints (webhooks)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Root page (redirect logic)
├── components/            # Reusable React components
│   ├── ui/               # Radix UI + Tailwind primitives
│   ├── shell/            # App shell components
│   └── ...
├── lib/                   # Utility functions & queries
│   ├── auth/             # Authentication helpers
│   ├── queries/          # Supabase queries
│   ├── email/            # Email services
│   ├── supabase/         # Supabase client configuration
│   ├── format/           # Formatters (currency, date)
│   ├── upload/           # File upload utilities
│   └── utils.ts          # General utilities
├── docs/                 # Documentation
├── supabase/             # Database migrations + config
├── middleware.ts         # Next.js middleware (auth)
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

### File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Routes/Pages | PascalCase | `app/books/page.tsx` |
| Server Components | PascalCase + `.tsx` | `BookCard.tsx`, `page.tsx` |
| Server Actions | camelCase + `actions.ts` | `app/books/new/actions.ts` |
| Utilities | kebab-case + `.ts` | `lib/format/currency.ts`, `lib/upload/compress-image.ts` |
| API Routes | kebab-case + `route.ts` | `app/api/webhooks/payment-created/route.ts` |
| Migrations | `XXXX_{description}.sql` | `0001_init.sql`, `0002_multi_user_books.sql` |

## TypeScript Conventions

### Type Definitions

**Location:** Define types in the same file or in a separate `types.ts` if used across multiple files.

**Examples:**

```typescript
// lib/queries/books.ts
export interface DebtBook {
  id: string;
  name: string;
  creditor_id: string;
  debtor_id: string;
  created_at: string;
}

export interface User {
  user: AuthUser;
  profile: Profile;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}
```

**Naming:** Use descriptive names (DebtBook, not Book; Payment, not Pmt).

### Error Handling

**Pattern:** Server Actions return `{ error?: string }` on failure.

```typescript
export async function createPayment(bookId: string, formData: FormData) {
  const me = await getCurrentUser();
  const book = await getBook(bookId);
  
  if (!me || !book || book.debtor_id !== me.id) {
    return { error: 'Không có quyền.' };
  }

  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: 'Dữ liệu không hợp lệ.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('payments').insert({...});

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/books/${bookId}`);
  return {};
}
```

**UI Handling:**

```typescript
// In server component or client action handler
const result = await createPayment(bookId, formData);
if (result.error) {
  toast.error(result.error);
  return;
}
// Redirect or revalidate
redirect(`/books/${bookId}`);
```

### Validation

**Tool:** Zod for schema validation

```typescript
import { z } from 'zod';

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Số tiền phải lớn hơn 0'),
  note: z.string().max(500).optional(),
  receipt_path: z.string().min(1, 'Vui lòng chọn ảnh'),
});

const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
if (!parsed.success) {
  return { error: 'Dữ liệu không hợp lệ.' };
}
```

## Server Components & Actions

### Server Components (Default)

```typescript
// app/books/page.tsx
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { getMyBooks } from '@/lib/queries/books';

export default async function BooksPage() {
  const me = await getCurrentUser();
  const books = await getMyBooks(me!.id);

  return (
    <div>
      {books.map(book => <BookCard key={book.id} book={book} />)}
    </div>
  );
}
```

**Patterns:**
- Fetch data directly (no useEffect)
- Pass data as props to child components
- Use `await` for async queries
- Throw errors for missing auth (redirect handles)

### Server Actions

```typescript
// 'use server' at top of file
export async function createPayment(bookId: string, formData: FormData) {
  const me = await getCurrentUser();
  if (!me) return { error: 'Not authenticated' };

  // Validate input
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Invalid input' };

  // Mutate DB
  const supabase = await createClient();
  const { error } = await supabase.from('payments').insert({...});
  if (error) return { error: error.message };

  // Revalidate cache
  revalidatePath(`/books/${bookId}`);
  return {};
}
```

**Patterns:**
- `'use server'` directive at file top
- Zod validation
- Error object returns
- `revalidatePath` after mutations
- No client-side state management

## Database & RLS

### Query Patterns

**Fetch Single Record:**

```typescript
const supabase = await createClient();
const { data, error } = await supabase
  .from('debt_books')
  .select('id, name, creditor_id, debtor_id, created_at')
  .eq('id', bookId)
  .single();

if (error) throw error;
return data;
```

**Fetch Multiple Records:**

```typescript
const { data, error } = await supabase
  .from('payments')
  .select('id, amount, status, created_at')
  .eq('book_id', bookId)
  .eq('status', 'pending')
  .order('created_at', { ascending: true });

if (error) throw error;
return (data ?? []) as Payment[];
```

**Insert Record:**

```typescript
const { data, error } = await supabase
  .from('payments')
  .insert({
    book_id: bookId,
    debtor_id: me.id,
    amount: parsed.data.amount,
    note: parsed.data.note ?? null,
    receipt_url: parsed.data.receipt_path,
    status: 'pending',
  });

if (error) return { error: error.message };
return data;
```

**Update Record:**

```typescript
const { error } = await supabase
  .from('payments')
  .update({ status: 'approved', reviewed_at: new Date().toISOString() })
  .eq('id', paymentId)
  .eq('book_id', bookId);

if (error) return { error: error.message };
```

### RLS Assumptions

**Queries assume RLS is enforced; do NOT:**
- Fetch without `.eq()` filters (will return no rows for non-members)
- Use admin client in user-facing queries (breaks RLS)
- Skip permission checks in server actions

**Admin Client (Webhooks only):**

```typescript
// lib/supabase/admin.ts
const admin = createAdminClient();

// Used ONLY in webhooks for privileged operations
const { data } = await admin
  .from('payments')
  .select('id, amount, debtor_id')
  .eq('id', paymentId)
  .single();
```

## Authentication & Authorization

### Get Current User

```typescript
import { getCurrentUser } from '@/lib/auth/get-current-user';

export default async function Dashboard() {
  const me = await getCurrentUser();
  if (!me) {
    return redirect('/login');
  }
  // use me.user (auth.users row) and me.profile (profiles row)
}
```

### Per-Book Authorization

**Creditor-Only Operations:**

```typescript
export async function createDebt(bookId: string, formData: FormData) {
  const me = await getCurrentUser();
  const book = await getBook(bookId);

  // Authorization check
  if (!me || !book || book.creditor_id !== me.id) {
    return { error: 'Không có quyền.' };
  }

  // Proceed with mutation
}
```

**Debtor-Only Operations:**

```typescript
export async function createPayment(bookId: string, formData: FormData) {
  const me = await getCurrentUser();
  const book = await getBook(bookId);

  // Authorization check
  if (!me || !book || book.debtor_id !== me.id) {
    return { error: 'Không có quyền.' };
  }

  // Proceed with mutation
}
```

## Email Services

### Send Payment Notification

```typescript
import { sendPaymentNotification } from '@/lib/email/send-payment-notification';

try {
  await sendPaymentNotification({
    to: creditor.email,
    debtorName: debtor.full_name ?? debtor.email,
    amount: payment.amount,
    note: payment.note,
    createdAt: payment.created_at,
    receiptUrl: signedUrl, // or null
    approvalUrl: `${appUrl}/books/${bookId}/payments`,
  });
} catch (err) {
  console.error('Email failed:', err);
  // Non-blocking; don't throw
}
```

### Send Rejection Notification

```typescript
import { sendRejectionNotification } from '@/lib/email/send-rejection-notification';

try {
  await sendRejectionNotification({
    to: debtor.email,
    creditorName: creditor.full_name ?? creditor.email,
    amount: payment.amount,
    reason: rejectionReason || null,
    dashboardUrl: `${appUrl}/books/${bookId}/payments`,
  });
} catch (err) {
  console.error('Email failed:', err);
  // Non-blocking; don't throw
}
```

## Styling & Components

### Tailwind CSS

- Use Tailwind classes directly (no inline styles)
- Responsive prefix: `sm:`, `md:`, `lg:`, `xl:`
- Spacing scale: `p-4`, `gap-2`, `mt-8`

**Example:**

```typescript
<div className="flex flex-col gap-4 sm:flex-row md:gap-6">
  <Card className="flex-1">
    <CardContent className="p-4">
      <p className="text-sm text-slate-600">Balance</p>
      <p className="text-2xl font-bold text-slate-900">100,000 VND</p>
    </CardContent>
  </Card>
</div>
```

### UI Components (Radix + Tailwind)

**Import from `@/components/ui`:**

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
```

**Pattern:**

```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <div>Dialog content</div>
  </DialogContent>
</Dialog>
```

## Formatters & Utilities

### Currency Formatting

```typescript
import { formatCurrency } from '@/lib/format/currency';

// formatCurrency(100000) → "100.000 VND"
<p>{formatCurrency(payment.amount)}</p>
```

### Date Formatting

```typescript
import { formatDate } from '@/lib/format/date';

// formatDate('2026-05-16T10:30:00Z') → "16/05/2026 10:30"
<p>{formatDate(payment.created_at)}</p>
```

### Utility Functions

```typescript
import { cn } from '@/lib/utils';

// Merge Tailwind classes (resolves conflicts)
const classes = cn('p-4', isBold && 'font-bold', isActive && 'bg-blue-500');
```

## Migrations & Database

### Migration File Naming

Format: `XXXX_{description}.sql`

- `0001_init.sql` → Initial schema (old 2-user model)
- `0002_multi_user_books.sql` → Multi-user redesign

### Migration Pattern

```sql
-- 1. Describe what you're doing
-- Drop old policies/tables

-- 2. Create new tables
CREATE TABLE debt_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creditor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT debt_books_no_self_ref CHECK (creditor_id <> debtor_id)
);

-- 3. Add indexes
CREATE INDEX debt_books_creditor_idx ON debt_books(creditor_id);

-- 4. Enable RLS
ALTER TABLE debt_books ENABLE ROW LEVEL SECURITY;

-- 5. Create policies
CREATE POLICY books_member_select ON debt_books FOR SELECT
  USING (auth.uid() = creditor_id OR auth.uid() = debtor_id);
```

## Testing & Debugging

### Debug Payments

```sql
-- All payments for a book
SELECT id, debtor_id, amount, status, rejection_reason, reviewed_at, created_at
FROM payments
WHERE book_id = '{book-id}'
ORDER BY created_at DESC;

-- Ledger totals
SELECT
  (SELECT SUM(amount) FROM debts WHERE book_id = '{book-id}') as total,
  (SELECT SUM(amount) FROM payments WHERE book_id = '{book-id}' AND status = 'approved') as paid,
  (SELECT COUNT(*) FROM payments WHERE book_id = '{book-id}' AND status = 'pending') as pending;
```

### Debug RLS

```sql
-- Check if query respects RLS
SELECT * FROM debt_books WHERE id = '{book-id}';

-- If you get 0 rows, RLS is blocking (user not creditor/debtor)
-- Use Supabase dashboard to verify policies
```

### Common Issues

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| "Không có quyền" error | User not book member | Check `book.creditor_id === me.id` or `book.debtor_id === me.id` |
| Email not sent | Webhook failed | Check `/api/webhooks/payment-created` logs + Resend dashboard |
| Payment count wrong | Status filter issue | Verify `status` enum: 'pending'\|'approved'\|'rejected' |
| Receipt not visible | RLS blocking | Check storage policies; user must be debtor or creditor |

## Environment Variables

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email
RESEND_API_KEY=re_...

# Webhooks
WEBHOOK_SECRET=secret_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

```bash
# .env.local (not committed)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
WEBHOOK_SECRET=dev_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Performance Checklist

- [ ] All queries have appropriate indexes
- [ ] Ledger calculations don't loop (use SQL `SUM`)
- [ ] Images compressed before upload
- [ ] Revalidation paths are narrow (not `/books/*`)
- [ ] Email failures don't block operations
- [ ] No N+1 queries (use batch selects)

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Webhook secret verified
- [ ] Secrets in environment variables (not code)
- [ ] Storage policies restrict access by folder
- [ ] Authorization checks in server actions
- [ ] No admin client in user-facing code
- [ ] Signed URLs expire (7 days for receipts)

---

**Related Docs:**
- [Codebase Summary](./codebase-summary.md)
- [System Architecture](./system-architecture.md)
- [Project Overview & PDR](./project-overview-pdr.md)
