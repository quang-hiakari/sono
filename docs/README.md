# SoNo Documentation

**Project:** SoNo (Sổ Nợ - Debt Ledger)  
**Version:** 2.0 (Multi-user Debt Books)  
**Last Updated:** 2026-05-16

## Quick Navigation

### For New Developers

**Start here to understand the project:**

1. [Project Overview & PDR](./project-overview-pdr.md) — Vision, features, requirements
2. [Codebase Summary](./codebase-summary.md) — Architecture, file structure, key concepts
3. [System Architecture](./system-architecture.md) — Component diagram, data flows
4. [Code Standards](./code-standards.md) — Naming conventions, patterns, best practices

**Then set up your environment:**

5. [Deployment & Setup](./deployment-and-setup.md) — Local development, production deployment

### For Maintaining Code

**When modifying features:**

6. [API Reference](./api-reference.md) — Server actions, queries, functions
7. [Code Standards](./code-standards.md) — Error handling, validation, security
8. [System Architecture](./system-architecture.md) — How components interact

### For Migrations & Upgrades

**When upgrading versions:**

9. [Migration Guide](./migration-guide.md) — v1.0 → v2.0 upgrade path

---

## Document Overview

### [project-overview-pdr.md](./project-overview-pdr.md)
**Purpose:** High-level project definition and requirements.

**Contains:**
- Executive summary
- Core features (multi-user books, payment approvals, email notifications)
- Non-functional requirements (performance, security, scalability)
- v1.0 vs v2.0 comparison
- Architecture overview
- Roadmap and future enhancements
- Risk assessment

**Best for:** Understanding the "why" and "what" of SoNo.

---

### [codebase-summary.md](./codebase-summary.md)
**Purpose:** Comprehensive overview of the codebase structure and implementation.

**Contains:**
- Technology stack
- Database schema (tables, relationships, indexes)
- File organization (app/, lib/, components/)
- Key query patterns
- Server actions
- Authentication flow
- Key workflows
- Performance considerations
- Security implementation
- Migration history

**Best for:** Understanding "how the code is organized" and finding where things live.

---

### [system-architecture.md](./system-architecture.md)
**Purpose:** Detailed technical architecture and system design.

**Contains:**
- High-level system flow
- Component architecture (frontend, backend, database, auth, email, storage)
- Frontend layer details (Server Components, Server Actions, data patterns)
- Backend layer details (mutations, queries)
- Database layer (tables, RLS policies, indexes)
- Authentication flow (Supabase Auth, middleware, current user)
- Email notification workflows (payment submitted, rejected)
- Storage layer (uploads, compression, access control)
- Data flow diagrams (payment approval, book creation)
- State management (Next.js caching, revalidation)
- Performance & scalability (optimizations, bottlenecks)
- Security (database, storage, API, email)
- Error handling (user-facing, system, graceful degradation)
- Monitoring & debugging (metrics, debug points, useful queries)

**Best for:** Understanding "how everything works together" and debugging complex issues.

---

### [code-standards.md](./code-standards.md)
**Purpose:** Development guidelines and coding standards.

**Contains:**
- Project structure and file organization
- File naming conventions (routes, components, utilities, migrations)
- TypeScript conventions (types, error handling, validation)
- Server components patterns
- Server actions patterns
- Database query patterns
- RLS assumptions
- Authentication patterns (getCurrentUser, per-book authorization)
- Email service functions
- Styling & UI components (Tailwind, Radix)
- Formatters & utilities
- Migrations & database patterns
- Testing & debugging guide
- Environment variables
- Performance & security checklists

**Best for:** Writing code that fits the project's style and patterns.

---

### [api-reference.md](./api-reference.md)
**Purpose:** Complete API documentation for all server actions, queries, and utility functions.

**Contains:**
- Authentication (getCurrentUser)
- Server Actions (createBook, createDebt, createPayment, approvePayment, rejectPayment)
- Webhook endpoints (POST /api/webhooks/payment-created)
- Query functions (getMyBooks, getBook, getLedgerTotals, getDebts, getPayments)
- Utility functions (formatCurrency, formatDate, uploadReceipt, compressImage)
- Email services (sendPaymentNotification, sendRejectionNotification)
- Error handling patterns
- Rate limiting notes
- Pagination notes
- Versioning info

**Best for:** Using or modifying specific functions in your code.

---

### [deployment-and-setup.md](./deployment-and-setup.md)
**Purpose:** Setup instructions for development and production.

**Contains:**
- Local development quick start (9 steps)
- Prerequisites and installation
- Supabase project setup
- Database migrations
- Email service setup (Resend)
- Environment file configuration
- Storage bucket setup
- Webhook configuration
- Development server startup
- Production deployment (Vercel, Netlify, self-hosted)
- Custom domain setup
- Database backup strategy
- Monitoring & logging
- Configuration reference
- Troubleshooting (common issues)
- Development workflow
- Scaling guidelines
- Security checklist
- Disaster recovery

**Best for:** Getting the app running locally or deploying to production.

---

### [migration-guide.md](./migration-guide.md)
**Purpose:** Guide for upgrading from v1.0 to v2.0.

**Contains:**
- Migration overview (what changed)
- Pre-migration checklist
- Step-by-step migration process
- Verification steps
- Data recovery options (manual re-entry, custom scripts)
- Post-migration tasks
- Rollback plan
- Troubleshooting
- FAQ
- Recommended timeline
- Support contacts

**Best for:** Upgrading an existing SoNo v1.0 instance to v2.0.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  Server Components + Server Actions (no client lib)     │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    ┌────▼─────┐         ┌────▼──────┐
    │ Supabase │         │  Resend   │
    │  Auth    │         │  Email    │
    │   + DB   │         │ Service   │
    │   + RLS  │         └───────────┘
    │          │
    │ Tables:  │         ┌──────────────┐
    │ ├─profiles         │ Supabase     │
    │ ├─debt_books       │ Storage      │
    │ ├─debts            │ (Receipts)   │
    │ └─payments         └──────────────┘
    │          │
    │ Webhook: │
    │ Realtime │
    │ trigger  │
    └──────────┘
```

## Common Tasks

### I want to...

**Understand what SoNo does**
→ Read [Project Overview & PDR](./project-overview-pdr.md)

**Set up SoNo locally**
→ Follow [Deployment & Setup](./deployment-and-setup.md) → Quick Start

**Deploy SoNo to production**
→ Follow [Deployment & Setup](./deployment-and-setup.md) → Production Deployment

**Add a new feature**
1. Read [Project Overview & PDR](./project-overview-pdr.md) for context
2. Check [Code Standards](./code-standards.md) for patterns
3. Implement following patterns
4. Update [API Reference](./api-reference.md) if adding new functions

**Fix a bug**
1. Check [System Architecture](./system-architecture.md) → "Debug Points"
2. Use [Code Standards](./code-standards.md) → "Testing & Debugging"
3. Run Supabase queries from [Codebase Summary](./codebase-summary.md) → "Testing & Debugging"

**Understand payment approval flow**
→ Read [System Architecture](./system-architecture.md) → "Data Flow Diagrams"

**Learn the database schema**
→ Read [Codebase Summary](./codebase-summary.md) → "Database Schema"

**Understand RLS and security**
→ Read [Code Standards](./code-standards.md) → "Database & RLS" + [System Architecture](./system-architecture.md) → "Security Considerations"

**Migrate from v1.0 to v2.0**
→ Follow [Migration Guide](./migration-guide.md) step-by-step

**Configure email notifications**
→ Read [Deployment & Setup](./deployment-and-setup.md) → "Set Up Email Service"

**Debug why a query isn't working**
1. Check [Code Standards](./code-standards.md) → "Testing & Debugging"
2. Use SQL queries from [Codebase Summary](./codebase-summary.md) → "Testing & Debugging"
3. Check Supabase logs (RLS violations, etc.)

---

## Key Concepts

### Multi-user Debt Books (v2.0 Focus)

In v2.0, **any two registered users** can create a named debt book. Unlike v1.0's hardcoded "owner" and "sister" roles:

- **Role is per-book**, not global
- **Creditor** (lender): Typically the book creator; can add debts and approve/reject payments
- **Debtor** (borrower): The partner; can submit payments for creditor approval
- **Books are independent**: User A might be creditor in one book, debtor in another

### Payment Approval Workflow

Payments require **creditor approval** before counting toward the balance:

1. **Debtor** submits payment
2. **Webhook** triggers → email to creditor
3. **Creditor** reviews and approves or rejects
4. **If approved**: Payment counts toward `ledger.paid`
5. **If rejected**: Email sent to debtor; payment doesn't count

### Ledger Balance

```
Total Debt (all debts in book)
- Approved Payments (only approved count)
= Remaining Balance

Example:
Total Debt:          1,000,000 VND
Approved Payments:   -600,000 VND
Remaining Balance:    400,000 VND
(Pending approvals don't count)
```

---

## Development Guidelines

### Code Style

- **TypeScript:** Strict mode, explicit types
- **React:** Server Components (default), Server Actions (for mutations)
- **Styling:** Tailwind CSS + Radix UI
- **Naming:** kebab-case for files, PascalCase for components
- **Validation:** Zod for schemas
- **Error Handling:** Return `{ error: string }` from server actions

### Database

- **All tables:** RLS enabled
- **Queries:** Use Supabase SDK, never raw SQL in application code
- **Migrations:** Numbered files (0001, 0002, ...) in `supabase/migrations/`
- **Indexes:** Index frequently-queried columns

### Testing

- Test locally before pushing
- Check RLS works in Supabase SQL Editor
- Verify email workflows (use Resend test mode)
- Test payment approval flow end-to-end

---

## Glossary

| Term | Definition |
|------|-----------|
| **Debt Book** | Container for debts between two specific users (creditor & debtor) |
| **Creditor** | User who lends money; creates debts; approves/rejects payments |
| **Debtor** | User who owes money; submits payments for approval |
| **Debt** | Individual amount owed within a book |
| **Payment** | Money submitted by debtor; requires creditor approval to count |
| **RLS** | Row-Level Security; Supabase feature for data access control |
| **Ledger** | Summary of debts and payments (total, paid, remaining balance) |
| **Server Action** | Async function that runs on server; handles mutations |
| **Server Component** | React component that renders on server; can fetch data directly |
| **Revalidation** | Cache invalidation; forces Next.js to refetch data |
| **Webhook** | Supabase event trigger; sends HTTP request to app endpoint |

---

## Version History

### v2.0 (Current) — 2026-05-16
- ✅ Multi-user debt books (any pair can create)
- ✅ Per-book role assignment (creditor/debtor)
- ✅ Payment approval workflow (pending/approved/rejected)
- ✅ Email notifications (payment submitted, rejected)
- ✅ Ledger balance tracking
- ✅ RLS for access control
- ✅ Receipt upload & storage

### v1.0 (Deprecated) — Pre-2026
- Hardcoded 2-user model (owner/sister)
- Single implicit book
- No payment approvals
- No email notifications

### Future (v3.0)
- Mobile app
- Dark mode
- Multi-currency
- Batch imports
- Invoice generation

---

## Support & Resources

### Documentation

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Resend Email: https://resend.com/docs
- Radix UI: https://www.radix-ui.com/docs/primitives

### Getting Help

1. Check the relevant documentation file above
2. Search [Codebase Summary](./codebase-summary.md) → "Testing & Debugging"
3. Review [System Architecture](./system-architecture.md) → "Monitoring & Debugging"
4. Check Supabase logs: Dashboard → Logs → Recent Events
5. Check Resend logs: Dashboard → Emails

### Reporting Issues

Create a GitHub issue with:
- Description of the problem
- Steps to reproduce
- Error message (if any)
- Relevant logs (Supabase, Resend, console)

---

## Document Maintenance

**Last Updated:** 2026-05-16  
**Maintained by:** Development team  
**Review Frequency:** Quarterly or after major changes

**Update Triggers:**
- New feature implemented
- Schema changes
- Major bug fixes
- Version upgrades
- Deployment changes

---

**Quick Links:**
- [Project Overview](./project-overview-pdr.md)
- [Codebase Summary](./codebase-summary.md)
- [System Architecture](./system-architecture.md)
- [Code Standards](./code-standards.md)
- [API Reference](./api-reference.md)
- [Deployment & Setup](./deployment-and-setup.md)
- [Migration Guide](./migration-guide.md)
