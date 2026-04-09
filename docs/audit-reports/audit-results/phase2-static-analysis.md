# Phase 2: Static Code Analysis

## Summary

- Files analyzed: 102
- Issues found: 67 (Critical: 6, High: 14, Medium: 28, Low: 19)
- Technical debt estimate: ~40 hours

---

## 2.1 TypeScript Safety

### 2.1.1 `any` type usage (19 occurrences)

**Documented workaround (acceptable):**
- `src/lib/hooks/use-analytics.ts:8` - `type AnyClient = any` for Supabase views not in generated DB types. Used across 8 functions (lines 136, 177, 233, 255, 286, 338, 136, etc.). This is documented and understood.

**Other `as any` casts (need attention):**

| # | File | Line | Usage | Severity |
|---|------|------|-------|----------|
| 1 | `src/components/providers.tsx` | 27 | `"postgres_changes" as any` - Supabase realtime channel type mismatch | Low |
| 2 | `src/lib/hooks/use-reports.ts` | 207 | `(p as any).invoices` - accessing nested join result | Medium |
| 3 | `src/lib/hooks/use-invoices.ts` | 722 | `status: "paid" as any` - status enum mismatch when converting proforma | Medium |
| 4 | `src/lib/hooks/use-tds.ts` | 41, 90, 113 | `(supabase as any)` - tds_certificates table not in DB types | Medium |
| 5 | `src/lib/hooks/use-services.ts` | 47, 66, 85, 118, 148, 183, 191 | `(supabase as any)` - services table not in DB types (7 occurrences) | Medium |
| 6 | `src/app/api/email/send/route.ts` | 189 | `supabase as any` - invoice_email_activity table not in types | Medium |
| 7 | `src/app/(dashboard)/invoices/page.tsx` | 189, 238 | `status: "archived" as any` and `status: newStatus as any` | Medium |
| 8 | `src/app/(dashboard)/invoices/[id]/page.tsx` | 420 | `status: s as any` in onChange handler | Medium |
| 9 | `src/app/api/invoices/[id]/email-activity/route.ts` | 104, 156 | `supabase as any` (2 occurrences) | Medium |

**Assessment:** The `as any` casts on lines 722, 189, 238, and 420 for invoice status are concerning because they bypass compile-time checking of valid status transitions. If the DB enum changes, these will silently produce invalid data. The services/tds/email_activity tables need to be added to the generated DB types.

### 2.1.2 Non-null assertions (!)

| # | File | Line | Context | Risk |
|---|------|------|---------|------|
| 1 | `src/lib/supabase/server.ts` | 9-10 | `process.env.NEXT_PUBLIC_SUPABASE_URL!` | Low - will crash on startup if missing, which is the correct behavior |
| 2 | `src/lib/supabase/admin.ts` | 7-8 | `process.env.NEXT_PUBLIC_SUPABASE_URL!`, `SUPABASE_SERVICE_ROLE_KEY!` | Low - same as above |
| 3 | `src/lib/supabase/client.ts` | 6-7 | Same env vars | Low |
| 4 | `src/middleware.ts` | 10-11 | Same env vars | Low |
| 5 | `src/lib/pdf/invoice-pdf.tsx` | 547-548 | `invoice.billing_period_start!` and `billing_period_end!` | **Low** - guarded by `hasBillingPeriod` truthiness check on line 465 |
| 6 | `src/app/(dashboard)/projects/page.tsx` | 323 | `daysLeft!` and `Math.abs(daysLeft!)` | **Medium** - needs verification that daysLeft is always defined in this branch |
| 7 | `src/app/(dashboard)/invoices/[id]/page.tsx` | 514 | `invoice.billing_period_end!` | **Medium** - rendered unconditionally within a section that may not check for null |

### 2.1.3 tsconfig.json

- `strict: true` is enabled. Good.
- `noEmit: true` is set. The `typecheck` npm script runs `tsc --noEmit`.
- No issues found with TypeScript configuration.

### 2.1.4 Missing return types

Most public functions have explicit return types via `Promise<T>` in queryFn signatures. The main omission is utility functions in page components, but these are inferred correctly by TypeScript strict mode. No critical issues.

---

## 2.2 Financial Math Safety (CRITICAL)

### 2.2.1 Floating-point arithmetic on currency values

**CRITICAL - No currency rounding in invoice tax calculation:**

- `src/lib/hooks/use-invoices.ts:409` (retainer invoice generation):
  ```
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;
  ```
  No `Math.round()` to 2 decimal places. For a retainer amount of Rs.33,333, the tax at 18% is Rs.5999.94 which is fine, but for Rs.14,999 the tax is Rs.2699.82 which could produce floating point artifacts like `2699.8200000000002`.

- `src/components/shared/new-invoice-modal.tsx:85-87`:
  ```
  const subtotal = lineItems.reduce((s, item) => s + (parseFloat(item.amount) || 0) * item.quantity, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  ```
  Same issue - no rounding on tax or total. These values are stored directly to the database.

- `src/app/(dashboard)/invoices/[id]/edit/page.tsx:117`:
  ```
  const subtotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0) * item.quantity, 0);
  ```
  Same pattern in the edit page.

**CRITICAL - Balance calculation can accumulate floating-point error:**

- `src/lib/hooks/use-invoices.ts:834-841` (useRecordPayment):
  ```
  const totalReceived = (allPayments ?? []).reduce(
    (sum, p) => sum + (p.amount_received ?? 0), 0
  );
  ```
  Multiple partial payments summed with `.reduce()` can accumulate IEEE 754 errors. The balance calculation on line 852 `Math.max(0, (invoice.total_amount ?? 0) - totalReceived)` can result in a non-zero balance when the invoice is actually fully paid (e.g., `0.000000000000001`).

**HIGH - Revenue calculations mix currencies without clear conversion:**

- `src/lib/hooks/use-analytics.ts:398-402` (useDashboardKPIs):
  ```
  sum + Number(p.amount_received_inr ?? p.amount_received ?? 0)
  ```
  Falls back to `amount_received` (which could be in USD/AED/GBP) when `amount_received_inr` is null. This silently mixes currency values in the revenue total.

- Same pattern in `src/lib/hooks/use-kpi.ts:79-82`.

### 2.2.2 Division by zero guards

**Present and correct:**
- `src/lib/pdf/report-pdf.tsx:43`: `if (revenue === 0) return "0%";` - good guard.
- `src/app/(dashboard)/analytics/page.tsx:68`: `revenue > 0 ?` - good guard.
- `src/app/(dashboard)/analytics/expenses/page.tsx:87`: checks `chartData.length > 0`.
- `src/components/dashboard-v2/DarkSectionTabs.tsx:343`: `goal > 0 ?` - good guard.

**Missing guards:**
- `src/app/(dashboard)/analytics/clients/page.tsx:65`:
  ```
  return (sum / rows.length).toFixed(1);
  ```
  No check for `rows.length === 0`. Will produce `NaN` if no rows.

- `src/app/(dashboard)/analytics/clients/page.tsx:86`:
  ```
  Math.max(...top3.map((x) => Number(x.total_collected ?? 1)), 1)
  ```
  Uses `1` as fallback, but `Math.max(...[])` with an empty spread produces `-Infinity`. The `, 1)` after the spread saves this, but the intent is fragile.

- `src/app/(dashboard)/targets/page.tsx:465`:
  ```
  const pct = Math.min(Math.round((target.current_amount / target.target_amount) * 100), 100);
  ```
  No check if `target.target_amount` is 0. Would produce `Infinity` then `100` via Math.min, so the visual result is tolerable but semantically wrong.

### 2.2.3 parseInt/parseFloat usage

All `parseInt` calls use explicit radix 10 where needed. `parseFloat` is used correctly for user-entered amounts. No issues.

### 2.2.4 NaN propagation

- `src/lib/utils/format.ts:7`: `Number.isFinite(amount)` check before formatting - good.
- `src/lib/utils/format.ts:37`: Same check in `formatNumber` - good.
- `src/lib/utils/format.ts:41`: `formatPercentage` checks `Number.isFinite(n)` - good.
- `src/lib/pdf/report-pdf.tsx:33`: `Number.isFinite(amount)` check - good.

**Missing NaN guard:**
- `src/lib/hooks/use-invoices.ts:527`: `row.amount.toLocaleString("en-IN")` in `useScheduledInvoices` - no check if `row.amount` could be null/NaN. If the DB returns null, this will throw.

### 2.2.5 Currency formatting

- `src/lib/utils/format.ts:3-22`: Uses `Intl.NumberFormat("en-IN")` for INR (correct - Indian numbering system with lakhs/crores). Uses `"en-US"` for USD/AED/GBP/EUR. **Good.**
- `src/lib/pdf/invoice-pdf.tsx:44-54`: Local `formatCurrency` uses `toLocaleString("en-IN")` for ALL currencies. **HIGH** - This means a USD invoice PDF would show `$1,50,000.00` instead of `$150,000.00`. The Indian numbering system should only apply to INR.
- `src/lib/hooks/use-invoices.ts:525-527`: Scheduled invoice display amount uses `toLocaleString("en-IN")` for INR but `toLocaleString()` (default locale) for non-INR. Should use `"en-US"` for non-INR for consistency.

### 2.2.6 Bank account number discrepancy

**CRITICAL - Hardcoded bank details are inconsistent between files:**
- `src/lib/pdf/invoice-pdf.tsx:91,101`: Indian bank account = `10113982735`, IFSC = `IDFB0080181`
- `src/lib/utils/constants.ts:21-22`: Indian bank account = `10213871315`, IFSC = `IDFB0080574`
- `src/app/(dashboard)/settings/page.tsx:112`: Shows `10213871315`, IFSC = `IDFB0080574`

The invoice PDF template uses a **different account number and IFSC code** than what is shown in settings and constants. This means clients could send money to the wrong account. This is the most critical finding in this audit.

### 2.2.7 Non-GST invoice bank details are wrong

- `src/lib/pdf/invoice-pdf.tsx:98-104`: Non-GST invoices use the same bank details as GST invoices (account `10113982735`).
- `src/lib/utils/constants.ts:45-51`: The `nonGst` bank account is `10221086461` under "Shyam Singh Bhati" (personal account).

The non-GST invoice PDF should reference the personal account, not the company account.

---

## 2.3 Null Safety

### 2.3.1 Unguarded array access

- `src/lib/parsers/bank-statement.ts:150`: `workbook.SheetNames[0]` - guarded by the `if (!sheetName)` check on line 151. Good.
- `src/lib/parsers/bank-statement.ts:318-319`: `dates[0]` and `dates[dates.length - 1]` - guarded by `dates.length > 0` check. Good.

### 2.3.2 Optional chaining completeness

Generally well-handled throughout. Notable patterns:
- All Supabase query results use `data ?? []` fallback pattern. Good.
- Client lookups use `clientMap.get(id)?.property ?? "Unknown"` pattern. Good.

**Issues found:**
- `src/lib/hooks/use-invoices.ts:527`: `row.amount.toLocaleString(...)` - `row.amount` could potentially be null if the scheduled_invoices table allows null amounts. Should be `(row.amount ?? 0).toLocaleString(...)`.
- `src/lib/hooks/use-invoices.ts:376`: `(inv.project_ids ?? []).forEach((pid: string) => ...)` - the type cast `as string` assumes all project_ids are non-null strings. If the array contains null entries, this would pass them through.

### 2.3.3 Supabase query null handling

All hooks follow a consistent pattern: check for `error`, throw, then use `data ?? []`. This is correct and consistent. The `.single()` calls appropriately throw on error.

**One gap:**
- `src/lib/hooks/use-invoices.ts:126-128`: Client fetch after invoice fetch doesn't throw on error:
  ```
  const { data: clientData } = await supabase
    .from("clients").select("*").eq("id", invoiceData.client_id).single();
  ```
  If the client doesn't exist (e.g., deleted), this silently returns `clientData` as null, which is handled by the `client: clientData ?? null` assignment. This is acceptable behavior but could lead to PDF generation failures if the client fields are required.

---

## 2.4 Code Quality

### 2.4.1 Console statements in production

- `src/app/error.tsx:13`: `console.error(error)` - **Acceptable** in error boundary; Sentry would be better.
- `src/app/global-error.tsx:13`: Same as above.
- `src/app/api/email/send/route.ts:165`: `console.error("[email/send] Error:", message)` - **Acceptable** for server-side API route logging.
- `src/app/api/email/send/route.ts:198`: `console.error("[email/send] Failed to log email activity:", ...)` - Same.
- `src/app/api/invoices/[id]/email-activity/route.ts:94,118,166`: Server-side logging - acceptable.
- `src/app/api/invoices/export-csv/route.ts:159`: Server-side logging - acceptable.
- `src/app/api/invoices/[id]/send-email/route.ts:64`: `console.error("Send email error:", error)` - acceptable.

No rogue `console.log` statements found in production code. **Good.**

### 2.4.2 TODO/incomplete implementations

- `src/app/api/invoices/[id]/send-email/route.ts:50-51`:
  ```
  // TODO: Send email via nodemailer/email service
  // For now, just return success and let the activity be recorded
  ```
  **HIGH** - This API endpoint is a stub that returns success without sending any email. The separate `/api/email/send` route does actually send emails, so this route is either dead code or a misleading endpoint that could be called by mistake, giving the user false confirmation.

### 2.4.3 Dead/unused code

- `src/lib/supabase/admin.ts`: `createAdminClient()` is defined but never imported or used anywhere in the codebase. The service role key pattern is correct (server-only), but the function is dead code.
- `src/lib/hooks/use-targets.ts:32-37`: `getMonthBounds()` function is only used within `useRefreshTargetProgress`. Not dead, but could be inlined.
- `src/app/api/invoices/[id]/send-email/route.ts`: Entire file appears to be superseded by `/api/email/send/route.ts`. The older route doesn't actually send emails.

### 2.4.4 Large files (> 500 lines)

| File | Lines | Assessment |
|------|-------|------------|
| `src/app/(dashboard)/settings/page.tsx` | 2140 | **HIGH** - God component. Contains 12+ sub-components for different settings tabs all in one file. Should be split into separate components. |
| `src/lib/hooks/use-invoices.ts` | 892 | **Medium** - Large but logically cohesive. Each export is a separate hook. Could split into files per hook. |
| `src/app/(dashboard)/invoices/[id]/page.tsx` | 738 | **Medium** - Single page component with embedded modals. Payment modal should be extracted. |
| `src/lib/pdf/contract-pdf.tsx` | 656 | **Low** - Mostly styles. The component itself is reasonable length. |
| `src/lib/pdf/invoice-pdf.tsx` | 661 | **Low** - Same as above. |
| `src/components/dashboard-v2/DarkSectionTabs.tsx` | 568 | **Medium** - Contains 4 tab content sections that could be separate components. |
| `src/lib/hooks/use-analytics.ts` | 534 | **Low** - Collection of independent query hooks. |

### 2.4.5 Duplicate logic

**HIGH - Currency formatting duplicated across 6+ locations:**
- `src/lib/utils/format.ts:3-22`: Main `formatCurrency()` function
- `src/lib/pdf/invoice-pdf.tsx:44-54`: Local `formatCurrency()` with different behavior (uses Indian numbering for all currencies)
- `src/lib/pdf/report-pdf.tsx:32-39`: Local `formatINR()` function
- `src/app/(dashboard)/dashboard/page.tsx:16-19`: Local `formatINRShort()` inline
- `src/components/dashboard-v2/HeroSectionV2.tsx:33-36`: Same local function
- `src/components/dashboard-v2/DarkSectionTabs.tsx:53-56`: Same local function
- `src/app/(dashboard)/reports/page.tsx:41-43`: Same local function
- `src/components/dashboard-v2/FinancialTargetsV2.tsx:13-15`: Same local function

Each has slightly different formatting rules. These should use the centralized `format.ts` functions or a shared `formatINRShort()`.

**Medium - Financial year helpers duplicated:**
- `src/lib/hooks/use-analytics.ts:111-121`: `getCurrentFYRange()`
- `src/lib/hooks/use-targets.ts:18-25`: `getFYBounds()`
- `src/lib/hooks/use-reports.ts:40-46`: `getIndianFY()`
- `src/lib/utils/format.ts:45-61`: `getFinancialYear()` and `getFinancialYearRange()`

Four different implementations of FY date range calculation.

**Medium - Months array duplicated:**
- `src/lib/hooks/use-invoices.ts:632-633`: Inline months array in collections hook
- `src/lib/hooks/use-reports.ts:35-38`: `MONTH_NAMES` constant

### 2.4.6 Commented-out code

No commented-out code blocks found. **Good.**

### 2.4.7 Em dashes

Searched for Unicode em dash (U+2014) and en dash (U+2013) characters. **None found.** The dashes in comment separators (`// ---`) use regular hyphens. **Good - project rule followed.**

---

## 2.5 Error Handling

### 2.5.1 Supabase query error handling

All Supabase queries across all hooks check for errors after each operation and either `throw new Error(error.message)` or `throw error`. This is consistently done.

**One exception:**
- `src/lib/hooks/use-invoices.ts:245`: Line item deletion during invoice delete doesn't check for error:
  ```
  await supabase.from("invoice_line_items").delete().eq("invoice_id", id);
  ```
  If this fails silently, the subsequent invoice deletion would also fail due to FK constraints, so it's operationally safe but not clean.

- `src/lib/hooks/use-invoices.ts:433-435`: In retainer invoice generation, line item insertion error is not checked:
  ```
  await supabase.from("invoice_line_items").insert({...});
  ```
  The invoice would be created without line items, resulting in a corrupt invoice record.

### 2.5.2 API route error handling

| Route | try/catch | Auth check | Input validation |
|-------|-----------|------------|------------------|
| `/api/email/send` | Partial (template build + send wrapped separately) | Yes | Yes |
| `/api/invoices/export-csv` | No top-level try/catch | Yes | Yes (thorough) |
| `/api/invoices/[id]/send-email` | Yes (full try/catch) | Yes | Yes |
| `/api/invoices/[id]/email-activity` POST | No top-level try/catch | Yes | Yes (thorough) |
| `/api/invoices/[id]/email-activity` GET | No top-level try/catch | Yes | Basic |

**Medium** - The export-csv and email-activity routes lack top-level try/catch blocks. An unexpected error (e.g., network timeout) would result in an unhandled promise rejection and a 500 error with no structured response body.

### 2.5.3 Error boundaries

- `src/app/error.tsx`: Present. Catches route-level errors. **Good.**
- `src/app/global-error.tsx`: Present. Catches root layout errors. **Good.**
- No dashboard-level error.tsx (e.g., `src/app/(dashboard)/error.tsx`). If a dashboard page crashes, the root error boundary catches it, but the user loses the entire layout including navigation. **Medium** - should add a dashboard-scoped error boundary.

### 2.5.4 Error message leakage

- API routes return structured error messages that are derived from Supabase error messages. These could occasionally contain table names or column references.
- `src/app/api/invoices/export-csv/route.ts:160`: Returns generic "Failed to fetch invoices" rather than the raw error. **Good.**
- `src/app/api/email/send/route.ts:165`: Returns the raw error message from nodemailer, which could contain SMTP server details. **Low risk** since this is an internal tool.

### 2.5.5 Toast notifications

Every mutation hook has `onSuccess` and `onError` handlers with `toast.success()` / `toast.error()` calls. **Good - comprehensive coverage.**

### 2.5.6 Unchecked update results in target refresh

- `src/lib/hooks/use-targets.ts:318-325`: Batch updates in `useRefreshTargetProgress` fire-and-forget via `Promise.all()` but don't check individual update errors:
  ```
  await Promise.all(
    updates.map(({ id, current_amount }) =>
      supabase.from("financial_targets").update(...)
    )
  );
  ```
  If any single update fails, the entire Promise.all rejects, but partial updates may have already committed. This is a **Medium** issue for data consistency.

---

## 2.6 Environment & Secrets

### 2.6.1 Hardcoded sensitive data

**CRITICAL - Bank account numbers, IFSC codes, IBAN, routing numbers hardcoded in multiple files:**

| Data | File | Lines |
|------|------|-------|
| Indian bank account + IFSC | `src/lib/pdf/invoice-pdf.tsx` | 91-104 |
| US ACH routing + account | `src/lib/pdf/invoice-pdf.tsx` | 113-118 |
| UAE IBAN | `src/lib/pdf/invoice-pdf.tsx` | 124-130 |
| GSTIN | `src/lib/pdf/invoice-pdf.tsx` | 490 |
| CIN | `src/lib/pdf/invoice-pdf.tsx` | 491 |
| Same data | `src/lib/utils/constants.ts` | 18-53 |
| Same data | `src/lib/pdf/contract-pdf.tsx` | 23-27 |
| Same data | `src/lib/email/templates.ts` | 173 |
| Same data | `src/app/(dashboard)/settings/page.tsx` | 110-136 |

While GSTIN and CIN are public registration numbers, **bank account numbers, IBAN, and ACH routing numbers** should be stored in environment variables or a secure configuration source, not hardcoded across multiple source files. Any code leak would expose payment infrastructure.

Furthermore, these values are duplicated and **inconsistent** (see section 2.2.6 above).

### 2.6.2 SMTP credentials

- `src/lib/email/client.ts:9-10`: Falls back to hardcoded `"accounts@wodo.digital"` for SMTP user and empty string for password. The empty string fallback means emails would fail silently in local dev rather than throwing a clear error. **Low.**

### 2.6.3 SUPABASE_SERVICE_ROLE_KEY

- Only referenced in `src/lib/supabase/admin.ts:8` which is a server-side file. **Good.**
- Not used in any client-side code. **Good.**
- The function `createAdminClient()` is never actually called anywhere, so the service role key is never used at all.

### 2.6.4 NEXT_PUBLIC_ variables

Only two NEXT_PUBLIC variables are used:
- `NEXT_PUBLIC_SUPABASE_URL` - Public-safe (this is the project's public URL)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public-safe (anon key is designed to be public)

**Good - no sensitive data exposed via NEXT_PUBLIC_.**

### 2.6.5 .env.example

Could not read (permission denied), but `.env.example` and `.env.local` both exist. The presence of `.env.example` is good practice.

---

## 2.7 Performance

### 2.7.1 Unbounded data fetches (no pagination)

**HIGH - Multiple queries fetch all records without pagination:**

| Hook | Table | Issue |
|------|-------|-------|
| `useTransactions()` | transactions | Fetches ALL transactions, then filters client-side by search term |
| `usePaymentsList()` | invoice_payments | Fetches ALL payments |
| `useInvoices()` | invoices | Fetches ALL invoices (no limit) |
| `useClients()` | clients | Fetches ALL clients |
| `useProjects()` | projects | Fetches ALL projects |
| `useContracts()` | contracts | Fetches ALL contracts |
| `useCollectionsInvoices()` | invoices | Fetches ALL outstanding invoices |
| `useBankStatements()` | bank_statements | Fetches ALL statements |

For an internal agency tool with limited data, this is acceptable short-term, but will degrade as data grows. The transactions table is the most likely to grow large first (thousands of rows from bank statements).

**Specific concern:** `useTransactions()` at `src/lib/hooks/use-transactions.ts:86-94` performs client-side text search:
```
rows = rows.filter(
  (t) =>
    t.particulars.toLowerCase().includes(term) || ...
);
```
This downloads all transactions to the browser, then filters. Should use Supabase `.ilike()` for server-side search.

### 2.7.2 N+1 query patterns

The hooks generally avoid N+1 by fetching related data in bulk (e.g., fetching all client IDs at once with `.in("id", clientIds)`). **Good pattern.**

However, `useDashboardKPIs()` makes **6 separate Supabase queries** sequentially:
- `src/lib/hooks/use-analytics.ts:392-460`: thisMonthPayments, lastMonthPayments, outstandingInvoices, active_clients count, overdue_invoices count, retainerProjects

These could be combined into fewer queries or a single Supabase RPC function.

### 2.7.3 PDF component loading

- No `React.lazy()` or `next/dynamic` imports found for PDF components. **Medium.**
- `@react-pdf/renderer` is a heavy dependency (~1.5MB). It's imported synchronously in:
  - `src/lib/pdf/index.ts`
  - `src/lib/pdf/invoice-pdf.tsx`
  - `src/lib/pdf/contract-pdf.tsx`
  - `src/lib/pdf/report-pdf.tsx`
- These should use dynamic imports when consumed by page components to avoid loading the PDF library on every page load.

### 2.7.4 Memo/useMemo usage

Analytics and list pages appropriately use `useMemo` for computed data (14 occurrences across pages). **Good.**

No `React.memo` found on any component. For the dashboard with many sub-components, this could cause unnecessary re-renders.

### 2.7.5 QueryClient configuration

- `src/components/providers.tsx:50-55`: `staleTime: 30_000` (30 seconds) globally. **Good balance** for an internal tool.
- `refetchOnWindowFocus: true` enabled. **Good** for keeping data fresh.

### 2.7.6 Realtime subscriptions

- `src/components/providers.tsx:9-17`: Subscribes to 7 tables for realtime changes. Each change invalidates query keys. This is an efficient pattern, but the realtime subscription to ALL tables may cause unnecessary background traffic if the app is left open.

---

## 2.8 Dependencies

### 2.8.1 Package analysis

| Package | Version | Status |
|---------|---------|--------|
| `next` | 14.2.35 | **Medium** - Next.js 15 is the current major version. 14.2.x is still receiving patches but missing newer features. |
| `react` / `react-dom` | ^18 | Stable. React 19 is available but 18 is still fully supported. |
| `@supabase/supabase-js` | ^2.49.4 | Current. |
| `xlsx` | ^0.18.5 | **HIGH** - SheetJS community edition. The npm package `xlsx` was deprecated/relicensed. The maintainer removed it from npm and replaced it with `xlsx` as a commercial product. Version 0.18.5 has known security advisories (prototype pollution). Should migrate to `xlsx` from CDN, use `sheetjs` package, or switch to an alternative like `exceljs`. |
| `playwright` | ^1.59.1 | **Medium** - Listed as a production dependency, not devDependency. Playwright is a testing/automation framework and should be in `devDependencies` if used for testing, or removed if not used. It adds ~50MB to node_modules. |
| `@sentry/nextjs` | ^10.42.0 | Present in package.json but the Sentry config files are excluded from tsconfig (`sentry.client.config.ts`, etc.). Sentry is configured. |
| `nodemailer` | ^6.10.0 | Stable, server-side only. Types are in devDeps. |
| `@react-pdf/renderer` | ^4.3.0 | Current major version. |

### 2.8.2 Unused dependencies

- `playwright` (^1.59.1) - In `dependencies`, not `devDependencies`. No test files found in the codebase using Playwright. If used for PDF generation or testing, should be in `devDependencies`.

### 2.8.3 Missing dependencies

- No `@types/xlsx` found, but the `xlsx` package bundles its own types.
- No testing framework (jest, vitest) is present. There are zero test files in the codebase. **Medium** - a fintech platform should have test coverage for financial calculations.

---

## Additional Findings

### A.1 Quarterly report date range bug

- `src/lib/hooks/use-reports.ts:108-110`:
  ```
  const quarterEnd = new Date(report_year, report_month + 1, 0);
  ```
  For quarterly reports, `report_month` is the first month of the quarter (e.g., 4 for Q1). The code creates a date for month index `report_month + 1` (= month 5 = June), day 0 (= last day of May). This only gives a **2-month quarter** (Apr-May) instead of 3 months (Apr-Jun). The correct end date should be `new Date(report_year, report_month + 2, 0)` to get the last day of the 3rd month.

### A.2 Proforma reference collision risk

- `src/lib/invoice/number-generator.ts:9-11`:
  ```
  const suffix = String(Date.now()).slice(-3);
  return `PF-${date}-${suffix}`;
  ```
  The suffix is the last 3 digits of `Date.now()`. If two proformas are generated within the same millisecond (unlikely for single user, but possible with automation), they'd get the same reference. More importantly, the last 3 digits cycle every second (1000ms), so two proformas generated exactly 1 second apart would also collide. Should use a DB sequence or UUID suffix.

### A.3 Invoice PDF logo path issue

- `src/lib/pdf/invoice-pdf.tsx:486`:
  ```
  <Image src="/public/wodo-logo.png" style={styles.logo} />
  ```
  In Next.js, the `public` directory is served at the root. The path should be `/wodo-logo.png`, not `/public/wodo-logo.png`. However, `@react-pdf/renderer` runs server-side and may need an absolute filesystem path or URL. This might work in development but fail in production.

- Same issue at line 640: `/public/wodo-stamp.png`.

### A.4 Race condition in finalize + convert flows

- `src/lib/hooks/use-invoices.ts:295-296`: `getNextInvoiceNumber()` is called without any locking mechanism. If two invoices are finalized simultaneously, they could receive the same invoice number. The RPC function `get_next_invoice_number` presumably handles this with a DB sequence, but this depends on the Supabase function implementation.

### A.5 Client-side search filtering downloads all data

- `src/lib/hooks/use-transactions.ts:86-94`: The search filter downloads ALL transactions and filters in JavaScript. For large datasets, this is wasteful.

### A.6 Missing input sanitization on email templates

- `src/lib/email/templates.ts`: Client names and invoice numbers are interpolated directly into HTML templates without escaping. If a client name contains `<script>` tags or HTML entities, they would be injected into the email. **Low risk** since client names come from the database and are entered by authenticated users, but still a defense-in-depth concern.

### A.7 Middleware allows all API routes without auth

- `src/middleware.ts:39`: `path.startsWith("/api/")` bypasses the auth redirect. This means API routes must each implement their own auth check. All current API routes do this correctly, but a new route could accidentally be unprotected. Consider adding auth at the middleware level for API routes.

### A.8 Orphaned realtime table subscriptions

- `src/components/providers.tsx:15`: Subscribes to `"expenses"` and `"payments"` tables for realtime changes, but the database schema appears to have tables named `transactions` and `invoice_payments` instead. These subscriptions would silently fail to receive events, meaning the UI wouldn't auto-refresh on expense/payment changes.

### A.9 Settings page is a single 2140-line file

- `src/app/(dashboard)/settings/page.tsx`: Contains approximately 12 independently functioning settings sections (company info, bank details, services management, expense rules, TDS certificates, contract templates, etc.) all in a single file. This is the largest file in the codebase by far and represents significant technical debt. Each section should be a separate component.
