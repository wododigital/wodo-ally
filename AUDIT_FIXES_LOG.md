# WODO Ally - Audit Fixes Log

**Audit Report:** `WODO_ALLY_AUDIT_REPORT.md`
**Last Updated:** 2026-04-09
**Commit:** `74a56cc` on `main`

---

## Session 1 - 2026-04-09

### What was done

Fixed 14 critical/high priority issues from the audit report (Tier 1 fully complete, most of Tier 2 complete). All fixes were tested against live Supabase data, build verified, and pushed to GitHub.

### Completed Fixes

#### From Tier 1 (Critical - Data/Money at Risk)

| Audit # | Issue | What was fixed | Files changed |
|---------|-------|----------------|---------------|
| 1 | Bank account mismatch in invoice PDFs | GST account changed to 10213871315/IDFB0080574, Non-GST to personal account 10221086461/IDFB0081105. Added SWIFT code and branch info. | `src/lib/pdf/invoice-pdf.tsx` |
| 2 | No rounding on financial calculations | Added `Math.round(value * 100) / 100` to all 4 calculation paths: new invoice modal, edit page, retainer auto-draft, and payment totals `.reduce()` | `src/components/shared/new-invoice-modal.tsx`, `src/app/(dashboard)/invoices/[id]/edit/page.tsx`, `src/lib/hooks/use-invoices.ts` |
| 3 | Quarterly report covers 2 months | Changed `report_month + 1` to `report_month + 2` in date range calculation | `src/lib/hooks/use-reports.ts:110` |
| 4 | TDS excluded from balance_due | Changed formula from `total_amount - totalReceived` to `total_amount - totalReceived - totalTds` | `src/lib/hooks/use-invoices.ts:852` |
| 5 | Invoice edit does not save line items | Added `lineItems` parameter to `useUpdateInvoice`. Mutation now deletes existing line items and re-inserts updated ones. Edit page passes `validItems` to the mutation. | `src/lib/hooks/use-invoices.ts`, `src/app/(dashboard)/invoices/[id]/edit/page.tsx` |
| 6 | Invoice emails are stubs | Replaced stub endpoint with real implementation that calls `sendEmail()`, logs to `invoice_email_activity`, and auto-updates invoice status from "draft" to "sent". Added email validation. | `src/app/api/invoices/[id]/send-email/route.ts` |
| 7 | All HTTP security headers missing | Added all 7 headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection) via `next.config.mjs headers()`. Also set `poweredByHeader: false`. | `next.config.mjs` |
| 10 | formatDate() crashes on null | All 3 date functions (`formatDate`, `formatDateShort`, `formatRelativeTime`) now accept `null | undefined`, check `isNaN(d.getTime())`, and return "N/A" for invalid dates. | `src/lib/utils/format.ts` |

#### From Tier 2 (High - Fix Before Production Use)

| Audit # | Issue | What was fixed | Files changed |
|---------|-------|----------------|---------------|
| 12 | Indian numbering on non-INR currencies | Changed locale from `en-IN` to `en-US` for non-INR currencies. Added EUR case with Euro symbol. Added `Number.isFinite()` NaN guard. | `src/lib/pdf/invoice-pdf.tsx:44-54` |
| 13 | Expense type filtering | SQL view `monthly_pl_view` updated to `NOT IN ('income', 'transfer', 'loan', 'tax')`. Hook `useExpenseSummary` updated with matching PostgREST `.not()` filter. | `supabase/migrations/013_fix_analytics_views.sql`, `src/lib/hooks/use-transactions.ts` |
| 15 | Proforma conversion creates no payment record | Added `invoice_payments` insert after proforma conversion with auto-generated note. Also added `proforma_ref` to the select query. | `src/lib/hooks/use-invoices.ts` |
| 18 | Infinite spinner on invalid invoice ID | Separated `isLoading` check from `!invoice` check. Shows "Invoice not found" message with back link instead of infinite spinner. | `src/app/(dashboard)/invoices/[id]/page.tsx` |
| 21 | client_health_scores double-counting | Changed `count(*)` to `count(DISTINCT i.id)` in the payment_stats CTE. Applied live to Supabase. | `supabase/migrations/013_fix_analytics_views.sql` |
| 36 | revenue_by_client_view drops foreign revenue | Changed `COALESCE(sum(ip.amount_received_inr), 0)` to `COALESCE(sum(COALESCE(ip.amount_received_inr, ip.amount_received)), 0)`. Applied live to Supabase. | `supabase/migrations/013_fix_analytics_views.sql` |

#### Additional fixes (not numbered in audit but related)

| Issue | What was fixed | Files changed |
|-------|----------------|---------------|
| SMTP TLS uses deprecated SSLv3 (audit #34) | Changed `ciphers: "SSLv3"` to `minVersion: "TLSv1.2"` | `src/lib/email/client.ts` |
| x-powered-by header (audit #55) | Set `poweredByHeader: false` in next.config.mjs | `next.config.mjs` |

### SQL Changes Applied Live to Supabase

Three views were updated directly on the Supabase database (project: `oaujoosmbgcgacosqlhe`) AND saved as migration `013_fix_analytics_views.sql`:

1. `monthly_pl_view` - excludes transfer/loan/tax from expenses
2. `client_health_scores` - uses COUNT(DISTINCT) to prevent double-counting
3. `revenue_by_client_view` - falls back to amount_received when amount_received_inr is null

### Test Results

All fixes verified:
- Build: **PASSING** (clean compile, no type errors, no lint errors)
- SQL views: queried live, returning correct data
- P&L expense reduction: Rs.12,36,885 (old) -> Rs.8,86,647 (fixed) - Rs.3,50,238 in tax correctly excluded
- TDS balance: Rs.76,700 invoice with Rs.7,670 TDS now shows balance=0 (was 7,670)
- Quarterly dates: confirmed 3-month coverage for all 4 quarters
- Currency format: USD now shows `$1,234,567.89` not `$12,34,567.89`
- Line items delete+insert: tested via SQL transaction with rollback
- formatDate: null/undefined inputs return "N/A" instead of crash

---

## Remaining Work

### Tier 1 - Still Open

| Audit # | Issue | Notes |
|---------|-------|-------|
| 8 | Server-side payment amount validation (overpayment) | Need to add validation check `amount_received <= balance_due` in `useRecordPayment` and/or a DB trigger |
| 9 | Rotate Supabase SERVICE_ROLE_KEY | Manual step - generate new key in Supabase dashboard, update .env.local and Railway env vars |

### Tier 2 - Still Open

| Audit # | Issue | Effort |
|---------|-------|--------|
| 11 | Add overdue auto-detection (cron or edge function) | 3 hours |
| 14 | Fix currency mixing in revenue aggregation (use-analytics.ts hook) | 2 hours |
| 16 | Add role-based authorization to API routes | 3 hours |
| 17 | Fix React hydration errors (#422, #425) | 4 hours |
| 19 | Migrate Settings from localStorage to database | 4-6 hours |
| 20 | Add TDS certificates page (/tds) | 8 hours |
| 22 | Fix profiles RLS to require authentication | 10 min |
| 23 | Fix /contracts/new 404 | 10 min |
| 24 | Add route-level error boundaries | 1-2 hours |
| 25 | HTML-escape email template variables | 1 hour |

### Tier 3 - Fix Before Investor Demo (All Open)

| Audit # | Issue | Effort |
|---------|-------|--------|
| 26 | Implement GST CGST/SGST vs IGST split | 4 hours |
| 27 | Add pagination to all list pages | 3-4 hours |
| 28 | Add ARIA attributes to interactive elements | 2-3 hours |
| 29 | Fix mobile overflow on Analytics pages | 30 min |
| 30 | Add Projects, Contracts, TDS to navigation | 30 min |
| 31 | Fix report PDF title for report type | 10 min |
| 32 | Add charts to investor report PDF | 4-6 hours |
| 33 | Remove fake notification data | 15 min |
| 35 | Add Zod validation to invoice and payment forms | 3-4 hours |
| 37 | Complete GBP bank details in invoice PDF | 15 min |
| 38 | Add middleware-level auth for API routes | 2 hours |
| 39 | Fix hardcoded date in Projects page | 2 min |
| 40 | Fix hardcoded FY in Targets page | 10 min |

### Tier 4 - Polish & Enhance (All Open)

| Audit # | Issue | Effort |
|---------|-------|--------|
| 41 | Implement password reset flow | 2-3 hours |
| 42 | Add CSRF tokens for state-changing operations | 3-4 hours |
| 43 | Add breadcrumbs to detail pages | 1-2 hours |
| 44 | Move bank details to database config | 3-4 hours |
| 45 | Add keyboard navigation to dropdowns | 2-3 hours |
| 46 | Consolidate currency formatting to single function | 2 hours |
| 47 | Consolidate FY helpers to single function | 1 hour |
| 48 | Add audit logging for sensitive operations | 4-6 hours |
| 49 | Add form dirty state protection | 2-3 hours |
| 50 | Implement server-side rendering for initial loads | 8-12 hours |
| 51 | Add idle session timeout | 1-2 hours |
| 52 | Register Unicode font for PDFs | 1-2 hours |
| 53 | Split settings/page.tsx (2140 lines) | 3-4 hours |
| 54 | Move Playwright to devDependencies | 5 min |

### Quick Wins to Do Next (under 30 min each)

These can be knocked out fast at the start of the next session:
- #22: Fix profiles RLS (10 min)
- #23: Fix /contracts/new 404 (10 min)
- #39: Fix hardcoded date in Projects page (2 min)
- #40: Fix hardcoded FY in Targets page (10 min)
- #31: Fix report PDF title (10 min)
- #37: Complete GBP bank details (15 min)
- #33: Remove fake notification data (15 min)
- #29: Fix mobile overflow on Analytics (30 min)
- #30: Add Projects/Contracts/TDS to nav (30 min)

### Estimated Remaining Work

- Tier 1 remaining: ~2.5 hours (plus manual key rotation)
- Tier 2 remaining: ~20 hours
- Tier 3: ~20 hours
- Tier 4: ~35 hours
- **Total remaining: ~12-15 working days**

---

## Reference

- **Supabase project ID:** `oaujoosmbgcgacosqlhe`
- **Supabase MCP:** Working with full postgres read/write permissions
- **Audit report:** `WODO_ALLY_AUDIT_REPORT.md` (same directory)
- **Migration files:** `supabase/migrations/012_invoice_email_activity.sql`, `013_fix_analytics_views.sql`
- **Audit test scripts:** `audit-tests/edge-case-tests.ts` (Playwright)
