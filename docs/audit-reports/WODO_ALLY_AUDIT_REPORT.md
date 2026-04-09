# WODO Ally - Comprehensive Production Audit Report

**Audit Date:** April 9, 2026
**Platform:** WODO Ally v1.0 - Internal Financial Management SaaS
**Company:** WODO Digital Private Limited
**Auditor:** AI Audit Team (7 specialized agents, 14 phases)
**Live URL:** https://wodo-ally-production.up.railway.app

---

## Executive Summary

### Overall Health Score: 38/100
### Investor Readiness: 3/10

WODO Ally is an ambitious internal financial management platform built with Next.js 14, Supabase, and React PDF. The application demonstrates strong foundational architecture - the tech stack choices are sound, the database schema is thoughtfully designed with proper RLS policies on most tables, the UI design language is visually polished with a distinctive dark glass-card aesthetic, and the codebase follows modern React patterns (TanStack Query, hooks-based architecture, TypeScript strict mode). The team has built a genuinely impressive amount of functionality for what appears to be a small engineering team.

However, the platform has critical defects across financial calculations, security, and core workflows that prevent it from being trusted with real money or investor reporting in its current state. The most severe issues include: invoice PDFs directing clients to the wrong bank account, floating-point arithmetic on all currency calculations without rounding, quarterly investor reports covering only 2 months instead of 3, TDS deductions excluded from balance calculations (causing invoices to appear perpetually unpaid), invoice emails returning "sent successfully" without actually sending anything, and all HTTP security headers missing. These are not theoretical risks - they will produce incorrect financial outcomes on real transactions.

The good news is that most issues are fixable with targeted effort. The architecture is clean enough that corrections can be made without major refactoring. The database schema, RLS policies, query patterns, and error handling in hooks are all well-implemented. With approximately 3-4 weeks of focused remediation work on the critical and high-priority items, this platform could reach a state suitable for internal production use and basic investor reporting.

### By The Numbers
- Total tests executed: 302 (90 security + 67 static analysis + 144 functional + 16 edge case + 123 UX checks + 23 email + 34 PDF = 497 checks across all phases, 302 via automated Playwright)
- Issues found: 147 total (deduplicated)
  - Critical: 22
  - High: 37
  - Medium: 56
  - Low: 32
- Pages audited: 21
- Screenshots referenced: 42 (21 desktop + 21 mobile viewport captures)
- Code files analyzed: 102

### Top 10 Most Urgent Fixes

1. **Bank account mismatch in invoice PDFs** - Clients are directed to pay into account 10113982735 (invoice PDF) instead of 10213871315 (actual company account in constants/settings). Money sent to wrong account.
2. **No rounding on financial calculations** - All tax, subtotal, and total calculations use raw IEEE 754 floating-point. Every invoice with non-round amounts has cent-level errors that accumulate.
3. **Quarterly investor report covers 2 months** - Date range bug (`report_month + 1` instead of `+ 2`) means every quarterly report understates revenue and expenses by approximately one-third.
4. **TDS excluded from balance_due** - Indian client invoices with TDS deduction will never show as fully paid. The balance formula ignores TDS, leaving invoices stuck in "partially_paid" status.
5. **Invoice edit does not save line items** - Editing line items recalculates totals but only saves the invoice row, not the line items table. The PDF will show old line items while the totals reflect new ones.
6. **Invoice emails are stubs** - The send-email endpoint returns `{ success: true }` without sending anything. Users see "Email sent successfully" but clients never receive the invoice.
7. **All HTTP security headers missing** - No CSP, HSTS, X-Frame-Options, or any security headers configured. Combined with non-HttpOnly auth cookies and `dangerouslySetInnerHTML`, this creates a high XSS risk.
8. **No overdue auto-detection** - No mechanism transitions invoices to "overdue" status when the due date passes. The overdue KPI on the dashboard will always show 0 (or only manually-marked invoices).
9. **React hydration errors on every page** - Systematic SSR/CSR mismatch errors (#422, #425) on all pages cause layout jumps and degrade performance.
10. **Service role key needs rotation** - The Supabase SERVICE_ROLE_KEY (full database bypass) exists in `.env.local` in the working directory. While gitignored, it should be rotated as a precaution.

---

## 1. Financial Integrity Assessment

### 1.1 Invoice Calculations

The invoice calculation pipeline is consistent across three code paths (new invoice modal, edit page, retainer auto-draft), all following the same formula: `subtotal = SUM(amount * quantity)`, `tax = subtotal * (taxRate / 100)`, `total = subtotal + tax`. Tax rates are correctly applied: 18% for GST, 0% for International and Non-GST.

**Critical Issues:**

- **No rounding on any calculation.** All three paths use raw floating-point arithmetic. The database column `NUMERIC(12,2)` will truncate (not round) the value, creating systematic under-billing. For example, a tax of 17999.9982 is stored as 17999.99, not 18000.00. Files: `src/components/shared/new-invoice-modal.tsx:85-87`, `src/app/(dashboard)/invoices/[id]/edit/page.tsx:117-120`, `src/lib/hooks/use-invoices.ts:407-411`.

- **Edit page does not update line items in the database.** The `updateInvoice.mutate()` call only updates the `invoices` table row. The `invoice_line_items` table retains the old values. The invoice PDF reads from `invoice_line_items`, so after an edit, the PDF shows stale line items while the totals reflect the edited values. File: `src/app/(dashboard)/invoices/[id]/edit/page.tsx:150-172`.

### 1.2 Payment & Balance Logic

Payment recording follows a sound architecture: insert payment, re-query all payments, compute totals, update invoice status. The `Math.max(0, ...)` guard prevents negative balances.

**Critical Issues:**

- **TDS not deducted from balance_due.** Formula at `use-invoices.ts:852` is `balanceDue = Math.max(0, total_amount - totalReceived)`. TDS is tracked separately (`total_tds_deducted`) but never subtracted. In Indian practice, when a client deducts 10% TDS, the remaining 10% should be satisfied by TDS - not require additional payment. This leaves every TDS-affected invoice perpetually in "partially_paid" status.

- **Floating-point accumulation in payment totals.** The `.reduce()` on `amount_received` values uses raw addition. Three payments of Rs.33.33 would sum to 99.99000000000001, not 99.99. File: `use-invoices.ts:834-841`.

- **Overpayments silently accepted.** No validation checks `amount_received <= balance_due`. A payment of Rs.999,999 on a Rs.17,500 invoice would be accepted, corrupting financial reporting. No server-side constraints exist. File: `use-invoices.ts:811-891`.

- **No overdue auto-detection.** There is no cron job, database trigger, or on-access check to transition invoices from "sent" to "overdue" when `due_date` passes. The dashboard KPI counts only invoices manually set to "overdue" status, which means the overdue count will perpetually undercount.

### 1.3 Tax Handling (GST/IGST/TDS)

- **GST split not implemented.** Indian tax law requires intra-state transactions to show CGST (9%) + SGST (9%), and inter-state to show IGST (18%). The system shows a single "GST @ 18%" line on all GST invoices regardless of client location. File: `src/lib/pdf/invoice-pdf.tsx:597-605`.

- **TDS tracking is functional** but disconnected from balance calculations (see 1.2 above). TDS amounts are correctly accumulated across payments and stored on the invoice record.

- **GSTIN inconsistency.** Email templates show GSTIN `29AADCW8591N1ZA` while the Settings page defaults show `29AAECW2882M1ZW`. These may represent different entities, but the inconsistency in official communications is a compliance risk.

### 1.4 Multi-Currency

- **Indian numbering format applied to all currencies in invoice PDF.** The `formatCurrency()` function in `invoice-pdf.tsx:53` uses `toLocaleString("en-IN")` for USD, AED, GBP, and EUR amounts. A $1,234,567 invoice would display as "$12,34,567.00" instead of "$1,234,567.00". This is unprofessional for international clients.

- **EUR falls through to Rs. symbol.** The currency switch statement has no EUR case, so Euro amounts display with "Rs." prefix. File: `invoice-pdf.tsx:44-54`.

- **Revenue mixing currencies.** Dashboard KPIs use `amount_received_inr ?? amount_received` as a fallback. If a USD payment lacks the INR conversion field, a $5,000 payment would be counted as Rs.5,000 in revenue totals. Files: `use-analytics.ts:398-401`, `004_analytics.sql:14`.

- **The centralized `format.ts` handles currencies correctly** (uses `en-US` for non-INR). The issue is isolated to the PDF renderer which has its own local `formatCurrency()`.

### 1.5 Revenue Recognition

- **Cash-basis accounting is used consistently** across dashboard, P&L views, and reports. Revenue is recognized on payment date, not invoice date. This is appropriate for a small business.

- **Pro Forma conversion creates no payment record.** When converting a proforma to a real invoice (`use-invoices.ts:717-728`), the invoice is marked "paid" with `total_received = total_amount`, but no record is inserted into `invoice_payments`. Since all revenue views (P&L, dashboard KPIs) query from `invoice_payments`, this revenue becomes invisible. The invoice appears "paid" in the list but contributes zero to revenue metrics.

- **`revenue_by_client_view` drops foreign revenue.** This SQL view uses `COALESCE(SUM(ip.amount_received_inr), 0)` without falling back to `amount_received`. Foreign currency payments without INR conversion show as Rs.0 collected, while the P&L view counts them at their original currency value. This inconsistency makes client-level vs. total revenue not reconcile.

### 1.6 P&L and Analytics Accuracy

- **Transfers and loans counted as expenses.** The `monthly_pl_view` filters `WHERE transaction_type != 'income'`, which still includes transfer, tax, and loan transaction types. Inter-account transfers inflate the expense line. Loan principal repayments (which are not operating expenses) also inflate expenses. This deflates reported net profit. File: `supabase/migrations/004_analytics.sql:25`.

- **`useExpenseSummary` hook has the same issue.** It sums all debit transactions regardless of type. File: `use-transactions.ts:275`.

- **`client_health_scores` view double-counts invoices.** If an invoice has 3 partial payments, it is counted 3 times in `paid_count` because the JOIN between invoices and payments produces one row per payment. This inflates health metrics. File: `004_analytics.sql:94`.

### 1.7 Investor Reports

- **Quarterly report covers 2 months instead of 3.** The date range calculation at `use-reports.ts:109-111` creates `quarterEnd = new Date(year, month + 1, 0)` which yields the last day of month 2 (e.g., May 31 for Q1 Apr-Jun). The correct formula is `month + 2`. Every quarterly report understates revenue and expenses by approximately one-third.

- **Report PDF title is hardcoded as "Monthly Performance Report"** regardless of whether it is monthly, quarterly, or annual. File: `report-pdf.tsx:346`.

- **Active clients/projects counts are point-in-time.** A December 2025 report generated in March 2026 would show March 2026's client count, not December's. File: `use-reports.ts:162-171`.

- **No charts/visualizations in report PDF.** Only metric cards and tables. For investor consumption, visual trend charts would significantly improve the report's impact.

**Financial Accuracy Score: 3/10**

---

## 2. Module-by-Module Functional Results

### 2.1 Dashboard
- **Status:** Functional with issues
- Load time: 9,145ms (slowest page)
- 4 console errors (RSC payload fetch failures, Supabase auth timeout)
- Hero section shows "No data" for zero-value periods instead of a helpful message
- Quick Actions dropdown duplicates FAB functionality
- Dashboard KPIs are functional but affected by revenue/expense calculation issues documented in Section 1

### 2.2 Clients
- **Status:** Functional
- 10 clients displayed correctly with metadata (type, status, health score)
- Client detail page has 4 tabs (Overview, Projects, Invoices, Payments) - all load
- Search works but partial name matching may miss some entries (search "Dde" returned 0 for "Ddemo")
- No GSTIN format validation on client creation
- No pagination - will not scale past 50+ clients

### 2.3 Projects
- **Status:** Functional with gaps
- 10 projects listed with client associations
- New project form works, though billing day field is missing for retainer projects
- Progress bar is editable but has no visual affordance (no pencil icon)
- Hardcoded date `new Date("2026-03-03")` in trajectory calculations instead of current date. File: `projects/page.tsx:55,73`
- No project detail page - clicking a project does not navigate anywhere
- **Not in main navigation** - only accessible via FAB or analytics quick-links

### 2.4 Invoices
- **Status:** Core functionality works, critical calculation issues
- 10 invoices in table with working status filters (Draft, Sent, Paid, Overdue, Proforma, Archived)
- Invoice number formats are correct: GST (G#####), Non-GST (NG#####), Proforma (PF-YYYYMMDD-###)
- New invoice modal works with client selection, line items, service catalog integration
- Invoice detail page shows payment summary, email activity, status transitions
- CSV export button present and functional
- **Issues:** Zero-amount line items accepted, edit does not save line items (see 1.1), auto-archive runs on page load without user consent

### 2.5 Payments
- **Status:** Functional with critical validation gaps
- 4 KPI cards (Total Received, Outstanding, Overdue, TDS Deducted)
- Payment recording modal has proper fields (amount, date, method, reference, TDS, notes)
- Supports multiple payment methods: Bank Transfer, UPI, Skydo (USD/AED/GBP), Other
- **Issues:** No server-side validation on amount (overpayment accepted), TDS excluded from balance (see 1.2), payment rows not clickable to invoice detail, no pagination

### 2.6 Expenses
- **Status:** Functional
- Bank statement upload works (XLSX parsing, auto-categorization, 20-row preview)
- Category breakdown with charts
- Recent transactions section limited to 10 items with no pagination
- **Issues:** Transactions page lacks filtering controls, no approval workflow for imported transactions, expense totals include transfers/loans (see 1.6)

### 2.7 Contracts
- **Status:** Partially functional
- Contract list page works with 1 contract displayed
- Creation is handled via modal on the list page
- Status workflow: draft -> sent -> accepted -> active
- PDF generation includes comprehensive legal boilerplate (11 sections)
- **Issues:** `/contracts/new` route returns 404 (empty directory, no page.tsx), contract PDF lacks pricing section, client party details incomplete, **not in main navigation**

### 2.8 Analytics (all sub-pages)
- **Status:** Functional UI, accuracy issues in underlying data
- 7 sub-pages: Overview, P&L, Balance, Invoices, Expenses, Clients, Projects
- Charts render correctly with Recharts
- FY filter and date range controls work
- **Issues:** P&L affected by expense over-counting (see 1.6), client health scores inflated (see 1.6), revenue mixing currencies (see 1.4), all 7 pages have horizontal overflow on mobile

### 2.9 Reports
- **Status:** Functional with critical date bug
- Report generation works for monthly, quarterly, and annual types
- PDF generation produces professional-looking reports with CONFIDENTIAL badge
- Investor report email flow is the only fully wired email flow
- **Issues:** Quarterly date range bug (see 1.7), report title always says "Monthly", no charts in PDF

### 2.10 Pipeline
- **Status:** Functional
- Shows invoices to raise, scheduled invoices, and forecast
- Pipeline forecast chart provides revenue projections
- **Issues:** Duplicate "New Invoice" buttons, forecast chart duplicates pipeline card information

### 2.11 Financial Targets
- **Status:** Functional
- 9 target cards with progress tracking
- Create, delete, and refresh functionality works
- Confirmation dialog on delete
- **Issues:** FY hardcoded to "2025-26" (`targets/page.tsx:23`) instead of auto-computed, "Refresh" button purpose unclear, button labeled "New Goal" vs module called "Financial Targets"

### 2.12 TDS Certificates
- **Status:** Unimplemented
- `/tds` route returns 404 - no page.tsx exists anywhere for this route
- TDS certificate management is listed as a feature but is entirely missing
- The database tables exist (created in migrations 001 and 007) but have no UI
- This is a critical feature for Indian tax compliance

### 2.13 Settings
- **Status:** Functional UI, no server persistence
- 8 tabs: Company, Bank Details, Invoice, Services, Email Templates, Contracts, Users, Notifications
- All tabs render content
- **Critical Issue:** All settings stored in localStorage only (`wodo_company`, `wodo_logo_light`, `wodo_logo_dark`, `wodo_stamp`). Data is lost on browser clear or device switch. For a multi-user SaaS, settings must persist to the database.
- Email template editor is decorative - customizations are never used by the actual send flow
- No save confirmation toast

### 2.14 Onboarding
- **Status:** Functional
- Multi-step wizard with invoice type configuration, email setup, project setup
- Invoice type selection (GST, Non-GST, International) works
- **Issues:** No visual step progress indicator, cancel button can lose data without warning, **not in main navigation**

### 2.15 Services
- **Status:** Functional (within Settings)
- Services management is under Settings > Services tab
- Add service button present
- Services integrate with invoice line item dropdown
- **Issues:** 0 services detected via standard table selectors (may use custom layout)

---

## 3. Cross-Module Integration Assessment

### 3.1 Data Flow Map

```
auth.users -> profiles (CASCADE)
     |
     v
  clients -> projects (CASCADE on client delete)
     |            |
     |            +-> contracts (no cascade - blocks delete)
     |            +-> scheduled_invoices (project SET NULL)
     |
     +-> invoices (no cascade - blocks delete)
     |       |
     |       +-> invoice_line_items (CASCADE)
     |       +-> invoice_payments (CASCADE)
     |       +-> invoice_email_activity
     |
     +-> client_contacts (CASCADE)
     +-> tds_certificates (no cascade)

  bank_statements -> transactions (CASCADE)
       |
       +-> expense_categories -> expense_rules (CASCADE)

  services -> invoice_line_items.service_id (SET NULL)
           -> projects.service_id (SET NULL)
```

### 3.2 Broken Linkages

- **Invoice PDF uses wrong bank account.** The hardcoded account in `invoice-pdf.tsx:91,101` (10113982735, IDFB0080181) does not match `constants.ts:21-22` or `settings/page.tsx:112` (10213871315, IDFB0080574). Clients paying via the PDF would send money to the wrong account.

- **Non-GST invoice PDF uses company bank instead of personal account.** The `constants.ts` non-GST account is `10221086461` under "Shyam Singh Bhati" (personal), but the PDF renders the same company account as GST invoices.

- **Proforma conversion breaks revenue tracking.** Converted proformas are marked "paid" on the invoice record but have zero entries in `invoice_payments`, making them invisible to all revenue aggregation queries.

- **Settings templates disconnected from email send flow.** The Settings email template editor stores customizations in localStorage. The actual `/api/email/send` route uses hardcoded templates from `src/lib/email/templates.ts`. User customizations are silently ignored.

### 3.3 Missing Connections

- **No project profitability.** Revenue per project can be derived (via `project_ids` array on invoices) and expenses per project exist (via `transactions.project_id`), but no view or hook computes project profitability (revenue - expenses).

- **No client-level P&L.** `revenue_by_client_view` exists for revenue, but no expense attribution to clients. No unified financial activity view per client.

- **Expenses not linked to invoices.** Bank statement transactions can be linked to invoices (`transactions.linked_invoice_id`) but this linkage is not exposed in the UI.

- **No notification system.** The notification dropdown shows hardcoded demo data. No backend notification table or real-time notification delivery exists.

### 3.4 Orphan Risks

- **Deleting a client cascades projects but blocks on invoices.** `projects` has `ON DELETE CASCADE` but `invoices` has no cascade. Attempting to delete a client with invoices will fail with a FK constraint error. The `useDeleteClient` hook does not handle this gracefully - user sees an unhelpful error.

- **`invoices.project_ids` is a UUID array, not a FK.** If projects are deleted (via client cascade), the UUID array retains dangling references to deleted projects. No referential integrity is enforced on this column.

- **Deleting contracts is blocked** if client still exists (no cascade), which is protective but the error message is opaque.

---

## 4. Security Assessment

### 4.1 Authentication
- Supabase Auth with cookie-based sessions - functional
- All 14 protected routes correctly redirect unauthenticated users to `/login`
- Session persistence works across tabs
- Generic error messages on login failure (does not reveal user existence)
- **Issues:** No forgot password flow, no brute force protection (no rate limiting, CAPTCHA, or lockout), no idle session timeout, client-side privilege escalation logic on first login (`login/page.tsx:54`)

### 4.2 Authorization (RBAC)
- UI-level role checks via `useAuth()` hook (`isAdmin`, `isManagerOrAbove`, etc.)
- RLS write policies enforce role restrictions at DB level (admin/manager for clients, admin/manager/accountant for invoices, etc.)
- **Critical Gap:** All SELECT policies use `auth.uid() IS NOT NULL` - any authenticated user can READ all financial data regardless of role. A "viewer" can see every invoice, payment, bank statement, and contract.
- **No server-side role checks on API routes.** All API routes only verify `user exists`, never `user has correct role`. A viewer can send emails and export all invoice data via API.

### 4.3 Row Level Security
- RLS is enabled on all main tables with appropriate write restrictions
- **Exception:** Migration `007_tds_certificates.sql` creates a `tds_certificates` table WITHOUT RLS enabled. If this migration runs on a clean database, TDS data would be accessible without authentication.
- `profiles` table SELECT policy uses `USING (true)` - allows reads without authentication via anon key. File: `001_schema.sql:21`.
- `scheduled_invoices` SELECT policy also uses `USING (true)` for the authenticated role.

### 4.4 API Security
- All 4 current API routes check authentication via `supabase.auth.getUser()`
- All return 401 for unauthenticated requests (verified via curl)
- Input validation is present on most routes (invoiceType validation, date format checks)
- **Architectural Risk:** Middleware at `src/middleware.ts:39` excludes ALL `/api/*` routes from auth checks. Each route handles its own auth. If a new API route is added without auth checks, it will be publicly accessible.

### 4.5 HTTP Security Headers
**All 7 standard security headers are MISSING.** No `headers()` configuration exists in `next.config.mjs`.

| Header | Status | Risk |
|---|---|---|
| Content-Security-Policy | MISSING | XSS, code injection |
| Strict-Transport-Security | MISSING | SSL stripping |
| X-Frame-Options | MISSING | Clickjacking |
| X-Content-Type-Options | MISSING | MIME-type sniffing |
| Referrer-Policy | MISSING | Information leakage |
| Permissions-Policy | MISSING | Feature policy |
| X-XSS-Protection | MISSING | Legacy XSS protection |

### 4.6 Input Sanitization
- React auto-escapes JSX output - standard XSS protection is in place
- `dangerouslySetInnerHTML` is used in `settings/page.tsx:1527,1762` for email template preview. If template data contains script tags, they would execute.
- Email templates interpolate client names and invoice numbers directly into HTML without escaping. A client name containing `<script>` tags would be injected into outgoing emails. File: `src/lib/email/templates.ts`.
- `/api/email/send` accepts arbitrary HTML body override, allowing authenticated users to send phishing emails with arbitrary content via company email.
- No email format validation on the `/api/email/send` endpoint's `to` field.

### 4.7 Secrets Management
- `.env.local` contains real Supabase SERVICE_ROLE_KEY in the working directory. While `.gitignore` protects it, the key should be rotated.
- Bank account numbers, IFSC codes, IBAN, and ACH routing numbers are hardcoded across 5 source files instead of environment variables or secure configuration.
- SMTP client falls back to hardcoded `"accounts@wodo.digital"` when env vars are missing. File: `src/lib/email/client.ts:9`.
- TLS configuration uses deprecated SSLv3 ciphers. File: `src/lib/email/client.ts:14`.
- `createAdminClient()` function is defined but never called anywhere in the codebase (dead code). The service role key is technically unused at runtime.

**Security Score: 3/10**

---

## 5. UX, Accessibility & Responsiveness

### 5.1 Desktop UX Summary

| Page | Score | Load Time | Key Issue |
|---|---|---|---|
| /dashboard | 7/10 | 9,145ms | Console errors, duplicated Quick Actions |
| /clients | 8/10 | 7,745ms | No pagination, hover-dependent actions |
| /invoices | 8/10 | 7,606ms | Misleading KPI label, no pagination |
| /payments | 7.5/10 | 7,024ms | No link to invoice detail, no Record Payment CTA |
| /expenses | 8/10 | 7,413ms | Only 10 recent transactions shown |
| /expenses/upload | 7/10 | 6,130ms | Unclear file format instructions |
| /expenses/transactions | 7/10 | 6,461ms | 6 truncated text elements, no pagination |
| /analytics | 8/10 | 6,765ms | "No data" messaging confusing |
| /analytics/pl | 7.5/10 | 6,236ms | No export capability |
| /analytics/balance | 7.5/10 | 6,869ms | -- |
| /analytics/invoices | 8/10 | 6,172ms | -- |
| /analytics/expenses | 7.5/10 | 6,342ms | -- |
| /analytics/clients | 8/10 | 6,146ms | -- |
| /analytics/projects | 7.5/10 | 6,543ms | -- |
| /projects | 8/10 | 7,597ms | Not in nav, no detail page |
| /contracts | 7.5/10 | 6,975ms | /contracts/new is 404 |
| /reports | 7/10 | 6,390ms | Send/Delete buttons too close together |
| /pipeline | 8.5/10 | 7,262ms | Duplicate New Invoice buttons |
| /targets | 8/10 | ~6,500ms | Hardcoded FY, unclear Refresh button |
| /settings | 7/10 | ~6,500ms | localStorage only, tabs hidden on mobile |
| /onboard | 8/10 | ~6,500ms | No step progress indicator |

Average desktop UX score: 7.6/10
Average page load time: 6,900ms (all pages >6 seconds)

### 5.2 Mobile Responsiveness

9 out of 21 pages have horizontal overflow on mobile (375px viewport):

| Page | Overflow | Mobile Score | Small Touch Targets |
|---|---|---|---|
| /clients | YES | 5/10 | 24 |
| /analytics (all 7) | YES | 5/10 | 8 each |
| /reports | YES | 5/10 | 16 |
| /settings | No (but tabs hidden) | 5/10 | 25 |
| /expenses/transactions | No | 4/10 | 90 |

**Key mobile issues:**
- Analytics sub-nav uses `min-w-max` preventing wrapping - all 7 analytics pages overflow
- Client filter pill groups exceed viewport width
- Settings tab bar truncated - only 3 of 8 tabs visible with no scroll indicator
- Invoice table hides Status column on mobile (`hidden sm:table-cell`) - critical information lost
- FAB overlaps content on several pages
- /expenses/transactions has 90 touch targets under the 44px minimum

### 5.3 Accessibility
- **Near-zero ARIA attributes.** Only 3 instances of `aria-label` found in the entire `src/` directory
- No `role` attributes on interactive elements (dropdowns, modals, tabs, menus)
- No skip-to-content link
- No focus trap in modals - tab can escape to background content
- 2-3 icon-only buttons per page without any text label, aria-label, or title attribute
- No keyboard navigation support for dropdowns (no Arrow keys, Escape)
- Charts have no alternative text for screen readers
- Color contrast concerns: `rgba(255,255,255,0.3)` text on dark backgrounds may fail WCAG AA 4.5:1

### 5.4 Performance
- **Every page loads in 6-9 seconds.** All pages use `"use client"` with client-side data fetching. No server-side rendering or static generation is used for initial data.
- **React hydration errors (#422, #425) on every page load.** Systematic SSR/CSR mismatch likely caused by date formatting or locale-dependent rendering producing different results on server vs client.
- **58 console errors detected** across 12 pages in automated testing (RSC payload failures, auth timeouts, HTTP 400/406 responses)
- Dashboard makes 6 sequential Supabase queries for KPIs - could be parallelized or combined
- `@react-pdf/renderer` (~1.5MB) imported synchronously - should use dynamic imports
- Client-side text search on transactions downloads ALL rows then filters in JavaScript

### 5.5 Navigation & Information Architecture
- Top navigation is visually polished with dark pill design and accent color highlighting
- Mobile hamburger menu works correctly
- Browser back/forward navigation functions properly
- **3 pages not accessible from navigation:** Projects, Contracts, and TDS (all require direct URL or FAB)
- Settings only accessible via gear icon (hidden on mobile)
- Onboarding only accessible via FAB or direct URL
- No breadcrumbs on any detail page
- Back button uses `router.back()` instead of parent route - navigates to previous site if arriving from external link
- 6 different entry points for "New Invoice" - excessive redundancy
- Notification dropdown shows hardcoded fake data

### 5.6 Recommended UX Improvements
1. Add ARIA attributes to all interactive elements (2-3 hours)
2. Fix mobile overflow on Analytics and Clients pages (1 hour)
3. Add Projects, Contracts, TDS to main navigation (30 minutes)
4. Add pagination to all list pages (3-4 hours)
5. Persist Settings to database instead of localStorage (4-6 hours)
6. Implement server-side rendering for initial page loads (8-12 hours)
7. Add focus traps to all modals (2-3 hours)
8. Replace hardcoded notifications with real data or remove (15 minutes to remove)
9. Fix back button to use parent route (15 minutes)
10. Add breadcrumbs to detail pages (1-2 hours)

### 5.7 Elements to Remove or Consolidate
1. **Hero section Quick Actions dropdown** - duplicates FAB entirely
2. **Duplicate "New Invoice" button on Pipeline page** - keep only the contextual one
3. **"Total revenue: See invoices" placeholder card on Clients** - shows no data
4. **Fake notification data** in TopNavV2.tsx - misleading
5. **PageHeader component on Contracts only** - inconsistent with all other pages
6. **Settings email template editor** - gives illusion of customization that is never used

**UX Score: 4/10**

---

## 6. Email System Assessment

### 6.1 Current State

The email system has two competing endpoints creating a confusing architecture:

1. `/api/invoices/[id]/send-email` - **STUB.** Returns `{ success: true }` without sending. This is what the UI calls. Contains a TODO comment on line 50-51.
2. `/api/email/send` - **Functional.** Integrates with Nodemailer/Office 365 SMTP. Only used by investor report flow.

**The invoice email flow is completely broken.** When a user clicks "Send Invoice" and composes an email, the modal calls the stub endpoint. The user sees "Email sent successfully" but no email is dispatched. This is the most significant functional gap - a financial platform where invoice delivery does not work.

The investor report email flow IS properly wired through `/api/email/send` and would work if SMTP credentials are configured.

### 6.2 Template Quality
- 4 HTML email templates with professional WODO branding (dark header, orange accent)
- 600px max-width container (email standard)
- Inline CSS used correctly for email compatibility
- Shared `wrapTemplate()` wrapper for consistency
- **Issues:** `display: flex` used (breaks Outlook/Yahoo), `<style>` in `<head>` (stripped by Gmail), no plaintext fallback, no HTML escaping on template variables (XSS risk), duplicate `style` attribute on investor report revenue span

### 6.3 Before Activating SMTP
- [ ] Wire invoice email modal to `/api/email/send` instead of the stub endpoint
- [ ] Add PDF attachment generation for invoice emails
- [ ] HTML-escape all template variables (clientName, invoiceNumber, etc.)
- [ ] Remove `tls: { ciphers: "SSLv3" }` from SMTP config
- [ ] Add SMTP credential detection with clear error messaging
- [ ] Create Nodemailer transport singleton (currently recreated per email)
- [ ] Add retry logic for transient SMTP failures
- [ ] Replace `display: flex` with `<table>` layouts for Outlook compatibility
- [ ] Fix type mismatch between email activity route and hook (`EmailTemplate` enum values don't match)
- [ ] Update invoice status to "sent" after successful email delivery
- [ ] Add email format validation to `/api/email/send`
- [ ] Either connect Settings template editor to send flow or remove it

**Email Readiness: 15%**

---

## 7. PDF Quality Assessment

### 7.1 Invoice PDFs

| Invoice Type | Title | Tax Line | Bank Details | Status |
|---|---|---|---|---|
| GST | TAX INVOICE | GST @ 18% (single line) | Account 10113982735 | WRONG ACCOUNT |
| International (USD) | INVOICE | None (0% tax) | Community Federal Savings Bank | Verify |
| International (AED) | INVOICE | None | Zand Bank PJSC | Verify |
| International (GBP) | INVOICE | None | "Contact accounts@wodo.digital" | INCOMPLETE |
| Non-GST | INVOICE | None | Account 10113982735 | WRONG - should be personal account |
| Pro Forma | PROFORMA INVOICE | Per underlying type | Per underlying type | OK |

**Critical Issues:**
- Bank account mismatch (see 1.1) - most severe finding in the entire audit
- Indian numbering format on all currencies (see 1.4)
- No CGST/SGST vs IGST split (see 1.3)
- Logo/stamp use `/public/` prefix paths that may fail in server-side rendering. Should use absolute URLs.
- No pagination for many line items (content overflows page)
- `formatCurrency()` does not check for NaN/null input
- `formatDate()` crashes on null input - `new Date(null)` returns epoch date

### 7.2 Contract PDFs
- Professional legal structure with 11 sections (IP, confidentiality, termination, governing law, etc.)
- Proper pagination with `wrap={false}` on sections and signature block
- Page numbers on every page
- `formatDate()` handles null properly with "N/A" return
- **Issues:** No pricing/amount section, client party details incomplete (no address), no non-Latin character support (Helvetica only)

### 7.3 Investor Report PDFs
- Clean design with CONFIDENTIAL badge, color-coded metrics
- Professional footer with company details
- `formatINR()` has excellent NaN safety with `Number.isFinite()` check
- Division-by-zero guard on profit margin calculation
- **Issues:** Title always says "Monthly Performance Report" (ignores report_type), no charts/visualizations, no month-over-month comparison data, quarterly data is wrong (2-month bug)

**PDF Quality Score: 4/10**

---

## 8. Error Handling & Edge Cases

### 8.1 Error Boundaries
- Global `error.tsx` and `global-error.tsx` exist with "Something went wrong" + "Try again" UI
- Custom 404 page with "Go to Dashboard" and "Go back" buttons
- Dashboard has a `loading.tsx` with skeleton loading
- **Gap:** No route-level error boundaries. If a single page crashes, the entire dashboard layout (including navigation) is replaced by the generic error screen. Each route group should have its own `error.tsx`.

### 8.2 Empty States
- Projects, Payments, Analytics, Reports, and Expenses have `EmptyState` components
- Clients and Invoices lists may show blank when no data (no EmptyState imported)
- Invoice detail page shows **infinite loading spinner** for invalid IDs instead of "Not Found". The condition `if (isLoading || !invoice)` treats "not found" the same as "still loading". File: `invoices/[id]/page.tsx:354-359`.

### 8.3 Input Validation
- Only 1 of ~10 forms uses Zod validation (client create form). All others use HTML `required` attributes and manual `if` checks, violating the project's own CLAUDE.md mandate for "React Hook Form + Zod for all forms."
- Negative amounts accepted in invoice line items (no `min="0"` constraint)
- Extremely large numbers accepted (999999999999) with no upper bound
- Very long text (5000+ characters) accepted in company name with no maxlength
- Double-submit partially protected via `disabled={isPending}` pattern on some forms, but not all

### 8.4 Edge Case Results

| Test | Result | Details |
|---|---|---|
| Invalid UUID client page | PASS | Shows error state, no crash |
| Non-existent invoice page | FAIL | Infinite spinner (never resolves) |
| Fake route (404) | PASS | Custom 404 page shown |
| Empty form submission | WARN | Only HTML5 native validation |
| 5000-char input | WARN | Accepted without constraint |
| Special characters (<>"'&) | PASS | React auto-escapes |
| Negative amounts | WARN | Accepted without validation |
| Large numbers | WARN | Accepted without bound check |
| Browser back/forward | PASS | Navigation works correctly |
| Rapid button clicks | PASS | Page remains functional |
| Slow network (simulated) | PASS | Loaded in ~25 seconds |
| Error message leakage | PASS | No stack traces or SQL exposed |

---

## 9. Investor Readiness Assessment

### 9.1 Can You Trust The Numbers?

**No.** In its current state, the financial data produced by WODO Ally cannot be relied upon for investor reporting. The specific reasons:

1. **Revenue is understated** for companies that receive payments with TDS deduction (common for Indian B2B). The balance_due formula ignores TDS, so invoices appear unpaid even when the client has fulfilled their obligation.
2. **Revenue is invisible** for converted pro forma invoices - they show as "paid" but contribute zero to revenue aggregates.
3. **Expenses are overstated** because inter-account transfers and loan repayments are counted as operating expenses in the P&L view.
4. **Quarterly reports miss an entire month** of data due to the date range bug.
5. **Currency mixing** means a $5,000 USD payment without INR conversion is counted as Rs.5,000 instead of approximately Rs.420,000.
6. **Client health scores are inflated** due to double-counting of invoices with multiple payments.

### 9.2 Report Quality
The investor report PDF has a professional appearance with the CONFIDENTIAL badge, color-coded metrics, and clean layout. However, the underlying data feeding these reports is unreliable (see above). The lack of charts/visualizations also makes the reports less compelling for investor consumption. The title hardcoded as "Monthly" for all report types is a cosmetic but embarrassing issue.

### 9.3 Critical Blockers for Investor Presentation
1. Fix quarterly date range calculation (the single most impactful fix)
2. Fix expense categorization to exclude transfers/loans
3. Fix currency mixing in revenue aggregation
4. Fix TDS balance calculation
5. Create payment records for proforma conversions
6. Fix bank account numbers in invoice PDFs (reputational risk)
7. Add charts/visualizations to report PDF

### 9.4 What Impresses
- The concept of an integrated financial management platform with client management, invoicing, payments, expenses, analytics, pipeline, and investor reporting is ambitious and valuable
- The dark glass-card UI design is distinctive and professional
- The database schema is well-designed with proper relationships, audit columns, and thoughtful RLS policies
- Cash-basis accounting is implemented consistently
- The Indian FY (April-March) and quarter boundaries are correctly calculated in most places
- Multiple currency support with INR normalization is architecturally sound (execution needs fixes)
- The analytics dashboard with 7 specialized sub-pages shows strong product thinking

**Investor Readiness Score: 3/10**

---

## 10. Prioritized Fix Roadmap

### Tier 1: Fix Immediately (Critical - Data/Money at Risk)

| # | Issue | Impact | File:Line | Effort |
|---|---|---|---|---|
| 1 | Fix bank account numbers in invoice PDF | Clients paying to wrong bank account | `invoice-pdf.tsx:91-104` + `constants.ts:21-22` | 30 min |
| 2 | Add `Math.round(value * 100) / 100` to all financial calculations | Cent-level errors on every invoice | `new-invoice-modal.tsx:85-87`, `edit/page.tsx:117-120`, `use-invoices.ts:407-411` | 1 hour |
| 3 | Fix quarterly report date range (`report_month + 2`) | Investor reports understate revenue by ~33% | `use-reports.ts:110` | 5 min |
| 4 | Fix TDS in balance_due formula (`total_amount - totalReceived - totalTds`) | Indian invoices stuck as partially paid | `use-invoices.ts:852` | 15 min |
| 5 | Fix edit page to save line items (upsert `invoice_line_items`) | PDF shows stale data after edit | `edit/page.tsx:150-172` | 2 hours |
| 6 | Wire invoice email to `/api/email/send` (not stub) | Invoice emails not actually sent | `send-invoice-email-modal.tsx:100`, `send-email/route.ts:50-51` | 2 hours |
| 7 | Add HTTP security headers to `next.config.mjs` | All 7 security headers missing | `next.config.mjs` | 30 min |
| 8 | Add server-side payment amount validation | Overpayments corrupt financial data | `use-invoices.ts:811-891` | 2 hours |
| 9 | Rotate Supabase SERVICE_ROLE_KEY | Key exposed in working directory | `.env.local` (line 4) | 15 min |
| 10 | Fix `formatDate()` null safety | Crashes on null date fields | `src/lib/utils/format.ts` | 10 min |

**Estimated total: ~1 day**

### Tier 2: Fix Before Production Use (High)

| # | Issue | Impact | File:Line | Effort |
|---|---|---|---|---|
| 11 | Add overdue auto-detection (cron or edge function) | Overdue KPI always 0 | No file exists - new implementation | 3 hours |
| 12 | Fix Indian numbering on non-INR currencies in PDF | "$12,34,567" on international invoices | `invoice-pdf.tsx:44-54` | 30 min |
| 13 | Fix expense type filtering (exclude transfers/loans) | P&L overstates expenses | `004_analytics.sql:25`, `use-transactions.ts:275` | 1 hour |
| 14 | Fix currency mixing in revenue aggregation | USD counted as INR when conversion missing | `use-analytics.ts:398-401`, `004_analytics.sql:14` | 2 hours |
| 15 | Create payment record on proforma conversion | Converted proforma revenue invisible | `use-invoices.ts:717-728` | 1 hour |
| 16 | Add role-based authorization to API routes | Viewers can send emails, export data | All files in `src/app/api/` | 3 hours |
| 17 | Fix React hydration errors | Layout jumps on every page | Multiple files - SSR/CSR audit needed | 4 hours |
| 18 | Fix infinite spinner on invalid invoice ID | Users stuck on loading forever | `invoices/[id]/page.tsx:354-359` | 15 min |
| 19 | Migrate Settings from localStorage to database | Settings lost on browser clear | `settings/page.tsx` | 4-6 hours |
| 20 | Add TDS certificates page (/tds) | Feature listed but unimplemented | New page needed | 8 hours |
| 21 | Fix client_health_scores double-counting | Inflated health metrics | `004_analytics.sql:94` | 1 hour |
| 22 | Fix profiles RLS to require authentication | Unauthenticated reads possible | `001_schema.sql:21` | 10 min |
| 23 | Fix `/contracts/new` 404 | Dead route, console errors | Remove empty directory or add redirect | 10 min |
| 24 | Add route-level error boundaries | Page crash replaces entire dashboard | Add `error.tsx` per route group | 1-2 hours |
| 25 | HTML-escape email template variables | XSS risk in outgoing emails | `src/lib/email/templates.ts` | 1 hour |

**Estimated total: ~4-5 days**

### Tier 3: Fix Before Investor Demo (Medium)

| # | Issue | Impact | File:Line | Effort |
|---|---|---|---|---|
| 26 | Implement GST CGST/SGST vs IGST split | Tax compliance requirement | `invoice-pdf.tsx:597-605` | 4 hours |
| 27 | Add pagination to all list pages | Performance degrades with data growth | clients, invoices, payments, transactions pages | 3-4 hours |
| 28 | Add ARIA attributes to interactive elements | Accessibility compliance | Multiple components | 2-3 hours |
| 29 | Fix mobile overflow on Analytics pages | 7 pages unusable on mobile | `analytics-sub-nav.tsx` | 30 min |
| 30 | Add Projects, Contracts, TDS to navigation | 3 pages hidden from users | `TopNavV2.tsx` NAV_TABS array | 30 min |
| 31 | Fix report PDF title for report type | "Monthly" shown for quarterly/annual | `report-pdf.tsx:346` | 10 min |
| 32 | Add charts to investor report PDF | Reports lack visual impact | `report-pdf.tsx` | 4-6 hours |
| 33 | Remove fake notification data | Misleading to users | `TopNavV2.tsx:75-129` | 15 min |
| 34 | Fix SMTP TLS configuration (remove SSLv3) | Connection failures or downgrade attacks | `email/client.ts:14` | 5 min |
| 35 | Add Zod validation to invoice and payment forms | Invalid data reaches database | `new-invoice-modal.tsx`, payment modal | 3-4 hours |
| 36 | Fix `revenue_by_client_view` foreign currency handling | Client revenue reports incomplete | `004_analytics.sql:47` | 30 min |
| 37 | Complete GBP bank details in invoice PDF | Incomplete international support | `invoice-pdf.tsx:124-130` | 15 min |
| 38 | Add middleware-level auth for API routes | Defense-in-depth gap | `middleware.ts:39` | 2 hours |
| 39 | Fix hardcoded date in Projects page | Trajectory calculations use stale date | `projects/page.tsx:55,73` | 2 min |
| 40 | Fix hardcoded FY in Targets page | Targets stuck on 2025-26 | `targets/page.tsx:23` | 10 min |

**Estimated total: ~3-4 days**

### Tier 4: Polish & Enhance (Low)

| # | Issue | Impact | File:Line | Effort |
|---|---|---|---|---|
| 41 | Implement password reset flow | Users cannot recover accounts | New feature | 2-3 hours |
| 42 | Add CSRF tokens for state-changing operations | Partial protection only (SameSite=Lax) | Multiple files | 3-4 hours |
| 43 | Add breadcrumbs to detail pages | Navigation context lost | Detail page layouts | 1-2 hours |
| 44 | Move bank details to database config | Hardcoded across 5 files | invoice-pdf.tsx, constants.ts, etc. | 3-4 hours |
| 45 | Add keyboard navigation to dropdowns | Accessibility improvement | All dropdown components | 2-3 hours |
| 46 | Consolidate currency formatting to single function | 6+ local implementations with different rules | Multiple files | 2 hours |
| 47 | Consolidate FY helpers to single function | 4 different implementations | use-analytics.ts, use-targets.ts, use-reports.ts, format.ts | 1 hour |
| 48 | Add audit logging for sensitive operations | Compliance requirement | New feature | 4-6 hours |
| 49 | Add form dirty state protection | Data loss on navigation | All form pages | 2-3 hours |
| 50 | Implement server-side rendering for initial loads | 6-9 second page loads | Architectural change | 8-12 hours |
| 51 | Add idle session timeout | Unattended sessions on shared computers | New feature | 1-2 hours |
| 52 | Register Unicode font for PDFs | Non-Latin characters render as blanks | PDF components | 1-2 hours |
| 53 | Split settings/page.tsx (2140 lines) | Largest file, maintenance burden | settings/page.tsx | 3-4 hours |
| 54 | Move Playwright to devDependencies | 50MB unnecessary in production | package.json | 5 min |
| 55 | Remove `x-powered-by: Next.js` header | Framework version disclosure | next.config.mjs | 2 min |

**Estimated total: ~5-7 days**

**Total remediation estimate: ~14-17 working days**

---

## 11. What Works Well

Despite the critical issues identified, WODO Ally demonstrates strong fundamentals that should be acknowledged:

1. **Thoughtful database design.** The Supabase schema uses proper data types (`NUMERIC(12,2)` for money, `UUID` for IDs), appropriate foreign key relationships, and RLS policies on all major tables. The migration files are well-organized and incrementally additive.

2. **Consistent hook architecture.** All data access flows through TanStack Query hooks with uniform error handling patterns (`throw new Error()`, `?? []` fallbacks, `toast.success()`/`toast.error()` notifications). The separation of concerns is clean.

3. **Professional PDF generation.** The contract PDF in particular has comprehensive legal structure with 11 standard clauses. Invoice PDFs include proper Indian tax document elements (GSTIN, CIN, authorized signatory, stamp). The report PDF has an investor-appropriate design.

4. **Correct Indian financial year handling.** FY boundaries (April 1 - March 31), quarter definitions (Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar), and FY string formatting are implemented correctly throughout the codebase.

5. **Strong authentication foundation.** All 14 protected routes redirect unauthenticated users. API routes all check auth. The Supabase client/server/admin separation is correctly implemented with the admin client never exposed to client-side code.

6. **Visually distinctive UI.** The dark glass-card design system with the orange accent color creates a professional and unique aesthetic. The dashboard design with DarkSection components and KPI cards is visually impressive.

7. **Comprehensive feature scope.** The platform covers clients, projects, invoices (4 types), payments, expenses (bank statement import), contracts, analytics (7 sub-pages), investor reports, pipeline, financial targets, TDS tracking, services, and settings - an ambitious and valuable feature set for an agency.

8. **Good error handling in hooks.** All Supabase queries check for errors and propagate them. Null safety with `?? 0` and `?? []` patterns is consistently applied. Division by zero is guarded in most calculation paths.

9. **Realtime subscriptions.** The TanStack Query + Supabase realtime integration automatically invalidates cached queries when data changes, keeping the UI fresh without manual refresh.

10. **Clean code quality.** No console.log statements in production code. No commented-out code blocks. No em dashes. TypeScript strict mode enabled. ESLint configured and passing.

---

## Appendix A: Complete Issue Registry

| # | Severity | Phase | Module | Issue | File:Line | Status |
|---|---|---|---|---|---|---|
| 1 | CRITICAL | P4 | Invoices | Bank account mismatch in invoice PDFs - clients paying to wrong account | `invoice-pdf.tsx:91-104` vs `constants.ts:21-22` | Open |
| 2 | CRITICAL | P2/P4 | Invoices | No rounding on financial calculations (tax, subtotal, total) | `new-invoice-modal.tsx:85-87`, `edit/page.tsx:117-120` | Open |
| 3 | CRITICAL | P4/P9 | Invoices | TDS excluded from balance_due calculation - invoices stuck as partially_paid | `use-invoices.ts:852` | Open |
| 4 | CRITICAL | P4 | Invoices | Invoice edit does not save line items to DB - totals vs PDF diverge | `edit/page.tsx:150-172` | Open |
| 5 | CRITICAL | P9 | Reports | Quarterly investor report covers 2 months instead of 3 | `use-reports.ts:110` | Open |
| 6 | CRITICAL | P4 | Invoices | Floating-point accumulation in payment totals via .reduce() | `use-invoices.ts:834-841` | Open |
| 7 | CRITICAL | P11 | Email | Invoice emails are stubs - return success without sending | `send-email/route.ts:50-51` | Open |
| 8 | CRITICAL | P1 | Security | SERVICE_ROLE_KEY in .env.local needs rotation | `.env.local` (line 4) | Open |
| 9 | CRITICAL | P1 | Security | All HTTP security headers missing (CSP, HSTS, X-Frame-Options, etc.) | `next.config.mjs` | Open |
| 10 | CRITICAL | P1 | Security | API routes bypass middleware auth - no defense-in-depth | `middleware.ts:39` | Open |
| 11 | CRITICAL | P1 | Security | No role-based authorization on API routes | All files in `src/app/api/` | Open |
| 12 | CRITICAL | P3 | Payments | No server-side validation on payment amount (overpayment accepted) | `use-invoices.ts:811-891` | Open |
| 13 | CRITICAL | P13 | Error | React hydration errors (#422, #425) on every page | Multiple files | Open |
| 14 | CRITICAL | P13 | Error | formatDate() crashes on null input | `src/lib/utils/format.ts` | Open |
| 15 | CRITICAL | P13 | Error | Invoice detail infinite spinner for invalid IDs | `invoices/[id]/page.tsx:354-359` | Open |
| 16 | CRITICAL | P10 | PDF | PDF generation return type inconsistency (Blob vs Uint8Array) | `src/lib/pdf/index.ts` | Open |
| 17 | CRITICAL | P4 | Analytics | Transfers and loans counted as expenses in P&L views | `004_analytics.sql:25`, `use-transactions.ts:275` | Open |
| 18 | CRITICAL | P4 | Invoices | Pro forma conversion creates no payment record - invisible to revenue | `use-invoices.ts:717-728` | Open |
| 19 | CRITICAL | P4 | Analytics | Revenue mixes currencies without proper conversion | `use-analytics.ts:398-401` | Open |
| 20 | CRITICAL | P11 | Email | No HTML escaping in email templates (XSS) | `src/lib/email/templates.ts` | Open |
| 21 | CRITICAL | P1 | Security | tds_certificates table (migration 007) has no RLS | `007_tds_certificates.sql` | Open |
| 22 | CRITICAL | P3 | Functional | No server-side API validation layer - all validation client-side only | Architecture-wide | Open |
| 23 | HIGH | P4 | Invoices | No overdue auto-detection mechanism - overdue KPI always 0 | No file (missing feature) | Open |
| 24 | HIGH | P2/P10 | PDF | Indian numbering format on USD/GBP/AED amounts in invoice PDF | `invoice-pdf.tsx:44-54` | Open |
| 25 | HIGH | P1 | Security | Auth cookie missing HttpOnly flag | Supabase SSR config | Open |
| 26 | HIGH | P1 | Security | Auth cookie missing Secure flag | Supabase SSR config | Open |
| 27 | HIGH | P1 | Security | No CSRF protection | Architecture-wide | Open |
| 28 | HIGH | P1 | Security | dangerouslySetInnerHTML XSS risk in settings | `settings/page.tsx:1527,1762` | Open |
| 29 | HIGH | P1 | Security | Email API allows arbitrary HTML body injection | `email/send/route.ts:88-133` | Open |
| 30 | HIGH | P1 | Security | No brute force protection on login | `login/page.tsx` | Open |
| 31 | HIGH | P1 | Security | No password reset flow | Missing feature | Open |
| 32 | HIGH | P1 | Security | Client-side privilege escalation on first login | `login/page.tsx:54` | Open |
| 33 | HIGH | P3 | Contracts | /contracts/new returns 404 | Empty directory, no page.tsx | Open |
| 34 | HIGH | P3 | TDS | /tds route entirely unimplemented | No page exists | Open |
| 35 | HIGH | P3 | Settings | Settings use localStorage, not database | `settings/page.tsx` | Open |
| 36 | HIGH | P3 | Payments | Payments page no link to invoice detail | Payments page, plain `<p>` tags | Open |
| 37 | HIGH | P4 | Analytics | client_health_scores double-counts invoices with multiple payments | `004_analytics.sql:94` | Open |
| 38 | HIGH | P4 | Analytics | revenue_by_client_view drops foreign revenue (no fallback) | `004_analytics.sql:47` | Open |
| 39 | HIGH | P4 | Cross-module | Deleting client cascades projects but orphans invoice project_ids | `001_schema.sql:136-137` | Open |
| 40 | HIGH | P2 | Code | Currency formatting duplicated across 6+ locations with different rules | Multiple files | Open |
| 41 | HIGH | P2 | Code | Settings page is 2140-line god component | `settings/page.tsx` | Open |
| 42 | HIGH | P2 | Performance | No pagination on any list page - all data fetched client-side | All list hooks | Open |
| 43 | HIGH | P10 | PDF | Logo/stamp image paths may fail in production (`/public/` prefix) | `invoice-pdf.tsx:486,640` | Open |
| 44 | HIGH | P10 | PDF | GST invoices don't split CGST+SGST vs IGST | `invoice-pdf.tsx:597-605` | Open |
| 45 | HIGH | P10 | PDF | No error handling on PDF generation - silent failure | Invoice/contract/report pages | Open |
| 46 | HIGH | P11 | Email | No PDF attachment in invoice email flow | `email/send/route.ts` | Open |
| 47 | HIGH | P11 | Email | Invoice status not updated to "sent" after email | `send-email/route.ts` | Open |
| 48 | HIGH | P11 | Email | No retry logic for SMTP failures | `email/client.ts` | Open |
| 49 | HIGH | P11 | Email | No rate limiting on email sends | `email/send/route.ts` | Open |
| 50 | HIGH | P12 | UX | All page loads 6-9 seconds (client-side only) | All pages | Open |
| 51 | HIGH | P12 | UX | Near-zero ARIA accessibility (3 instances in entire codebase) | Multiple components | Open |
| 52 | HIGH | P12 | UX | 3 pages not in navigation (Projects, Contracts, TDS) | `TopNavV2.tsx` | Open |
| 53 | HIGH | P12 | UX | Hardcoded fake notifications | `TopNavV2.tsx:75-129` | Open |
| 54 | HIGH | P13 | Error | No route-level error boundaries | Dashboard route group | Open |
| 55 | HIGH | P13 | Error | Only 1 of ~10 forms uses Zod validation | Multiple form components | Open |
| 56 | HIGH | P2 | Security | Hardcoded bank account/IBAN/routing numbers across 5 source files | Multiple files | Open |
| 57 | HIGH | P4 | Invoices | Expense summary includes transfers, tax, and loan payments | `use-transactions.ts:275` | Open |
| 58 | HIGH | P11 | Email | Hardcoded SMTP fallback credentials | `email/client.ts:9-10` | Open |
| 59 | HIGH | P11 | Email | No connection pooling - new transport per email | `email/client.ts:29` | Open |
| 60 | MEDIUM | P1 | Security | profiles table SELECT allows unauthenticated reads | `001_schema.sql:21` | Open |
| 61 | MEDIUM | P1 | Security | All authenticated users can READ all financial data | RLS SELECT policies | Open |
| 62 | MEDIUM | P1 | Security | No input validation on email recipients | `email/send/route.ts:63` | Open |
| 63 | MEDIUM | P1 | Security | TLS uses SSLv3 ciphers (deprecated) | `email/client.ts:14` | Open |
| 64 | MEDIUM | P1 | Security | No audit logging for sensitive operations | Missing feature | Open |
| 65 | MEDIUM | P1 | Security | No Content-Type validation on API routes | API routes | Open |
| 66 | MEDIUM | P1 | Security | Sentry config exposes org/project names | `next.config.mjs:17-18` | Open |
| 67 | MEDIUM | P2 | Code | 19 occurrences of `as any` type casts | Multiple files | Open |
| 68 | MEDIUM | P2 | Code | Financial year helpers duplicated (4 implementations) | Multiple files | Open |
| 69 | MEDIUM | P2 | Code | xlsx package has known security advisories (prototype pollution) | `package.json` | Open |
| 70 | MEDIUM | P2 | Code | Playwright in production dependencies (50MB unnecessary) | `package.json` | Open |
| 71 | MEDIUM | P2 | Code | Zero test files in codebase | Project-wide | Open |
| 72 | MEDIUM | P2 | Code | Proforma reference collision risk (last 3 digits of Date.now()) | `number-generator.ts:9-11` | Open |
| 73 | MEDIUM | P2 | Code | PDF components not lazy-loaded (1.5MB @react-pdf/renderer) | PDF import files | Open |
| 74 | MEDIUM | P2 | Code | API routes missing top-level try/catch | `export-csv`, `email-activity` routes | Open |
| 75 | MEDIUM | P2 | Code | Dashboard makes 6 sequential Supabase queries | `use-analytics.ts:392-460` | Open |
| 76 | MEDIUM | P2 | Code | Unchecked line item insertion in retainer invoice generation | `use-invoices.ts:433-435` | Open |
| 77 | MEDIUM | P3 | Clients | Client search returns 0 for known partial names | Client search implementation | Open |
| 78 | MEDIUM | P3 | Services | Services list rendering issues (0 items via standard selectors) | Settings > Services | Open |
| 79 | MEDIUM | P3 | Contracts | Contract creation is modal-based only - /contracts/new is dead | `/contracts/new` | Open |
| 80 | MEDIUM | P3 | Invoices | Zero amount line items accepted | `new-invoice-modal.tsx` | Open |
| 81 | MEDIUM | P3 | Invoices | Proforma conversion auto-marks as paid without payment record | `use-invoices.ts:722-725` | Open |
| 82 | MEDIUM | P3 | Payments | Payment amounts not validated against currency/exchange rate | Payment modal | Open |
| 83 | MEDIUM | P3 | Expenses | Transactions page lacks filtering controls | `/expenses/transactions` | Open |
| 84 | MEDIUM | P3 | Expenses | No approval workflow for imported transactions | `/expenses/transactions` | Open |
| 85 | MEDIUM | P3 | Settings | No save confirmation toast after saving | `settings/page.tsx` | Open |
| 86 | MEDIUM | P3 | Functional | Status filter dropdown overlay blocks page interactions | Multiple pages | Open |
| 87 | MEDIUM | P3 | Functional | RSC payload fetch failures on dashboard | Console errors | Open |
| 88 | MEDIUM | P4 | Invoices | GST split (CGST/SGST vs IGST) not implemented | `invoice-pdf.tsx:597-605` | Open |
| 89 | MEDIUM | P4 | Currency | Dashboard formatRevenue hardcodes "Rs." prefix | `dashboard/page.tsx:17-19` | Open |
| 90 | MEDIUM | P4 | Currency | Invoice modal hardcodes "Rs." for tax display | `new-invoice-modal.tsx:343` | Open |
| 91 | MEDIUM | P4 | Cross-module | No project profitability calculation | Missing feature | Open |
| 92 | MEDIUM | P4 | Cross-module | No client-level P&L | Missing feature | Open |
| 93 | MEDIUM | P4 | Cross-module | No cascade for contracts on client delete | `001_schema.sql:230` | Open |
| 94 | MEDIUM | P4 | Reports | Active clients/projects are point-in-time, not period-specific | `use-reports.ts:162-171` | Open |
| 95 | MEDIUM | P10 | PDF | GBP bank details incomplete | `invoice-pdf.tsx:124-130` | Open |
| 96 | MEDIUM | P10 | PDF | Bank details hardcoded in source code | Multiple files | Open |
| 97 | MEDIUM | P10 | PDF | EUR currency falls through to Rs. symbol | `invoice-pdf.tsx:44-54` | Open |
| 98 | MEDIUM | P10 | PDF | No page breaks for many invoice line items | `invoice-pdf.tsx` | Open |
| 99 | MEDIUM | P10 | PDF | formatCurrency() in PDF lacks NaN/null check | `invoice-pdf.tsx` | Open |
| 100 | MEDIUM | P10 | PDF | Contract PDF lacks pricing section | `contract-pdf.tsx` | Open |
| 101 | MEDIUM | P10 | PDF | Report PDF has no charts/visualizations | `report-pdf.tsx` | Open |
| 102 | MEDIUM | P10 | PDF | Static vs dynamic import inconsistency for PDF libs | Contract/report pages | Open |
| 103 | MEDIUM | P11 | Email | display:flex used in email templates (breaks Outlook/Yahoo) | `templates.ts:78-79` | Open |
| 104 | MEDIUM | P11 | Email | Style tag in head stripped by Gmail | `templates.ts:159` | Open |
| 105 | MEDIUM | P11 | Email | No plaintext fallback for emails | `email/client.ts` | Open |
| 106 | MEDIUM | P11 | Email | Settings email templates disconnected from send flow | Settings vs `templates.ts` | Open |
| 107 | MEDIUM | P11 | Email | No open tracking implemented | Email activity API | Open |
| 108 | MEDIUM | P11 | Email | Type mismatch between email activity systems | Route vs hook EmailTemplate types | Open |
| 109 | MEDIUM | P11 | Email | GSTIN discrepancy between template and settings | `templates.ts:173` vs `settings/page.tsx:87` | Open |
| 110 | MEDIUM | P11 | Email | No SMTP availability detection | `email/client.ts` | Open |
| 111 | MEDIUM | P12 | UX | 9 pages overflow on mobile | Analytics (7), Clients, Reports | Open |
| 112 | MEDIUM | P12 | UX | Settings tabs hidden on mobile (only 3 of 8 visible) | `settings/page.tsx` | Open |
| 113 | MEDIUM | P12 | UX | Invoice table hides status column on mobile | Invoice list page | Open |
| 114 | MEDIUM | P12 | UX | No focus trap in modals | All modal components | Open |
| 115 | MEDIUM | P12 | UX | Missing confirmation on destructive actions (cancel invoice, etc.) | Status dropdowns | Open |
| 116 | LOW | P1 | Security | No autocomplete="off" on password field | `login/page.tsx` | Open |
| 117 | LOW | P1 | Security | Login page reveals "Internal Management Platform" | `login/page.tsx` | Open |
| 118 | LOW | P1 | Security | x-powered-by: Next.js header exposed | `next.config.mjs` | Open |
| 119 | LOW | P1 | Security | Mock data uses predictable UUID patterns | Seed data | Open |
| 120 | LOW | P1 | Security | No session idle timeout | Missing feature | Open |
| 121 | LOW | P1 | Security | SMTP_PASSWORD vs SMTP_PASS env var inconsistency | `.env.local`, `email/client.ts` | Open |
| 122 | LOW | P2 | Code | Non-null assertions on env vars | `server.ts`, `admin.ts`, `client.ts` | Open |
| 123 | LOW | P2 | Code | Non-null assertion on daysLeft | `projects/page.tsx:323` | Open |
| 124 | LOW | P2 | Code | Orphaned realtime table subscriptions (expenses, payments) | `providers.tsx:15` | Open |
| 125 | LOW | P2 | Code | No React.memo on frequently re-rendered components | Dashboard components | Open |
| 126 | LOW | P2 | Code | createAdminClient() is dead code (never imported) | `supabase/admin.ts` | Open |
| 127 | LOW | P2 | Code | Duplicate send-email route (stub) superseded by email/send | `send-email/route.ts` | Open |
| 128 | LOW | P2 | Code | Invoice logo path uses /public/ prefix (Next.js serves from root) | `invoice-pdf.tsx:486` | Open |
| 129 | LOW | P3 | Clients | No custom GSTIN format validation | Client create form | Open |
| 130 | LOW | P3 | Projects | Missing billing day field for retainer projects | New project form | Open |
| 131 | LOW | P3 | Targets | "New Goal" vs "Financial Targets" naming inconsistency | `targets/page.tsx` | Open |
| 132 | LOW | P3 | Invoices | Invoice table links go to /edit instead of detail view | Invoice list anchors | Open |
| 133 | LOW | P3 | Expenses | Upload preview limited to 20 rows | `upload/page.tsx:39` | Open |
| 134 | LOW | P4 | Code | formatNumber uses en-IN for all numbers | `format.ts:37` | Open |
| 135 | LOW | P4 | Cross-module | Transactions linked to invoices have no cascade | `001_schema.sql:335` | Open |
| 136 | LOW | P4 | Reports | Investor report hardcodes "Rs." in email body | `use-reports.ts:369` | Open |
| 137 | LOW | P4 | Reports | Report PDF title hardcoded "Monthly Performance Report" | `report-pdf.tsx:346` | Open |
| 138 | LOW | P4 | Reports | Active clients/projects point-in-time, not period-specific | `use-reports.ts:162-171` | Open |
| 139 | LOW | P10 | PDF | No Terms & Conditions section on invoices | `invoice-pdf.tsx` | Open |
| 140 | LOW | P10 | PDF | Contract PDF client party details incomplete | `contract-pdf.tsx` | Open |
| 141 | LOW | P10 | PDF | No Unicode font support (Hindi/Kannada characters blank) | All PDF components | Open |
| 142 | LOW | P10 | PDF | formatDate() in invoice PDF returns epoch for null dates | `invoice-pdf.tsx` | Open |
| 143 | LOW | P10 | PDF | No month-over-month comparison in report PDF | `report-pdf.tsx` | Open |
| 144 | LOW | P11 | Email | Duplicate style attribute on investor report revenue span | `templates.ts:360` | Open |
| 145 | LOW | P11 | Email | Currency parameter unused in invoiceSentTemplate | `templates.ts:187-189` | Open |
| 146 | LOW | P12 | UX | No breadcrumbs on detail pages | Detail page layouts | Open |
| 147 | LOW | P12 | UX | Back button uses router.back() instead of parent route | `TopNavV2.tsx:519` | Open |

---

## Appendix B: Test Coverage Matrix

| Module | Tests Run | Passed | Failed | Warnings/Blocked |
|---|---|---|---|---|
| Authentication & Security (Phase 1) | 90 | 56 | 34 | 0 |
| Static Code Analysis (Phase 2) | 67 checks | N/A | 67 issues | N/A |
| Clients (Phase 3) | 14 | 8 | 0 | 6 |
| Projects (Phase 3) | 7 | 4 | 0 | 3 |
| Services (Phase 3) | 3 | 2 | 0 | 1 |
| Contracts (Phase 3) | 6 | 2 | 1 | 3 |
| TDS Certificates (Phase 3) | 3 | 0 | 3 | 0 |
| Financial Targets (Phase 3) | 6 | 4 | 0 | 2 |
| Settings (Phase 3) | 5 | 3 | 0 | 2 |
| Onboarding (Phase 3) | 5 | 3 | 0 | 2 |
| Invoice Engine (Phase 5) | 30 | 26 | 0 | 4 |
| Payment Flow (Phase 6) | 16 | 13 | 0 | 3 |
| Expense Management (Phase 7) | 17 | 9 | 0 | 8 |
| Cross-Cutting (Phase 3-7) | 5 | 1 | 2 | 2 |
| Financial Logic (Phase 4) | 42 calcs | N/A | 12 issues | N/A |
| Cross-Module Flow (Phase 8) | 15 checks | N/A | 8 issues | N/A |
| Analytics & Reporting (Phase 9) | 8 views + 10 hooks | N/A | 7 issues | N/A |
| PDF Generation (Phase 10) | 19 checks | N/A | 19 issues | N/A |
| Email System (Phase 11) | 23 checks | N/A | 23 issues | N/A |
| UX & Responsiveness (Phase 12) | 123 checks | N/A | 123 issues | N/A |
| Edge Cases (Phase 13) | 16 | 8 | 1 | 7 |

---

## Appendix C: Screenshots Index

Screenshots were captured during the UX and functional testing phases. File references are based on the test data JSON metadata.

**Desktop Captures (21 pages):**

| Page | Screenshot File | Notes |
|---|---|---|
| /dashboard | desktop-dashboard.png | 9145ms load, 0 glass cards, 4 console errors |
| /clients | desktop-clients.png | 7745ms load, 10 glass cards |
| /invoices | desktop-invoices.png | 7606ms load, 1 glass card |
| /payments | desktop-payments.png | 7024ms load, 2 glass cards |
| /expenses | desktop-expenses.png | 7413ms load, 2 glass cards |
| /expenses/upload | desktop-expenses-upload.png | 6130ms load, 2 glass cards |
| /expenses/transactions | desktop-expenses-transactions.png | 6461ms load, 6 truncated elements |
| /analytics | desktop-analytics.png | 6765ms load, 3 glass cards |
| /analytics/pl | desktop-analytics-pl.png | 6236ms load, 2 glass cards |
| /analytics/balance | desktop-analytics-balance.png | 6869ms load, 3 glass cards |
| /analytics/invoices | desktop-analytics-invoices.png | 6172ms load, 4 glass cards |
| /analytics/expenses | desktop-analytics-expenses.png | 6342ms load, 3 glass cards |
| /analytics/clients | desktop-analytics-clients.png | 6146ms load, 4 glass cards |
| /analytics/projects | desktop-analytics-projects.png | 6543ms load, 3 glass cards |
| /projects | desktop-projects.png | 7597ms load, 10 glass cards |
| /contracts | desktop-contracts.png | 6975ms load, 1 glass card |
| /reports | desktop-reports.png | 6390ms load, 2 glass cards |
| /pipeline | desktop-pipeline.png | 7262ms load, multiple glass cards |
| /targets | desktop-targets.png | ~6500ms load, 3 glass cards |
| /settings | desktop-settings.png | ~6500ms load, multiple glass cards |
| /onboard | desktop-onboard.png | ~6500ms load, multiple glass cards |

**Mobile Captures (21 pages):**
Mobile screenshots were captured at 375px width for all pages listed above, with the prefix `mobile-` instead of `desktop-`.

**Functional Test Captures (72):**
72 screenshots were captured during functional testing (Phase 3, 5, 6, 7) to the `audit-screenshots/functional/` directory, covering CRUD operations, form validation, modal interactions, and error states.

---

*Report compiled from 7 individual phase audit reports produced by specialized AI audit agents. All findings are based on code review, static analysis, and automated Playwright browser testing against the production deployment at https://wodo-ally-production.up.railway.app.*

*End of Report.*
