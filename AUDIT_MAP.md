# WODO Ally - Production Audit Map

Generated: 2026-03-04 (Final pass completed same session)

---

## Route Map

| URL | File |
|-----|------|
| `/` | `src/app/page.tsx` |
| `/login` | `src/app/(auth)/login/page.tsx` |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` |
| `/clients` | `src/app/(dashboard)/clients/page.tsx` |
| `/clients/[id]` | `src/app/(dashboard)/clients/[id]/page.tsx` |
| `/clients/[id]/edit` | `src/app/(dashboard)/clients/[id]/edit/page.tsx` |
| `/invoices` | `src/app/(dashboard)/invoices/page.tsx` |
| `/invoices/[id]` | `src/app/(dashboard)/invoices/[id]/page.tsx` |
| `/invoices/[id]/edit` | `src/app/(dashboard)/invoices/[id]/edit/page.tsx` |
| `/payments` | `src/app/(dashboard)/payments/page.tsx` |
| `/expenses` | `src/app/(dashboard)/expenses/page.tsx` |
| `/expenses/upload` | `src/app/(dashboard)/expenses/upload/page.tsx` |
| `/expenses/transactions` | `src/app/(dashboard)/expenses/transactions/page.tsx` |
| `/projects` | `src/app/(dashboard)/projects/page.tsx` |
| `/pipeline` | `src/app/(dashboard)/pipeline/page.tsx` |
| `/contracts` | `src/app/(dashboard)/contracts/page.tsx` |
| `/targets` | `src/app/(dashboard)/targets/page.tsx` |
| `/settings` | `src/app/(dashboard)/settings/page.tsx` |
| `/onboard` | `src/app/(dashboard)/onboard/page.tsx` |
| `/reports` | `src/app/(dashboard)/reports/page.tsx` |
| `/analytics` | `src/app/(dashboard)/analytics/page.tsx` |
| `/analytics/invoices` | `src/app/(dashboard)/analytics/invoices/page.tsx` |
| `/analytics/expenses` | `src/app/(dashboard)/analytics/expenses/page.tsx` |
| `/analytics/clients` | `src/app/(dashboard)/analytics/clients/page.tsx` |
| `/analytics/projects` | `src/app/(dashboard)/analytics/projects/page.tsx` |
| `/analytics/pl` | `src/app/(dashboard)/analytics/pl/page.tsx` |
| `/analytics/balance` | `src/app/(dashboard)/analytics/balance/page.tsx` |

**Status: All routes valid. `not-found.tsx` created for unmatched routes.**

---

## Unused Packages Removed

The following 19 packages were confirmed unused and removed:

| Package | Reason |
|---------|--------|
| @radix-ui/react-alert-dialog | Not imported in src/ |
| @radix-ui/react-avatar | Not imported in src/ |
| @radix-ui/react-checkbox | Not imported in src/ |
| @radix-ui/react-dialog | Not imported in src/ |
| @radix-ui/react-dropdown-menu | Not imported in src/ |
| @radix-ui/react-label | Not imported in src/ |
| @radix-ui/react-popover | Not imported in src/ |
| @radix-ui/react-progress | Not imported in src/ |
| @radix-ui/react-scroll-area | Not imported in src/ |
| @radix-ui/react-select | Not imported in src/ |
| @radix-ui/react-separator | Not imported in src/ |
| @radix-ui/react-slot | Not imported in src/ |
| @radix-ui/react-switch | Not imported in src/ |
| @radix-ui/react-tabs | Not imported in src/ |
| @radix-ui/react-toast | Not imported in src/ |
| @radix-ui/react-tooltip | Not imported in src/ |
| class-variance-authority | Not imported in src/ |
| cmdk | Not imported in src/ |
| next-themes | Not imported in src/ |

**Packages kept (in use):**
- `@radix-ui/react-collapsible` - used in HeroSectionV2.tsx
- `@sentry/nextjs` - used in next.config.mjs + sentry config files
- `@tiptap/pm` - peer dependency of other tiptap packages
- `tailwindcss-animate` - plugin in tailwind.config.ts

---

## Dead Code Removed

| Item | File | Action |
|------|------|--------|
| `StatCard` component | `src/components/shared/stat-card.tsx` | DELETED |
| `src/components/shared/index.ts` | barrel export | DELETED |

**Public folder orphans (not referenced in src/):**
- `public/reference 1.png` - orphaned design reference (safe to delete manually)
- `public/reference 2.png` - orphaned design reference (safe to delete manually)
- `public/reference 3.png` - orphaned design reference (safe to delete manually)

---

## Calculations Fixed

| Issue | File | Fix Applied |
|-------|------|-------------|
| `formatCurrency()` - no NaN guard | `src/lib/utils/format.ts` | Added `Number.isFinite()` check, defaults to 0 |
| `formatNumber()` - no NaN guard | `src/lib/utils/format.ts` | Added `Number.isFinite()` check, defaults to 0 |
| `formatPercentage()` - no Infinity guard | `src/lib/utils/format.ts` | Added `Number.isFinite()` check, returns "0.0%" for invalid |
| `formatINR()` - no NaN guard | `src/lib/pdf/report-pdf.tsx` | Added `Number.isFinite()` check, defaults to 0 |
| `financialRows` in report PDF | `src/lib/pdf/report-pdf.tsx` | Added `?? 0` on all `d.*` fields to handle missing report data |

**All hook calculations (use-analytics, use-invoices, use-transactions, use-targets) are safe - proper null coalescing throughout. All division operations guarded by zero-checks.**

---

## Dashboard & Hero Section - Real Data Wired

### Dashboard page (`dashboard/page.tsx`)
All KPI cards and DarkSectionTabs are wired to real hooks:
- KPI cards: `useDashboardKPIs()`
- Attention tab: `useCollectionsInvoices()`
- Payments tab: `usePaymentsList()`
- Targets tab: `useTargets()`
- Pipeline tab: `useScheduledInvoices()`

### HeroSectionV2 (`components/dashboard-v2/HeroSectionV2.tsx`)
Wired to real hooks (previously all hardcoded):
- Accordion Revenue panel: `useMonthlyPL()` - last 3 months actual revenue
- Accordion Collections panel: `useCollectionsInvoices()` - live overdue/due-soon client list
- Accordion Outstanding panel: computed from `useCollectionsInvoices()` grouped by urgency
- Revenue growth chart: MoM % computed from `useMonthlyPL()` last 3 months
- Hero narrative text: dynamic MoM % + attention count from real data

### Balance sheet (`analytics/balance/page.tsx`)
Dynamic fields (bank balance, receivables, net worth, current ratio) are wired to real hooks.
Static fields (fixed assets, liabilities) represent manually-maintained accounting entries
for WODO Digital and are intentionally static pending a dedicated balance sheet module.

---

## Navigation Audit

- All TopNavV2 links: valid
- All FloatingFAB links: valid
- All modal redirects: valid
- No broken 404 routes found
- `src/app/not-found.tsx` created - branded 404 page for unmatched routes

---

## Forms & Error Handling

| Issue | File | Fix Applied |
|-------|------|-------------|
| No error handler on mutation | `clients/[id]/edit/page.tsx` | Added `onError` toast: "Failed to save changes." |

---

## Console Logging

All console statements are intentional error logging (not debug logs):
- `src/app/global-error.tsx` - error boundary
- `src/app/error.tsx` - error boundary
- `src/app/(dashboard)/reports/page.tsx` - PDF generation errors
- `src/app/(dashboard)/invoices/[id]/page.tsx` - PDF download errors
- `src/app/api/email/send/route.ts` - email send errors

---

## Summary Checklist

- [x] Full codebase inventory completed
- [x] Unused packages removed (19 packages)
- [x] Dead code removed (StatCard, unused barrel index.ts)
- [x] All routes verified and working
- [x] not-found.tsx created (branded 404 page)
- [x] All navigation links verified
- [x] Error pages in place (error.tsx, global-error.tsx, not-found.tsx)
- [x] format.ts NaN/Infinity guards added
- [x] report-pdf.tsx NaN/null guards added
- [x] All hook calculations verified safe
- [x] Dashboard DarkSectionTabs wired to real hooks
- [x] HeroSectionV2 accordion + chart wired to real hooks (no more dummy data)
- [x] Edit client page: error handler added
- [x] ESLint: 0 warnings, 0 errors (invoice-pdf.tsx PDF Image elements suppressed)
- [x] Run final npm run build - PASSED (27 pages, 0 errors)
- [x] Run npm run lint - PASSED (0 warnings, 0 errors)
