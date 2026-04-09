# Phases 10 & 13: PDF Generation & Edge Case Audit

## Summary
- PDF templates reviewed: 3 (invoice-pdf.tsx, contract-pdf.tsx, report-pdf.tsx)
- Edge case tests executed: 16 (Playwright) + extensive code review
- Issues found: 34 (Critical: 4, High: 9, Medium: 13, Low: 8)

---

## Phase 10: PDF Generation

### Invoice PDF (`src/lib/pdf/invoice-pdf.tsx`)

#### Invoice Type Handling
| Check | Status | Details |
|-------|--------|---------|
| GST invoice | PARTIAL | Shows "TAX INVOICE" title. Tax line shows `GST @ {rate}%` but does NOT differentiate CGST+SGST vs IGST. All GST invoices show a single "GST" line regardless of intra-state or inter-state. |
| International invoice | OK | Shows "INVOICE" title, no tax line (tax_rate = 0), correct bank details per currency. |
| Non-GST invoice | OK | Shows "INVOICE" title, no tax line. Same domestic bank details as GST. |
| Pro Forma invoice | OK | Shows "PROFORMA INVOICE" title, uses proforma_ref for number. |

**ISSUE [HIGH] #P10-01**: GST invoices do not split tax into CGST + SGST (intra-state Karnataka) vs IGST (inter-state). Indian tax law requires this distinction. Currently, a single "GST @ 18%" line is shown. For a client in Karnataka, it should show "CGST @ 9%" and "SGST @ 9%". For out-of-state, it should show "IGST @ 18%".

#### Company Header
| Field | Value in PDF | Status |
|-------|-------------|--------|
| Company Name | WODO Digital Private Limited | CORRECT |
| GSTIN | 29AADCW8591N1ZA | CORRECT |
| CIN | U72900KA2021PTC153659 | CORRECT |
| Address | #1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore - 560091 | CORRECT |

#### Bank Details Verification
| Invoice Type | Currency | Bank | Account | IFSC/Routing | Status |
|-------------|----------|------|---------|-------------|--------|
| GST | INR | IDFC FIRST Bank | 10113982735 | IDFB0080181 | VERIFY WITH OWNER |
| Non-GST | INR | IDFC FIRST Bank | 10113982735 | IDFB0080181 | Same as GST (VERIFY) |
| International | USD | Community Federal Savings Bank | 8335312671 | ACH: 026073150 | VERIFY - likely Wise/Skydo intermediary |
| International | AED | Zand Bank PJSC | IBAN: AE190960000691060009302 | SWIFT: ZANDAEAAXXX | VERIFY |
| International | GBP | N/A | N/A | N/A | INCOMPLETE - just says "contact accounts@wodo.digital" |

**ISSUE [MEDIUM] #P10-02**: GBP bank details are incomplete - only a "contact us" note. Should have full bank details like USD and AED.

**ISSUE [MEDIUM] #P10-03**: Bank details are hardcoded in the source code. These should ideally be stored in a settings/config table so they can be updated without code deployment. Phase 2 flagged a potential bank details mismatch - these values need verification against actual bank accounts.

#### Currency Display
| Currency | Symbol Used | Format | Status |
|----------|------------|--------|--------|
| INR | Rs. | en-IN (lakhs format) | ISSUE |
| USD | $ | en-IN (lakhs format) | BUG |
| AED | AED  | en-IN (lakhs format) | BUG |
| GBP | GBP  | en-IN (lakhs format) | BUG |
| EUR | Falls to Rs. | en-IN | BUG |

**ISSUE [HIGH] #P10-04**: `formatCurrency()` in invoice-pdf.tsx uses `toLocaleString("en-IN")` for ALL currencies, including USD, AED, and GBP. This applies Indian numbering (lakhs/crores) to foreign currencies. For example, $1,000,000 would display as "$10,00,000.00" which is incorrect for international invoices. Indian numbering should only apply to INR.

**ISSUE [MEDIUM] #P10-05**: EUR currency falls through to the default `Rs.` symbol. If a Euro-denominated invoice is ever created, it will show "Rs." instead of the Euro sign.

#### Line Items
- Description, quantity, and amount are rendered correctly.
- Quantity > 1 shows "(x{quantity})" suffix - good.
- Amount is calculated as `item.amount * item.quantity` per row - correct.

**ISSUE [MEDIUM] #P10-06**: No pagination handling for many line items. The table renders within a single `<Page>`. If there are 20+ line items, content will overflow the page without proper page breaks. `react-pdf` supports `wrap` and `break` attributes on `<View>`, but these are not used on the line items table.

#### NaN/Null Safety
- `invoice.due_date` is null-checked before rendering (conditional render) - OK.
- `invoice.notes` is null-checked - OK.
- `client.address`, `client.city`, etc. are null-checked - OK.
- `client.gstin` and `client.tax_number` are null-checked - OK.
- `invoice.billing_period_start/end` are null-checked - OK.

**ISSUE [MEDIUM] #P10-07**: `formatCurrency()` does NOT check for NaN/null/undefined input. If `invoice.subtotal`, `invoice.tax_amount`, or `invoice.total_amount` is null/undefined/NaN, the output would be "Rs.NaN". The report-pdf.tsx handles this with `Number.isFinite()` but invoice-pdf.tsx does not.

**ISSUE [LOW] #P10-08**: `formatDate()` uses try/catch for error handling but does not check for null input. If `invoice.invoice_date` is null (unlikely but possible), `new Date(null)` returns epoch date "01 Jan 1970" instead of showing "N/A". The contract-pdf.tsx handles null dates properly.

#### Other Invoice PDF Observations
- Terms & Conditions section: NOT present in the invoice PDF. There is a "NOTES" section (from `invoice.notes`) but no dedicated T&C section.
- Stamp/Signature: Present. Uses `/public/wodo-stamp.png`. Signatory: "Shyam Singh Bhati, Authorized Signatory".
- Font: Helvetica (built-in PDF font) - professional and reliable.
- Logo: Uses `/public/wodo-logo.png` via relative path.

**ISSUE [HIGH] #P10-09**: Logo and stamp image paths use `/public/wodo-logo.png` and `/public/wodo-stamp.png`. In `@react-pdf/renderer`, relative paths like this may fail in server-side rendering because they resolve relative to the process CWD, not the public directory. The paths should be absolute URLs (e.g., `https://wodo-ally-production.up.railway.app/wodo-logo.png`) or use Node.js `path.resolve` for server-side rendering. This could cause PDF generation to fail silently with broken images.

**ISSUE [LOW] #P10-10**: No "Terms & Conditions" section on invoices. Professional invoices typically include payment terms, late payment penalties, and dispute resolution clauses.

---

### Contract PDF (`src/lib/pdf/contract-pdf.tsx`)

#### Template Structure
The contract follows a professional legal structure:
1. Header with company info and contract metadata
2. Document title with contract type label
3. Party details (Service Provider and Client) - side by side
4. Section 1: Work and Payment (Deliverables + Payment Terms)
5. Additional contract data fields (dynamic key-value pairs)
6. Notes section
7. Boilerplate sections 2-11 (Ownership, Confidentiality, Revisions, Delays, Warranties, Liability, Governing Law, Force Majeure, Entire Agreement, Acceptance)
8. Signature block for both parties
9. Page-numbered footer

#### Legal Structure Assessment
| Element | Present | Quality |
|---------|---------|---------|
| Parties identification | Yes | Good - both sides with addresses |
| Scope of work | Yes | Via deliverables field |
| Payment terms | Yes | Via payment_terms field |
| IP ownership | Yes | Section 2 |
| Confidentiality | Yes | Section 3 |
| Termination/Cancellation | Yes | Section 5 |
| Limitation of liability | Yes | Section 7 |
| Governing law | Yes | Section 8 - India/Bangalore |
| Force majeure | Yes | Section 9 |
| Signature block | Yes | Both parties with date fields |

**ISSUE [LOW] #P10-11**: Client party box only shows company name, currency, and project name. It does NOT include the client's address, contact person, or registration details. For legal validity, both parties should have complete identification.

#### NaN/Null Safety
- `contract.contract_date` and `contract.signed_date` are null-checked - OK.
- `formatDate()` handles null with "N/A" return - GOOD.
- `renderContractDataFields()` handles null, arrays, and non-object contract_data - GOOD.
- `contract.notes` is null-checked - OK.
- `contract.project` is null-checked - OK.

#### Pricing
**ISSUE [MEDIUM] #P10-12**: The contract PDF does NOT include pricing/amount information. The contract_data may contain pricing fields (rendered as key-value pairs), but there is no dedicated pricing section. A contract should clearly state the total contract value, payment schedule, and currency.

#### Pagination
- Boilerplate sections use `wrap={false}` - good, prevents splitting a section across pages.
- Signature block uses `wrap={false}` - good.
- Footer uses `fixed` attribute - renders on every page.
- `render={({ pageNumber, totalPages })` for page numbers - GOOD.

---

### Report PDF (`src/lib/pdf/report-pdf.tsx`)

#### Sections Included
| Section | Present | Data Source |
|---------|---------|------------|
| Key Metrics (Revenue, Expenses, Net Profit, MRR) | Yes | ReportData |
| Client Summary (Active, New, Projects, Outstanding) | Yes | ReportData |
| Top Clients by Revenue | Yes | ReportData.topClients (top 3) |
| Financial Snapshot table | Yes | Derived from ReportData |
| Confidential badge | Yes | Static |

**ISSUE [MEDIUM] #P10-13**: Report PDF has NO charts/visualizations. Only metric cards and tables. While `@react-pdf/renderer` cannot render Recharts, there are alternatives: (a) use react-pdf's drawing primitives to create simple bar charts, (b) pre-render charts as PNG images and embed them. For investor consumption, visual charts are important.

**ISSUE [LOW] #P10-14**: Report only shows "Monthly Performance Report" title regardless of whether it is monthly, quarterly, or annual. The `report_type` field from the generation payload is not reflected in the PDF title.

#### NaN/Null Safety
- `formatINR()` uses `Number.isFinite(amount) ? amount : 0` - EXCELLENT. Protects against NaN.
- `getProfitMargin()` handles division by zero: `if (revenue === 0) return "0%"` - GOOD.
- `d.revenue ?? 0`, `d.expenses ?? 0`, etc. use nullish coalescing - GOOD.
- `d.topClients` is checked for existence and length before rendering - GOOD.

#### Professional Quality for Investors
- Clean dark header with "CONFIDENTIAL" badge - GOOD.
- Color-coded metrics (green for revenue, orange for profit, blue for MRR) - GOOD.
- Metric cards with labels and sub-descriptions - GOOD.
- Footer with contact info and address - GOOD.

**ISSUE [LOW] #P10-15**: No comparison to previous month/quarter data. Investors typically want to see growth trends (month-over-month change, YTD totals).

---

### Cross-Cutting PDF Issues

**ISSUE [CRITICAL] #P10-16**: `generateInvoicePdf()` in `index.ts` returns a `Blob` (browser API), while `generateContractPdf()` and `generateReportPdf()` return `Uint8Array`. This inconsistency could cause issues when integrating with server-side APIs that expect one format. The invoice generation also lacks a try-catch wrapper at the generation level.

**ISSUE [HIGH] #P10-17**: No error handling wrapping the PDF generation calls. If `@react-pdf/renderer` encounters an error (e.g., broken image URL, invalid style), the entire PDF generation fails with an unhandled exception. The caller in `invoice/[id]/page.tsx` has a try-catch that only logs to console - no user-facing error toast is shown.

**ISSUE [MEDIUM] #P10-18**: Dynamic import pattern is used for invoice PDF (`await import("@/lib/pdf")`) which is good for code splitting. However, contract PDF and report PDF are imported statically in their respective pages, bundling the heavy `@react-pdf/renderer` library into those page bundles.

**ISSUE [LOW] #P10-19**: All PDFs use Helvetica (built-in). This works but limits character support to Latin-1. If client names contain Hindi, Kannada, or other non-Latin characters, they will render as blank/missing glyphs. Consider registering a Unicode font.

---

## Phase 13: Error Handling & Edge Cases

### Playwright Test Results

| ID | Test | Result | Details |
|----|------|--------|---------|
| T01 | Invalid UUID client page (/clients/00000000-...) | PASS | Page loads with error state (client not found), does not crash |
| T02 | Non-existent invoice (/invoices/nonexistent-id) | WARN | Shows infinite loading spinner instead of "invoice not found" message. Never resolves. |
| T03 | Completely fake route (/completely-fake-route) | PASS | Returns 404 status. Shows custom 404 page with "Page not found" and navigation options. |
| T04 | Empty required fields form submission | WARN | No visible validation messages detected when attempting empty form submit. Relies on HTML `required` attribute only. |
| T05 | Very long text (5000 chars) in company name | WARN | Field accepted all 5000 characters. No maxlength constraint. Could cause DB column overflow or PDF layout issues. |
| T06 | Special characters (<>"'&) in text fields | PASS | React auto-escapes on render. No XSS risk. |
| T07 | Negative numbers in amount fields | WARN | Negative value (-100) accepted. No min="0" or validation to prevent negative invoice amounts. |
| T08 | Zero in amount fields | PASS | Zero accepted (valid for some scenarios). |
| T09 | Extremely large numbers (999999999999) in amounts | WARN | Accepted without upper bound validation. Could cause numeric overflow or display issues. |
| T10 | Double submit (rapid form clicks) | WARN | Code review shows `disabled={isPending}` pattern used in mutation buttons (RecordPayment, Finalize, etc.). Not all forms have this protection. |
| T11 | Browser back/forward during navigation | PASS | Page renders correctly after back navigation. |
| T12 | Console errors across all pages | WARN | 58 console errors detected across 12 pages. See detailed breakdown below. |
| T13 | Loading states vs blank screens | PASS | Loading indicator (animate-spin) detected during page load. Dashboard has loading.tsx. |
| T14 | Rapid button clicks | PASS | Page remains functional after rapid clicks. |
| T15 | Slow network behavior | PASS | Dashboard loaded in ~25 seconds on simulated slow network. Content eventually renders. |
| T16 | Error messages leak technical details | PASS | API error responses return clean error messages ("invoiceType must be one of..."), no stack traces or SQL errors exposed. |

### Console Errors Captured (Deduplicated)

| Category | Count | Error | Severity |
|----------|-------|-------|----------|
| RSC Payload Fetch | ~8 | "Failed to fetch RSC payload for /pipeline, /expenses, /analytics/projects, /dashboard, /clients. Falling back to browser navigation." | Medium - indicates client-side navigation issues, likely from prefetch or stale cache |
| Supabase Auth | ~2 | "TypeError: Failed to fetch" in Supabase auth `_getUser` call | Medium - auth session may be expiring or network timing issue |
| HTTP 406 | ~3 | "Failed to load resource: the server responded with a status of 406" | Medium - API content negotiation failure |
| HTTP 400 | ~12 | "Failed to load resource: the server responded with a status of 400" | Low - likely Supabase query failures for invalid IDs |
| HTTP 404 | ~4 | "Failed to load resource: the server responded with a status of 404" | Low - expected for non-existent resources |
| React Hydration #425 | ~8 | "Minified React error #425" - Text content mismatch during hydration | HIGH - indicates SSR/CSR mismatch. Common cause: dates, random values, or locale-dependent formatting rendered differently on server vs client. |
| React Hydration #422 | ~8 | "Minified React error #422" - Hydration failed because the server-rendered HTML didn't match the client | HIGH - same root cause as #425 |

**ISSUE [CRITICAL] #P13-01**: React hydration errors (#425 and #422) appear on EVERY page load. This indicates a systematic SSR/CSR mismatch issue. Root cause is likely date formatting (using `new Date()` or `toLocaleString()` which produces different results on server vs client), or conditional rendering based on browser APIs. This can cause layout jumps and performance issues.

### Error Handling Code Review

#### Error Boundaries
| File | Has error.tsx | Has loading.tsx | Notes |
|------|--------------|----------------|-------|
| `src/app/error.tsx` | Yes | N/A | Global error boundary. Generic "Something went wrong" with "Try again" button. |
| `src/app/global-error.tsx` | Yes | N/A | Root-level error boundary. Same generic message. |
| `src/app/not-found.tsx` | Yes | N/A | Custom 404 page with "Go to Dashboard" and "Go back" buttons. |
| `src/app/(dashboard)/loading.tsx` | N/A | Yes | Spinner loading state for dashboard layout. |
| Per-route error.tsx files | NONE | NONE | No route-level error boundaries exist. All errors bubble up to the root error.tsx. |

**ISSUE [HIGH] #P13-02**: No route-level error boundaries. If a single page component fails (e.g., `/analytics` throws during data parsing), the entire dashboard layout is replaced with the generic error screen. Route-specific error.tsx files would contain errors to the specific page while keeping the sidebar/nav intact.

#### Loading States
| Page | Loading State | Empty State | Notes |
|------|--------------|-------------|-------|
| Dashboard | StatCardSkeleton | N/A | Good skeleton loading |
| Clients list | Not checked | No EmptyState imported | May show blank |
| Client detail | Loader2 spinner | Shows error via query | OK |
| Invoices list | Not checked | Not checked | May show blank |
| Invoice detail | Loader2 spinner | Shows spinner indefinitely for invalid IDs (BUG) | See T02 |
| Projects | Not checked | EmptyState component | Good |
| Payments | Not checked | EmptyState component | Good |
| Analytics | Skeleton components | EmptyState components | Good |
| Reports | Skeleton components | EmptyState component | Good |
| Expenses | Not checked | EmptyState (partial) | Good |

**ISSUE [HIGH] #P13-03**: Invoice detail page (`/invoices/[id]/page.tsx`) shows an infinite loading spinner when the invoice ID is invalid or not found. The code at line 354-359 shows:
```typescript
if (isLoading || !invoice) {
  return <Loader2 spinner />;
}
```
This treats "not found" (invoice is null after loading completes) the same as "still loading". It should check `isLoading` and `isError` separately and show a "Not Found" message when the query completes without data.

#### Hooks Error Handling Assessment

| Hook | Supabase errors | onError toast | Fallback values | Rating |
|------|----------------|---------------|-----------------|--------|
| useInvoices | `throw new Error()` | N/A (query) | `?? []` | Good |
| useInvoice | `throw new Error()` | N/A (query) | `?? null` | Good |
| useCreateInvoice | `throw new Error()` | `toast.error()` | N/A | Good |
| useUpdateInvoice | `throw new Error()` | `toast.error()` | N/A | Good |
| useDeleteInvoice | `throw new Error()` | `toast.error()` | Safety check: only deletes drafts | Good |
| useFinalizeInvoice | `throw new Error()` | `toast.error()` | Status check | Good |
| useRecordPayment | `throw new Error()` | `toast.error()` | `?? 0` defaults | Good |
| useClients | `throw new Error()` | N/A (query) | `?? []` | Good |
| useClient | `throw new Error()` | N/A (query) | `?? []` contacts | Good |
| useAnalytics hooks | `throw new Error()` | N/A (query) | `Number(x ?? 0)` | Good |
| useReports | `throw error` | `toast.error()` | `?? []` | Good |
| useGenerateReport | `throw error` | `toast.error()` | `?? 0` defaults | Good |

Overall assessment: Hooks have consistent error handling with proper error propagation and toast notifications. The `?? 0` and `?? []` fallback patterns are well-used.

#### API Routes Error Handling

| Route | Auth check | Input validation | Error response | Stack trace leak | Rating |
|-------|-----------|-----------------|----------------|-----------------|--------|
| `/api/invoices/export-csv` | Yes | invoiceType, date format validation | Clean JSON errors | No | Excellent |
| `/api/invoices/[id]/send-email` | Yes | Checks required fields, invoice existence | Clean errors | No | Good |
| `/api/email/send` | Yes | Type, recipients, JSON validation | Clean errors | No | Good |

**Overall API rating**: Good. All routes check authentication, validate input, return proper HTTP status codes, and do not leak stack traces.

#### Form Validation Assessment

| Form Location | Validation Method | Rating | Notes |
|--------------|------------------|--------|-------|
| Client onboard (`/onboard`) | Manual `validate()` function | WEAK | Custom validation without Zod. Checks empty fields but no format validation for email, phone, etc. |
| Client create (`/clients`) | Zod + react-hook-form | GOOD | Only form using Zod. |
| Invoice create (modal) | Manual checks | WEAK | No Zod schema. Client-side only. |
| Invoice edit | Manual state | WEAK | No formal validation. |
| Record payment | Manual form state | WEAK | Has `min="0.01"` on HTML input but no form-level validation. |
| Targets | Manual `isNaN` check | MINIMAL | Only checks amount > 0. |
| Contracts | Manual state | WEAK | No formal validation. |
| Settings | Manual state | WEAK | No formal validation. |
| TDS upload | Manual state | WEAK | No formal validation. |

**ISSUE [HIGH] #P13-04**: Only 1 out of ~10 forms uses Zod validation (the client create form). All other forms rely on HTML `required` attributes and manual `if` checks. The project's CLAUDE.md explicitly mandates "React Hook Form + Zod for all forms", but this is not followed. This leads to:
- No consistent validation error display
- Missing server-side validation for many fields
- Potential for invalid data reaching the database

### Data Edge Cases (Code Review)

| Edge Case | Code Location | Handling | Risk |
|-----------|--------------|----------|------|
| 0 invoices in analytics | `use-analytics.ts` - `useDashboardKPIs` | `.reduce()` returns 0 for empty array | SAFE |
| Division by zero in profit margin | `report-pdf.tsx` - `getProfitMargin` | Explicitly checks `if (revenue === 0) return "0%"` | SAFE |
| Single data point in charts | Analytics pages | Recharts renders single point. EmptyState shown when 0 items. | OK |
| All invoices are Pro Forma | Revenue calculation in `use-reports.ts` | Revenue is calculated from `invoice_payments`, not invoices. Pro forma invoices without payments correctly show $0 revenue. | SAFE |
| Client has payments but invoice deleted | `use-analytics.ts` - `usePaymentsList` | Payments reference `invoice_id`. If invoice is deleted, the join returns null for `invoice_number` and `client_id`. The code uses `?? null` and `?? "Unknown"` fallbacks. | SAFE but orphaned data |
| Currency field is null | `use-invoices.ts` | Falls back to `"INR"` via `?? "INR"` | SAFE |
| Date fields are null | `formatDate()` in `format.ts` | Will crash - `new Date(null)` returns epoch but `format()` from date-fns may throw on invalid input. | RISK |
| Line items array is empty | Invoice detail page | Renders empty `<tbody>`. Totals still show from invoice record. PDF renders empty table. | COSMETIC |
| Negative balance_due | `invoice/[id]/page.tsx` | `Math.max(0, total - received)` prevents negative display | SAFE |

**ISSUE [CRITICAL] #P13-05**: `formatDate()` in `src/lib/utils/format.ts` does NOT handle null/undefined input:
```typescript
export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy");
}
```
If `date` is null/undefined (which can happen for `due_date`, `paid_at`, `sent_at`, etc.), this will throw. The function should guard against null. The contract-pdf.tsx has its own `formatDate()` that properly returns "N/A" for null - this pattern should be adopted globally.

**ISSUE [CRITICAL] #P13-06**: `useInvoice()` query for invalid UUID format (e.g., "nonexistent-id") returns an error from Supabase, but the invoice detail page code does not distinguish between "loading" and "error/not-found" states. The condition `if (isLoading || !invoice)` means:
- While loading: shows spinner (correct)
- After loading fails: `isLoading` is false but `invoice` is null/undefined, so it STILL shows spinner (bug)
- User sees infinite spinner with no way to know the invoice doesn't exist

### Missing Error Handling

1. **No route-level error.tsx files** - Any uncaught error in a page component replaces the entire dashboard with a generic error screen instead of just the content area.

2. **No error recovery for PDF generation** - If PDF generation fails (broken image, memory issue), the error is only logged to console. User sees nothing happen when clicking "Preview PDF" or "Download".

3. **No timeout handling on Supabase queries** - If Supabase is slow or unresponsive, queries hang indefinitely. No timeout or retry logic.

4. **No offline detection** - App does not detect network connectivity issues. All errors are generic "Failed to fetch" with no guidance to the user.

5. **No form dirty state protection** - Navigating away from a form with unsaved changes does not prompt the user. Data loss is possible.

6. **No max retries on mutations** - TanStack Query defaults apply, but no explicit retry configuration for critical operations like payment recording.

7. **No concurrent edit protection** - If two users edit the same invoice/client simultaneously, last-write-wins with no conflict detection.

---

## Recommendations

### Critical (Fix Immediately)
1. **Fix React hydration errors** (#P13-01) - Audit all components for SSR/CSR mismatches. Wrap locale-dependent formatting in `useEffect` or use consistent formatting. This affects every page.
2. **Fix infinite spinner on invalid invoice/client IDs** (#P13-03, #P13-06) - Check `isError` state from TanStack Query and show "Not Found" message instead of infinite spinner.
3. **Add null safety to `formatDate()`** (#P13-05) - Guard against null/undefined input in the shared format utility.
4. **Fix GST tax breakdown** (#P10-01) - Split GST into CGST+SGST vs IGST based on client state vs company state (Karnataka).

### High Priority
5. **Fix Indian numbering for non-INR currencies** (#P10-04) - Use `en-US` locale for USD/AED/GBP/EUR formatting in invoice PDFs.
6. **Add route-level error boundaries** (#P13-02) - Create error.tsx in each dashboard route directory.
7. **Fix image paths in invoice PDF** (#P10-09) - Use absolute URLs for logo and stamp images to ensure they work in server-side rendering.
8. **Implement Zod validation on all forms** (#P13-04) - Priority: invoice create/edit, payment recording, contract create.
9. **Add PDF generation error feedback** (#P10-17) - Show toast.error when PDF generation fails instead of silently logging.

### Medium Priority
10. Add complete GBP bank details (#P10-02).
11. Move bank details to database/settings (#P10-03).
12. Add EUR currency support (#P10-05).
13. Add pagination/page breaks for long invoice line items (#P10-06).
14. Add NaN safety to invoice PDF `formatCurrency()` (#P10-07).
15. Add contract pricing section (#P10-12).
16. Add chart visualizations to report PDF (#P10-13).
17. Add maxlength constraints on text input fields.
18. Add negative number validation on amount fields.
19. Add client address to contract PDF party details (#P10-11).

### Low Priority
20. Add null safety to invoice PDF `formatDate()` (#P10-08).
21. Add Terms & Conditions to invoice PDF (#P10-10).
22. Fix report PDF title for quarterly/annual types (#P10-14).
23. Add month-over-month comparison to report PDF (#P10-15).
24. Register Unicode font for non-Latin character support (#P10-19).
25. Standardize PDF generation return types (Blob vs Uint8Array) (#P10-16).
26. Add form dirty state protection (unsaved changes warning).
27. Use dynamic imports for contract/report PDF to reduce bundle size (#P10-18).
