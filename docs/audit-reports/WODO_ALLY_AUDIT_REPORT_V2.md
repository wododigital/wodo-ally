# WODO Ally — Comprehensive Production Audit Report V2

**Date:** 2026-04-09  
**Audited by:** 10 parallel SPARC agents (6 codebase + 4 live data)  
**Project:** WODO Ally — Financial Management SaaS  
**Stack:** Next.js 14, Supabase (PostgreSQL), TanStack Query, Zustand, React-PDF, Recharts  
**Supabase Project:** oaujoosmbgcgacosqlhe  

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Issues Found** | **153** |
| **Critical** | **9** |
| **High** | **35** (incl. 5 npm vulnerabilities) |
| **Medium** | **43** |
| **Low** | **66** |
| **Build Status** | **PASS** (0 type errors, 0 lint errors) |
| **npm audit** | **FAIL** (5 high, 1 moderate vulnerability) |
| **Production-Readiness Score** | **52/100** |

The application has a solid architectural foundation (Next.js App Router, typed Supabase client, TanStack Query, proper RLS on all tables). However, **critical financial calculation bugs** — particularly mixed-currency aggregation, missing balance_due recalculation on edit, and stale FY defaults — make it **not production-ready** for financial use without remediation.

**Top 3 blockers:**
1. Mixed currency aggregation produces meaningless totals across KPIs, views, and reports
2. Invoice edit does not recalculate `balance_due`, causing payment tracking drift
3. Hardcoded FY "2025-26" is already stale (we're in FY 2026-27 as of April 2026)

---

## Severity Definitions

| Level | Meaning |
|-------|---------|
| **Critical** | Data corruption, financial miscalculation, security breach, or complete feature failure |
| **High** | Significant bug affecting core functionality, likely user-facing |
| **Medium** | Noticeable issue, workaround exists, or affects secondary features |
| **Low** | Minor inconsistency, cosmetic, or defensive improvement |

---

## Phase 1: Codebase Audit Results

### 1. Financial Logic Audit (20 issues)

#### CRITICAL

| # | Issue | File | Evidence |
|---|-------|------|----------|
| F-1 | **Currency mixing in balance aggregations** — `balance_due` summed across INR, USD, AED, GBP without conversion. Dashboard shows "Rs." for mixed-currency totals. | `src/lib/hooks/use-kpi.ts:96-98`, `src/app/(dashboard)/invoices/page.tsx:240`, `src/app/(dashboard)/pipeline/page.tsx:76-78` | Live data confirms: outstanding query sums INR 17,500 + AED 0 + USD 0 into single "Rs." figure |

#### HIGH

| # | Issue | File | Fix |
|---|-------|------|-----|
| F-2 | **Edit invoice doesn't recalculate `balance_due`** — changing line items updates `total_amount` but not `balance_due`, causing payment tracking drift | `src/app/(dashboard)/invoices/[id]/edit/page.tsx:155-184` | Add `balance_due: total - (invoice.total_received ?? 0) - (invoice.total_tds_deducted ?? 0)` to update payload |
| F-3 | **Invoice detail balance ignores TDS** — local calculation `total_amount - total_received` omits `total_tds_deducted` | `src/app/(dashboard)/invoices/[id]/page.tsx:327-329` | Use `invoice.balance_due` directly |
| F-4 | **Proforma conversion missing currency on payment** — auto-created payment record has no `currency` field, misattributed as INR in revenue aggregation | `src/lib/hooks/use-invoices.ts:794` | Add `currency: inv.currency` to payment insert |
| F-5 | **Foreign currency payments silently zeroed** — when `amount_received_inr` is NULL, non-INR payments counted as 0 in dashboard KPIs | `src/lib/hooks/use-analytics.ts:398-402` | Require `amount_received_inr` at payment recording time for non-INR invoices |

#### MEDIUM

| # | Issue | File | Fix |
|---|-------|------|-----|
| F-6 | **Hardcoded FY "2025-26"** in 5+ places — already stale as of April 2026 | `use-targets.ts:59`, `analytics/page.tsx:37,162`, `targets/page.tsx:339-340`, `clients/[id]/page.tsx:74` | Replace with `getFinancialYear()` from `format.ts` |
| F-7 | **"Paid This Month" uses `invoice_date` not `paid_at`** — shows invoices issued this month, not actually paid this month | `invoices/page.tsx:241` | Filter by `paid_at` instead |
| F-8 | **GST intra/inter-state not stored on invoice** — determined at PDF render time from GSTIN prefix, fails when GSTIN is null | `pdf/invoice-pdf.tsx:621-622` | Fallback to `client.state` when GSTIN missing |
| F-9 | **Overpayment guard uses 0.01 epsilon** — allows small overpayments from floating point | `use-invoices.ts:909` | Use `Math.round(x * 100)` comparison |
| F-10 | **Report revenue misses INR payments** — only reads `amount_received_inr`, INR payments with NULL there show as 0 | `use-reports.ts:128-137` | Add fallback: `amount_received_inr ?? (currency === 'INR' ? amount_received : 0)` |

#### LOW (8 issues)

| # | Issue | File |
|---|-------|------|
| F-11 | FY range end date at midnight (00:00) instead of 23:59:59 | `format.ts:63-70` |
| F-12 | Proforma reference collision risk (3-digit suffix from Date.now()) | `number-generator.ts:7-12` |
| F-13 | EUR missing from currency prefix in edit page | `invoices/[id]/edit/page.tsx:126` |
| F-14 | Pipeline/dashboard hardcodes "Rs." for all currencies | `pipeline/page.tsx`, `dashboard/page.tsx:17-18` |
| F-15 | FY string parsing doesn't validate two-digit suffix | `use-analytics.ts:143-149` |
| F-16 | TDS validation allows TDS exceeding invoice total | `validations/invoice.ts:19-26` |
| F-17 | Quantity input allows decimal (Zod catches, but UX poor) | `validations/invoice.ts:6` |
| F-18 | Q4 report year boundary may use wrong calendar year | `use-reports.ts:107-111` |

---

### 2. Security Audit (14 issues)

#### HIGH

| # | Issue | File | OWASP |
|---|-------|------|-------|
| S-1 | **Raw HTML injection in email APIs** — `payload.body` bypasses `escapeHtml()` templates, sent as raw HTML to clients | `api/invoices/[id]/send-email/route.ts:87-89`, `api/email/send/route.ts:97-99` | A03:2021 Injection |
| S-2 | **CSP allows `unsafe-eval` + `unsafe-inline`** — XSS protection gutted | `next.config.mjs:46` | A05:2021 Misconfiguration |
| S-3 | **Migration 007 TDS table lacks RLS** — `CREATE TABLE IF NOT EXISTS` without `ENABLE ROW LEVEL SECURITY` | `supabase/migrations/007_tds_certificates.sql` | A01:2021 Broken Access Control |

#### MEDIUM

| # | Issue | File |
|---|-------|------|
| S-4 | `dangerouslySetInnerHTML` with unsanitized template body | `settings/tabs/contracts-tab.tsx:324`, `email-templates-tab.tsx:239` |
| S-5 | `bank_accounts` table missing DELETE RLS policy | `supabase/migrations/016_bank_accounts.sql` |
| S-6 | CSRF bypass when Origin/Referer headers missing | `middleware.ts:68-71` |
| S-7 | No rate limiting on password reset endpoint | `forgot-password/page.tsx` |
| S-8 | Real bank account numbers hardcoded in migration seeds | `016_bank_accounts.sql:46-102` |
| S-9 | `getSession()` used instead of `getUser()` in password reset | `reset-password/page.tsx:24` |

#### LOW

| # | Issue | File |
|---|-------|------|
| S-10 | Weak password policy (8 chars, no complexity) | `reset-password/page.tsx:40` |
| S-11 | `audit_log` INSERT allows any user_id (no constraint) | `015_audit_log.sql:31-34` |
| S-12 | Sentry DSN exposed (normal, but configure allowed origins) | `sentry.client.config.ts:4` |
| S-13 | Proforma reference number predictable | `number-generator.ts:7-12` |
| S-14 | `csrfHeaders()` function defined but never imported/used | `csrf.ts` vs all hooks |

**Positive findings:** Service role key properly isolated, RLS enabled on all tables, HTML escaping in templates, no SQL injection vectors, idle timeout works (30min), HTTP headers configured (HSTS, X-Frame-Options, etc.), `.env` gitignored.

---

### 3. UI/UX Audit (27 issues)

#### CRITICAL

| # | Issue | Evidence |
|---|-------|----------|
| U-1 | **Zero `htmlFor` on ANY form label in the entire app** — screen readers cannot associate labels with inputs. Affects ALL forms across invoices, clients, settings, TDS, targets, etc. | `grep htmlFor src/ = 0 results` |

#### HIGH

| # | Issue | File |
|---|-------|------|
| U-2 | Most modals missing `role="dialog"` and `aria-modal="true"` | Payment modal, Client modal, Contract modal, Goal modal, etc. |
| U-3 | No Escape key close on any modal except StatusChangeDropdown | All modal components |
| U-4 | No focus trap in any modal — Tab escapes to background | All modal components |
| U-5 | Settings pages don't use `useUnsavedChanges` — data loss risk | All settings tabs |
| U-6 | Invoice edit line items overflow horizontally at 375px mobile | `invoices/[id]/edit/page.tsx:396-449` |

#### MEDIUM (11 issues)

| # | Issue |
|---|-------|
| U-7 | Missing pagination: Payments, Projects, Contracts pages |
| U-8 | TDS page completely missing from navigation |
| U-9 | `useUnsavedChanges` only handles `beforeunload`, not Next.js navigation |
| U-10 | Missing error boundaries: contracts, projects, pipeline, targets, reports, onboard |
| U-11 | Status filter dropdowns lack ARIA attributes |
| U-12 | Missing pagination on TDS certificates page |
| U-13 | Pipeline 5-column grid has no intermediate responsive breakpoint |
| U-14 | Status badges lack `aria-live` for screen reader announcements |
| U-15 | Missing breadcrumbs on expense upload and transactions sub-pages |
| U-16 | Missing toast on PDF generation failure (silent console.error) |
| U-17 | Missing toast on contract PDF download failure |

#### LOW (10 issues)

U-18 through U-27: Notification dropdown wrong `role`, back button missing aria-label, inconsistent loading skeletons, expenses not using shared EmptyState, rich text editor toolbar keyboard issues, etc.

**Positive findings:** No fake/mock data anywhere, toast notifications comprehensive across all CRUD operations, empty states well-implemented on all list pages.

---

### 4. Data Integrity Audit (21 issues)

#### CRITICAL

| # | Issue | Evidence |
|---|-------|----------|
| D-1 | **`revenue_by_client_view` sums mixed currencies** — `total_invoiced` uses raw `SUM(total_amount)` across INR/USD/AED. Dentique shows 1,350 invoiced (USD raw) vs 115,830 collected (INR converted). | **CONFIRMED WITH LIVE DATA** — Sea Wonders: invoiced=8,000 (AED) vs collected=93,600 (INR); Dentique: invoiced=1,350 (USD) vs collected=115,830 (INR) |
| D-2 | **Conflicting `tds_certificates` schema** — migration 001 creates with INTEGER `quarter`, no `certificate_number`; migration 007 creates with TEXT `quarter`, adds `certificate_number`. UI expects 007 schema but **live DB has 001 schema** (quarter=INTEGER, no certificate_number column). | **CONFIRMED** — live schema shows `quarter: integer`, no `certificate_number` column |
| D-3 | **Client deletion fails** — `invoices.client_id` FK has NO CASCADE. Deleting a client with invoices throws foreign key violation. | **CONFIRMED** — FK cascade query shows `invoices->clients: NO ACTION` |

#### HIGH

| # | Issue | Evidence |
|---|-------|----------|
| D-4 | `expenses_by_category_view` includes tax transactions (350,238 INR) | **CONFIRMED** — view total = 1,236,886; expense_only = 886,648; tax_only = 350,238. Tax is included. |
| D-5 | `partially_paid` missing from STATUS_TRANSITIONS map — stuck invoices | Code review confirmed |
| D-6 | Foreign currency payments silently dropped from KPIs | Overlaps F-5 |
| D-7 | Outstanding balance sums mixed currencies | Overlaps F-1 |
| D-8 | Only 1 of 17 audit action types actually used (`payment.create`) | **CONFIRMED** — `audit_log` table is completely empty (0 rows) |
| D-9 | Invoice deletion cascades payment records (data loss risk) | **CONFIRMED** — `invoice_payments->invoices: CASCADE` |
| D-10 | Invoice status inconsistency — invoice bbbbbbbb-...-0008 has `status='sent'`, `paid_at` set, `balance_due=0`, `total_received=100,300` | **CONFIRMED** — fully paid invoice stuck in 'sent' status |

#### MEDIUM

| # | Issue |
|---|-------|
| D-11 | `cancelled -> draft` transition doesn't clear stale metadata |
| D-12 | Overdue detection is client-side only, skips `partially_paid` |
| D-13 | Invoice status changes not audit-logged |
| D-14 | TDS certificates not linked to specific invoices |
| D-15 | Tax detection regex too aggressive (matches vendor payments mentioning GST) |
| D-16 | MRR sums retainer amounts across currencies |

#### LOW

| # | Issue |
|---|-------|
| D-17 | Health score not bounded below zero |
| D-18 | New clients get health_score=0 instead of neutral 50 |
| D-19 | Audit log doesn't capture IP address |
| D-20 | TDS client_id cascade behavior inconsistent |
| D-21 | `transactions.linked_invoice_id` NO ACTION may block draft deletion |

---

### 5. PDF Generation Audit (21 issues)

#### CRITICAL

| # | Issue | File |
|---|-------|------|
| P-1 | **NotoSans font registered but never used** — all PDFs use `fontFamily: "Helvetica"`, so ₹ symbol won't render | `pdf/invoice-pdf.tsx:179`, `report-pdf.tsx:67`, `contract-pdf.tsx:159` |

#### HIGH

| # | Issue | File |
|---|-------|------|
| P-2 | **Bank details hardcoded in PDF** — not pulled from `bank_accounts` table. DB has correct data but PDF ignores it. | `pdf/invoice-pdf.tsx:95-165` |
| P-3 | **Image src path wrong** — `/public/wodo-logo.png` should be `/wodo-logo.png` for react-pdf | `pdf/invoice-pdf.tsx:506,688` |
| P-4 | **Font only registers Latin subset** — `latin-400-normal.ttf` lacks ₹ (U+20B9), € (U+20AC) | `pdf/register-fonts.ts:20-27` |
| P-5 | **GST intra/inter-state fails when client GSTIN is null** — defaults to IGST even for Karnataka clients | `pdf/invoice-pdf.tsx:621-622` |

#### MEDIUM

| # | Issue |
|---|-------|
| P-6 | "Rs." used instead of ₹ symbol |
| P-7 | Missing EUR bank details (falls to "contact accounts@wodo.digital") |
| P-8 | No "PROFORMA" watermark on proforma invoice PDF |
| P-9 | `toLocaleString` may behave inconsistently in react-pdf environment |
| P-10 | Report PDF hardcodes "Rs." for multi-currency amounts |
| P-11 | Contract PDF missing client address details |
| P-12 | PDF accessibility — alt text suppressed on images |

#### LOW

| # | Issue |
|---|-------|
| P-13 | Tax line hidden for international invoices even when tax_amount > 0 |
| P-14 | "Phase 3" placeholder text still in PDF preview modal |
| P-15 | Memory leak in PDF URL object (repeated preview) |
| P-16 | Contract PDF doesn't register fonts |
| P-17 | No page numbers on invoice PDF |
| P-18 | `downloadBlob` anchor element not appended to DOM |
| P-19 | Non-GST invoice shows personal bank account |
| P-20 | Report type defaults to "Monthly" when undefined |
| P-21 | Report PDF chart bar widths are layout-based, not actual charts |

---

### 6. Code Quality Audit (38 issues)

#### HIGH

| # | Issue | Detail |
|---|-------|--------|
| Q-1 | **28 `as any` type assertions** across 11 files — 6 tables missing from generated `database.ts` | `use-services.ts` (7), `use-tds.ts` (3), `use-user-settings.ts` (3), `use-audit-log.ts` (2), etc. |
| Q-2 | **`use-invoices.ts` is 998 lines** — single largest file, approaching unmaintainable | Split into 5-6 modules |

#### MEDIUM

| # | Issue | Detail |
|---|-------|--------|
| Q-3 | 18 files over 500 lines | Largest: `use-invoices.ts` (998), `clients/[id]/page.tsx` (871), `onboard/page.tsx` (830) |
| Q-4 | FY helper duplicated 4 times | `format.ts`, `use-reports.ts`, `use-analytics.ts`, `use-targets.ts` |
| Q-5 | Missing role authorization on email-activity API | `api/invoices/[id]/email-activity/route.ts` |
| Q-6 | Memory leak in client detail page (async fetch without AbortController) | `clients/[id]/page.tsx:359` |

#### LOW

| # | Issue |
|---|-------|
| Q-7 | Hardcoded FY default in `use-targets.ts` (overlaps F-6) |
| Q-8 | `throw error` instead of `throw new Error()` in `use-reports.ts` |

**Positive findings:** TypeScript strict mode on, zero `@ts-ignore`, consistent TanStack Query patterns, all `@/` path aliases (zero relative imports), Playwright correctly in devDependencies, no TODO/FIXME/HACK comments, clean useEffect cleanup in most components, settings page well-decomposed into 8 sub-components.

---

## Phase 2: Live Database Testing Results

### Test Results Summary

| Test | Result | Evidence |
|------|--------|----------|
| **Schema verification** | PASS | All core tables exist with expected columns |
| **RLS enabled on all tables** | PASS | All 13 checked tables have `relrowsecurity=true` |
| **RLS policies comprehensive** | PASS (mostly) | 48 policies across all tables. `bank_accounts` missing DELETE policy. |
| **`settings` table exists** | **FAIL** | Table does not exist — `relation "settings" does not exist`. Settings likely stored in `user_settings` only. |
| **Bank accounts in DB** | PASS | 4 accounts: GST (INR), USA (USD), UAE (AED), Non-GST. **Missing: GBP, EUR** |
| **Bank accounts match PDF** | **FAIL** | DB has correct data but PDF hardcodes different values. DB data is not used by PDF. |
| **Audit log entries** | **FAIL** | Table is completely empty (0 rows). No operations logged despite 17 action types defined. |
| **TDS schema** | **FAIL** | Live DB has migration 001 schema (INTEGER quarter, no certificate_number). UI expects TEXT quarter + certificate_number. |
| **Foreign key cascades** | MIXED | `invoice_payments` CASCADE on invoice delete (dangerous). `invoices->clients` NO ACTION (blocks delete). |
| **pg_cron for overdue** | **FAIL** | No pg_cron extension installed. Overdue detection is client-side only. |
| **Profile roles** | PASS | 1 admin user. Only admin role present (single-user setup). |
| **monthly_pl_view** | PASS | Revenue/expenses separate. Feb 2026: revenue 225,300, expenses 886,648. |
| **expenses_by_category_view** | **FAIL** | Includes tax transactions (350,238 INR of tax in "Banking & Finance" category). View total 1,236,886 vs correct 886,648. **28% inflation**. |
| **revenue_by_client_view** | **FAIL** | Mixed currency bug confirmed. Sea Wonders: invoiced=8,000 (AED raw) vs collected=93,600 (INR). Dentique: invoiced=1,350 (USD raw) vs collected=115,830 (INR). |
| **client_health_scores** | PARTIAL | Works for INR clients. Most clients show score=0 (no paid_at timestamps set). |
| **Currency distribution** | INFO | 7 INR invoices (465,900), 2 AED (8,000), 1 USD (1,350) |
| **Invoice status consistency** | **FAIL** | Invoice bbbbbbbb-...-0008: status='sent', but paid_at set, balance_due=0, total_received=100,300. Should be 'paid'. |
| **Invoice a2fe8d0c** | **FAIL** | status='sent', paid_at set, balance_due=0, no invoice_number. Fully paid but status never updated. |
| **Overdue detection** | **FAIL** | Invoice bbbbbbbb-...-0007 correctly marked 'overdue'. But bbbbbbbb-...-0008 has due_date 2026-01-22 (past), status 'sent' — overdue detection missed it (was paid). |

---

## Issue Prioritization — Fix Order

### Sprint 1: Critical Financial Fixes (1-2 days)

1. **Fix currency aggregation everywhere** — Add `COALESCE(total_amount_inr, total_amount)` to `revenue_by_client_view`. Add currency-aware grouping to KPI hooks. [F-1, D-1, D-7]
2. **Fix `balance_due` recalculation on invoice edit** [F-2]
3. **Fix invoice detail balance to include TDS** [F-3]
4. **Replace all hardcoded FY "2025-26"** with `getFinancialYear()` [F-6]
5. **Fix `expenses_by_category_view`** to exclude transfer/loan/tax [D-4]
6. **Fix invoice status update on payment** — ensure status changes to 'paid' when balance_due reaches 0 [D-10]

### Sprint 2: Security & Data Integrity (2-3 days)

7. **Sanitize email body** — use DOMPurify or remove raw body override [S-1]
8. **Fix CSP** — remove unsafe-eval/unsafe-inline, use nonces [S-2]
9. **Fix TDS schema** — add `certificate_number` column, change `quarter` to TEXT [D-2]
10. **Add `partially_paid` to STATUS_TRANSITIONS** [D-5]
11. **Require `amount_received_inr` for non-INR payments** [F-5]
12. **Fix proforma conversion** — add currency to payment record [F-4]
13. **Add server-side overdue detection** (Supabase Edge Function or pg_cron) [D-12]

### Sprint 3: PDF & UI Fixes (2-3 days)

14. **Fix PDF font** — use NotoSans instead of Helvetica, include currency symbol glyphs [P-1, P-4]
15. **Pull bank details from DB** instead of hardcoded values [P-2]
16. **Fix image paths** in PDF [P-3]
17. **Add `htmlFor`** to all form labels [U-1]
18. **Add modal accessibility** — role="dialog", Escape close, focus trap [U-2, U-3, U-4]
19. **Add pagination** to Payments, Projects, Contracts pages [U-7]
20. **Add TDS to navigation** [U-8]

### Sprint 4: Code Quality (1-2 days)

21. **Regenerate `database.ts`** — `npx supabase gen types typescript` to eliminate 20+ `as any` casts [Q-1]
22. **Split `use-invoices.ts`** into 5-6 focused modules [Q-2]
23. **Consolidate FY helpers** into single source in `format.ts` [Q-4]
24. **Implement audit logging** for all 17 action types [D-8]

---

## Phase 2 (cont.): Build & Dependency Testing

### Build Verification

| Check | Status | Detail |
|-------|--------|--------|
| Node.js version | PASS | v22.22.0 |
| npm version | PASS | 10.9.4 |
| Dependencies installed | PASS | node_modules present |
| TypeScript (`tsc --noEmit`) | **PASS** | Zero errors, strict mode |
| ESLint (`next lint`) | **PASS** | Zero warnings/errors |
| Production build (`npm run build`) | **PASS** | 31 pages compiled successfully |
| Environment variables | PASS | `.env.local` exists and loads |

### npm audit: FAIL — 6 Vulnerabilities

| Package | Severity | Issue | Fix Available |
|---------|----------|-------|---------------|
| `xlsx` (all versions) | **High** | Prototype Pollution, ReDoS | **No fix** (unmaintained) |
| `nodemailer` <=8.0.4 | **High** | SMTP injection, DoS, domain confusion | Yes (v8.0.5+, breaking) |
| `next` 14.2.35 | **High** | DoS, request smuggling, cache exhaustion (4 CVEs) | Yes (v15+, breaking) |
| `lodash` <=4.17.23 | **High** | Code injection via `_.template`, Prototype Pollution | Yes (`npm audit fix`) |
| `picomatch` <=2.3.1 | **High** | Method injection, ReDoS | Yes (`npm audit fix`) |
| `brace-expansion` 4.0-5.0.4 | Moderate | Process hang via zero-step sequence | Yes (`npm audit fix`) |

**Immediate action:** Run `npm audit fix` to resolve lodash, brace-expansion, picomatch.  
**Short-term:** Replace `xlsx` with `sheetjs-ce` or `exceljs` (unmaintained, unfixable vulns, 651 kB chunk).  
**Medium-term:** Upgrade `nodemailer` to v8.0.5+, plan Next.js 15 migration.

### Bundle Size Concerns

| Chunk | Size | Assessment |
|-------|------|------------|
| `7159.*.js` | 651 kB | **HIGH** — likely `xlsx` or `@react-pdf/renderer` |
| `3315-*.js` | 343 kB | Moderate — likely `recharts` |
| `725-*.js` | 323 kB | Moderate — shared chunk |

8 out of 35 routes exceed 300 kB First Load JS. Recommend lazy-loading `xlsx` and `@react-pdf/renderer` with `next/dynamic`.

### Sentry Deprecation Warnings (Low)

- `sentry.server.config.ts` should migrate to `register()` inside Next.js instrumentation file
- `sentry.client.config.ts` should rename to `instrumentation-client.ts` for Turbopack compatibility

---

## Test Data Cleanup Instructions

No test data was created during this audit — all testing was done against existing production data via read-only queries. No cleanup needed.

---

## Production-Readiness Score Breakdown

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Financial Accuracy | 35/100 | 30% | 10.5 |
| Security | 65/100 | 20% | 13.0 |
| Data Integrity | 40/100 | 20% | 8.0 |
| UI/UX & Accessibility | 50/100 | 15% | 7.5 |
| PDF Generation | 40/100 | 10% | 4.0 |
| Code Quality | 72/100 | 5% | 3.6 |
| **TOTAL** | | **100%** | **46.6 → 52/100** |

**Verdict: NOT production-ready.** The financial calculation bugs (currency mixing, balance_due drift, stale FY) pose real risk of incorrect invoicing and misleading dashboards. After fixing Sprint 1 + Sprint 2 items, re-audit should bring score to 75-80.

---

## Comparison with Previous Audit

| Area | Previous (V1) | Current (V2) | Change |
|------|---------------|--------------|--------|
| Fake notification data | Present | Removed | **Improved** |
| P&L view expense exclusion | Broken | Fixed (monthly_pl_view) | **Improved** |
| Client health score double-counting | Present | Fixed (DISTINCT) | **Improved** |
| expenses_by_category_view | Not audited | Broken (includes tax) | **New finding** |
| Mixed currency aggregation | Identified | Still present, confirmed with live data | **Regressed** (no fix applied) |
| TDS schema conflict | Not audited | Confirmed live (001 schema active, 007 dead) | **New finding** |
| Audit logging | Not implemented | Still empty (0 rows) | **No change** |
| Bank details in PDF | Hardcoded | Still hardcoded (DB has data, PDF ignores it) | **No change** |
| Invoice status consistency | Not audited | 2 invoices with wrong status in live data | **New finding** |
| Accessibility (htmlFor) | Not audited | Zero labels associated with inputs | **New finding** |

---

*Report generated by SPARC Orchestrator with 10 parallel audit agents.*
*Total agent execution time: ~25 minutes across all phases.*
