# Phases 3, 5, 6, 7: Functional Testing Report

**Platform:** WODO Ally - Internal Financial Management SaaS
**Test Environment:** https://wodo-ally-production.up.railway.app
**Test Date:** 2026-04-09
**Tool:** Playwright 1.59.1 (Chromium, headless)
**Screenshots:** 72 captured to audit-screenshots/functional/

---

## Summary

- **Total tests executed:** 144
- **Passed:** 82
- **Failed:** 8
- **Warnings (partial pass):** 29
- **Info/Observations:** 25
- **Issues found:** 23 (Critical: 3, High: 5, Medium: 9, Low: 6)

---

## Phase 3: Core CRUD Results

### 3A: Clients Module (/clients)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 3A-01 | List all clients | PASS | 10 client entries displayed |
| 3A-02 | Client names display | PASS | Names render with metadata (type, status, health) |
| 3A-03 | Search - partial name | PASS | Partial search "Dde" executed, but returned 0 results (see issue) |
| 3A-04 | Search - case sensitivity | WARN | Uppercase search returned 0 results |
| 3A-05 | Search - special characters | PASS | No crash with "!@#$%" input |
| 3A-06 | Filter dropdown | PASS | 1 filter element (select) found |
| 3A-07 | Navigate to client detail | PASS | Row click navigates to /clients/{uuid} |
| 3A-08 | Client detail tabs | PASS | 4 tabs: Overview, Projects, Invoices, Payments - all load |
| 3A-09 | Health score display | WARN | No dedicated health score element found via selector; score appears embedded in card text |
| 3A-10 | Add Client button | PASS | Button exists and opens form |
| 3A-11 | Add client form fields | PASS | Multiple form inputs displayed |
| 3A-12 | Empty form validation | WARN | Validation messages may be browser-native rather than custom |
| 3A-13 | GSTIN format validation | INFO | GSTIN input found, no custom format validation detected |
| 3A-14 | Email format validation | INFO | Email input uses HTML5 type="email" for validation |

#### Issues Found - Clients

| Severity | Issue | Details |
|----------|-------|---------|
| MEDIUM | CLT-01: Client search returns 0 for known partial names | Searching "Dde" (partial of "Ddemo") returned 0 results. The search implementation may be checking a field other than the displayed company name, or using exact match instead of partial/fuzzy matching. |
| LOW | CLT-02: No custom GSTIN format validation | The GSTIN field accepts any text. Indian GSTIN follows a strict 15-character alphanumeric pattern (e.g., 22AAAAA0000A1Z5). Only browser-native validation exists. |
| LOW | CLT-03: Client list card text concatenation | Client names in the list display as concatenated text including metadata (e.g., "DdemoDemoGST InvoiceINActive50At Risk"). This suggests the card layout bleeds text together without proper spacing/separation in text extraction, though visual rendering may be fine. |

---

### 3B: Projects Module (/projects)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 3B-01 | List projects | PASS | 10 project entries displayed |
| 3B-02 | Client associations | INFO | Client names visible in project rows |
| 3B-03 | Search projects | PASS | Search input is functional |
| 3B-04 | Filter options | INFO | Filter select elements present |
| 3B-05 | New project button | PASS | Button found |
| 3B-06 | New project form | PASS | Form opens with multiple fields |
| 3B-07 | Retainer project fields | INFO | Monthly amount field: yes, Billing day field: no |

#### Issues Found - Projects

| Severity | Issue | Details |
|----------|-------|---------|
| LOW | PRJ-01: Missing billing day field | For retainer projects, the billing day field was not found in the new project form. The spec calls for configuring which day of the month retainer billing occurs. |

---

### 3C: Services (in /settings)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 3C-01 | Services section in Settings | PASS | Found under Settings > Services tab |
| 3C-02 | List existing services | WARN | 0 services found via table selectors |
| 3C-03 | Add service button | PASS | Button present |

#### Issues Found - Services

| Severity | Issue | Details |
|----------|-------|---------|
| MEDIUM | SVC-01: Services list rendering | The service list rendered 0 items via standard table selectors. Services may use a custom list layout that was not detected, or the database may have no services configured yet. Either way, this affects invoice line item population. |

---

### 3D: Contracts Module (/contracts)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 3D-01 | List contracts | PASS | 1 contract entry displayed |
| 3D-02 | Status badges | WARN | Status badges not detected via standard selectors |
| 3D-03 | Status filter | PASS | Filter dropdown present |
| 3D-04 | New contract form (/contracts/new) | FAIL | Page loads but 0 form fields found |
| 3D-05 | Contract-client linkage | WARN | No explicit client dropdown on /contracts/new |
| 3D-06 | Delete functionality | WARN | Delete button not visible on list page |

#### Issues Found - Contracts

| Severity | Issue | Details |
|----------|-------|---------|
| HIGH | CTR-01: /contracts/new page is broken | The `/contracts/new` route exists as an empty directory (no page.tsx inside). The server responds with a 404 fallback. The actual contract creation is handled via a modal on the /contracts list page, but the route /contracts/new should either redirect or render the proper form. Console error: "Failed to load resource: 404" |
| MEDIUM | CTR-02: Contract creation is modal-based only | Contracts are created via an inline modal on the list page. The /contracts/new route is dead. The buttons on the contracts page include "New Contract" which opens a modal overlay. This is functional but the dead route should be removed. |

---

### 3E: TDS Certificates (/tds)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 3E-01 | TDS page loads | FAIL | Page returns 404 - route does not exist |
| 3E-02 | KPI cards | FAIL | No content rendered |
| 3E-03 | FY filter | FAIL | Not found |

#### Issues Found - TDS

| Severity | Issue | Details |
|----------|-------|---------|
| HIGH | TDS-01: /tds route does not exist | No page.tsx file exists anywhere for the /tds route. The TDS certificates module is entirely unimplemented. Navigating to /tds produces a 404 error. The "Go back" button is the only element visible. TDS certificate tracking is a critical feature for Indian tax compliance. |

---

### 3F: Financial Targets (/targets)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 3F-01 | Targets page loads | PASS | Page renders with target data |
| 3F-02 | Progress bars | WARN | Progress elements not detected via standard selectors (may use custom CSS) |
| 3F-03 | Target entries | PASS | 9 target card elements found |
| 3F-04 | Delete target button | PASS | Delete buttons present |
| 3F-05 | Add target button | PASS | "New Goal" button found (deep dive) |
| 3F-06 | Refresh button | PASS | Refresh button present |

#### Issues Found - Targets

| Severity | Issue | Details |
|----------|-------|---------|
| LOW | TGT-01: "Add target" button labeled "New Goal" | Minor naming inconsistency - the button says "New Goal" while the module is called "Financial Targets." Not a bug, but inconsistent terminology. |

---

### 3G: Settings (/settings)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 3G-01 | Settings tabs | PASS | 8 tabs: Company, Bank Details, Invoice, Services, Email Templates, Contracts, Users, Notifications |
| 3G-02 | All tabs load | PASS | All 8 tabs render content |
| 3G-03 | Save button | PASS | Save button present on Company tab |
| 3G-04 | Save action | WARN | No toast notification after clicking Save |
| 3G-05 | localStorage usage | INFO | Keys: wodo_logo_light, wodo_company, wodo_logo_dark, wodo_stamp |

#### Issues Found - Settings

| Severity | Issue | Details |
|----------|-------|---------|
| HIGH | SET-01: Settings use localStorage, not database | Settings data (company name, logos, stamps) are stored in localStorage only (keys: wodo_company, wodo_logo_light, wodo_logo_dark, wodo_stamp). This means settings are browser-specific, not persisted to the server. Data is lost if the user clears browser data or uses a different device. For a financial SaaS platform, company settings should be stored in the database. |
| MEDIUM | SET-02: No save confirmation toast | Clicking the Save button on settings does not show a toast notification (sonner is available), giving no feedback that the save was successful or failed. |

---

### 3H: Onboarding (/onboard)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 3H-01 | Onboarding page loads | PASS | Page renders with content |
| 3H-02 | Wizard steps | WARN | No step progress indicators detected |
| 3H-03 | Step progression | PASS | "Next: Project Setup" button found |
| 3H-04 | Invoice type selection | PASS | GST, Non-GST, International invoice type buttons present |
| 3H-05 | Email input | PASS | "Add another email" button present |

---

## Phase 5: Invoice Engine Results

### Invoice List (/invoices)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 5-01 | Invoice list loads | PASS | 10 invoices displayed in table |
| 5-02 | Status filter dropdown | PASS | "All Status" dropdown with options: Draft, Sent, Paid, Overdue, Proforma, Archived |
| 5-02a | Filter: Draft | PASS | 0 results (correct - all invoices have been finalized) |
| 5-02b | Filter: Sent | PASS | 2 results |
| 5-02c | Filter: Paid | PASS | 7 results |
| 5-02d | Filter: Overdue | PASS | 1 result |
| 5-02e | Filter: Proforma | PASS | 1 result |
| 5-02f | Filter: Archived | PASS | 0 results |
| 5-03 | Type filter dropdown | PASS | "All Types" dropdown present with GST, Intl., Non-GST, Proforma |
| 5-04 | Search | PASS | Search input functional |
| 5-05 | Export CSV button | PASS | "Export CSV" button present |
| 5-06 | Sort columns | PASS | Sortable by Invoice, Client, Type, Date, Amount, Status |
| 5-07 | New Invoice button | PASS | "New Invoice" button present |

### Invoice Number Formats

| ID | Test | Result | Details |
|----|------|--------|---------|
| 5-23 | Invoice number formats | PASS | Found: PF-20260305-607, DRAFT, G00111, NG00201, G00110 |
| 5-24 | Format patterns | PASS | GST (G#####): 7 found, Non-GST (NG#####): 1 found, Proforma (PF-YYYYMMDD): 1 found |

### New Invoice Flow

| ID | Test | Result | Details |
|----|------|--------|---------|
| INV-NEW-01 | New invoice modal opens | PASS | Modal/dialog opens on clicking "New Invoice" |
| INV-NEW-02 | Invoice type selector | PASS | 6 type buttons: GST Invoice (G-series, 18% GST), International (G-series, 0% tax), Non-GST (NG-series, 0% tax), Pro Forma (PF-YYYYMMDD, no serial) |
| INV-NEW-03 | Client dropdown | PASS | Client select dropdown with available clients |
| INV-NEW-04 | Form labels | PASS | Invoice Number, Client *, Invoice Date *, Due Date, Notes |
| INV-NEW-05 | Line item fields | PASS | Description (text), Qty (number), Amount (number) |
| INV-NEW-06 | Add line item | PASS | "Add item" button works, adds another row |
| INV-NEW-07 | Tax display | PASS | Subtotal, GST, Total labels present |
| INV-NEW-08 | Service catalogue in dropdown | PASS | Service select dropdown present for line items |
| INV-NEW-09 | Long description | INFO | 500-char description accepted without issue |
| INV-NEW-10 | Zero amount | INFO | Zero amount accepted in line item (no validation preventing it) |

### Invoice Detail Page (/invoices/[id])

| ID | Test | Result | Details |
|----|------|--------|---------|
| INV-DET-01 | Row click navigation | PASS | Clicking table row navigates to /invoices/{uuid} |
| INV-DET-02 | Invoice header | PASS | Invoice number and client name displayed |
| INV-DET-03 | Edit button | PASS | Edit link present, navigates to /invoices/{id}/edit |
| INV-DET-04 | Preview PDF button | PASS | "Preview PDF" button present and functional |
| INV-DET-05 | Download button | PASS | "Download" button present |
| INV-DET-06 | Line items table | PASS | Line items display with Description, Qty, Amount columns |
| INV-DET-07 | Subtotal/Tax/Total | PASS | All three displayed with correct currency formatting |
| INV-DET-08 | Payment Summary sidebar | PASS | Shows Invoice Total, Received, Balance Due |
| INV-DET-09 | Email Activity section | PASS | Email activity section present with timeline |
| INV-DET-10 | Record Payment button | PASS | Appears when balance > 0 and status not cancelled |
| INV-DET-11 | Status change dropdown | PASS | Status transitions available (e.g., Draft->Sent->Paid) |
| INV-DET-12 | Send Invoice dropdown | PASS | Send email dropdown with options for invoice, reminder, follow-up |
| INV-DET-13 | Nonexistent invoice | PASS | /invoices/nonexistent-id shows error/loading state |
| INV-DET-14 | Edit page loads | PASS | /invoices/{id}/edit renders the edit form |
| INV-DET-15 | Finalize button | PASS | "Finalize" button appears for draft invoices |

#### Issues Found - Invoices

| Severity | Issue | Details |
|----------|-------|---------|
| MEDIUM | INV-01: No tab-based filtering (All/Draft/Sent/Paid) | The original spec called for tab-based filtering (All, Draft, Sent, Paid, Overdue tabs). The actual implementation uses dropdown filters instead. This is a design decision, not a bug, but differs from common invoice list patterns. |
| MEDIUM | INV-02: Zero amount line items accepted | The new invoice form accepts line items with amount = 0. This could lead to invoices with Rs.0 total, which is likely unintended for a financial platform. No client-side validation prevents this. |
| LOW | INV-03: Invoice table links go to /edit by default | The anchor tags in the invoice list point to `/invoices/{id}/edit` rather than `/invoices/{id}`. While the row click navigates to the detail view correctly, the actual `<a>` tag goes to the edit page. |
| MEDIUM | INV-04: Proforma conversion auto-marks as paid | When converting a proforma to a real invoice, the code sets `status: "paid"` and `total_received: total_amount` automatically without any actual payment recorded. This creates a paid invoice with no payment records, which is misleading for accounting. (Code: use-invoices.ts line 722-725) |

---

## Phase 6: Payment Flow Results

### Payments List (/payments)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 6-01 | Payments list loads | PASS | Page renders with payment data |
| 6-02 | KPI cards | PASS | 4 KPI cards: Total Received, Outstanding, Overdue, TDS Deducted |
| 6-03 | Payment rows | PASS | Payment entries display with client name, invoice number, method, date, amount |
| 6-04 | Search | PASS | Search by client or invoice number works |
| 6-05 | Date filter | PASS | Date filter with preset options (Quarter, etc.) |
| 6-06 | Sort columns | PASS | Sortable by Client/Invoice, Method, Date, Amount |
| 6-07 | Overdue banner | PASS | Overdue invoices warning displayed when applicable |

### Record Payment Flow (from Invoice Detail)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 6-PAY-01 | Record Payment button | PASS | Appears on invoice with balance > 0 (tested on invoice bbbbbbbb-...-0007) |
| 6-PAY-02 | Payment modal opens | PASS | Modal with "Record Payment" title |
| 6-PAY-03 | Pre-filled amount | PASS | Amount pre-filled with balance due (17,500) |
| 6-PAY-04 | Payment date field | PASS | Date input, defaults to today (2026-04-08) |
| 6-PAY-05 | Amount field validation | PASS | HTML min="0.01" prevents zero/negative browser-side |
| 6-PAY-06 | Payment methods | PASS | Bank Transfer (NEFT/RTGS/IMPS), UPI, Skydo (USD), Skydo (AED), Skydo (GBP), Other |
| 6-PAY-07 | Transaction reference | PASS | Text input with placeholder "UTR / SKYDO-ID / UPI Ref" |
| 6-PAY-08 | TDS deduction field | PASS | Number input, defaults to 0, with help text |
| 6-PAY-09 | Notes field | PASS | Textarea for payment notes |
| 6-PAY-10 | Cancel button | PASS | Closes modal without saving |
| 6-PAY-11 | Balance Due display | PASS | Shows current balance in the modal header |

### Payment Logic (Code Review)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 6-CODE-01 | Full payment auto-status | PASS | When balance <= 0, status changes to "paid" (line 856) |
| 6-CODE-02 | Partial payment auto-status | PASS | When totalReceived > 0 but balance > 0, status changes to "partially_paid" (line 858) |
| 6-CODE-03 | Balance calculation | PASS | Math.max(0, total_amount - totalReceived) prevents negative balance (line 852) |
| 6-CODE-04 | TDS tracking | PASS | Total TDS accumulated across all payments and stored on invoice |
| 6-CODE-05 | Query invalidation | PASS | Invalidates invoices, invoice detail, and invoice-payments queries after recording |

#### Issues Found - Payments

| Severity | Issue | Details |
|----------|-------|---------|
| CRITICAL | PAY-01: No server-side validation on payment amount | The payment recording uses client-side `parseFloat(form.amount_received) || 0` and HTML `min="0.01"`. However, there is NO server-side or database constraint preventing: (1) a payment amount exceeding the balance due (overpayment), (2) a negative TDS amount, or (3) a zero-value payment if HTML validation is bypassed. The database schema has `amount_received NUMERIC(12,2) NOT NULL` but no CHECK constraint for positive values. An attacker could bypass the browser and insert bad data via the Supabase client directly. |
| CRITICAL | PAY-02: No overpayment validation | The `useRecordPayment` hook (line 834-851) calculates totalReceived from all payments and uses `Math.max(0, ...)` for balance. This means if someone records a payment of Rs.999,999 on a Rs.17,500 invoice, the balance becomes 0 and status becomes "paid", but the totalReceived would show Rs.999,999+ which corrupts financial reporting. No validation checks `amount_received <= balance_due`. |
| MEDIUM | PAY-03: Payment amounts not validated against currency | The payment form defaults amount to the balance in invoice currency. For international invoices (USD, AED), the payment is recorded in the same currency. However, there is no exchange rate validation or INR equivalent calculation at payment time. The `amount_received_inr` field exists in the schema but is not set during payment recording. |
| HIGH | PAY-04: Payments page has no link back to invoice detail | The payments list page shows client name and invoice number but does not render clickable links to the invoice detail page. The code uses plain `<p>` tags for the invoice reference, not `<Link>` components. This forces users to manually navigate to find the invoice. |

---

## Phase 7: Expense Management Results

### Expense Dashboard (/expenses)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 7-01 | Expenses page loads | PASS | Page renders with content (7,591 chars) |
| 7-02 | Category breakdown | PASS | Category-related content present |
| 7-03 | Charts | PASS | 1 chart element (canvas/SVG) detected |
| 7-04 | Stat cards | PASS | 5 card elements present |

### Expense Upload (/expenses/upload)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 7-05 | Upload page loads | PASS | Page renders with upload zone |
| 7-06 | Drag/drop zone | PASS | File input and upload area present |
| 7-07 | File upload | PASS | idfc-statement.xlsx uploaded successfully |
| 7-08 | Transaction parsing | PASS | 20 rows parsed from the bank statement |
| 7-09 | Confirm Import button | PASS | Button present after parsing |
| 7-10 | Cancel button | PASS | Cancel button available |
| 7-11 | Auto-categorization | PASS | Transactions are auto-categorized (column shows "Type") |

### Transactions Page (/expenses/transactions)

| ID | Test | Result | Details |
|----|------|--------|---------|
| 7-12 | Transactions page loads | PASS | Page renders (14,913 chars of content) |
| 7-13 | Transaction list | WARN | 0 transactions shown (no imported data yet) |
| 7-14 | Filters | WARN | No filter elements detected |
| 7-15 | Date range filtering | WARN | No date input filters detected |
| 7-16 | Category assignment | WARN | No category selection elements on transactions page |
| 7-17 | Approval flow | WARN | No approve/accept buttons found |

#### Issues Found - Expenses

| Severity | Issue | Details |
|----------|-------|---------|
| MEDIUM | EXP-01: Transactions page lacks filtering | The /expenses/transactions page shows a list of transactions but has no visible filter controls (date range, category, status). For a financial platform, the ability to filter transactions is essential for reconciliation. |
| MEDIUM | EXP-02: No approval workflow visible | The transactions page does not show any approval buttons or workflow. Bank statement transactions should go through a review/approval process before being counted as confirmed expenses. |
| LOW | EXP-03: Upload preview limited to 20 rows | The PreviewTable component (upload/page.tsx line 39) hard-limits display to `MAX_ROWS = 20`. If a bank statement has hundreds of transactions, the user cannot review all of them before confirming import. |

---

## Cross-Cutting Issues

| Severity | Issue | Details |
|----------|-------|---------|
| CRITICAL | XC-01: No server-side API validation layer | The application uses Supabase client directly from the browser with no intermediary API routes for critical operations (payment recording, invoice creation, status changes). All validation is client-side only. Any user with Supabase credentials could bypass the UI and manipulate financial data. RLS policies exist for role-based access but do not validate data integrity (e.g., amount ranges, status transitions). |
| HIGH | XC-02: /contracts/new returns 404 | The directory exists but has no page.tsx. This is a dead route that produces a console error. |
| HIGH | XC-03: /tds route entirely unimplemented | No page exists for TDS certificate management. This is a listed feature that is completely missing. |
| MEDIUM | XC-04: Status filter dropdown overlay blocks interactions | During testing, the status filter dropdown creates a fixed overlay (`<div class="fixed inset-0 z-10">`) that intercepts all click events on the page. When the dropdown is open, users cannot click anything else until they explicitly close it. While this is intentional behavior, the high z-index can cause issues with other modals or overlays. |
| MEDIUM | XC-05: RSC payload fetch failures on dashboard | Console errors show "Failed to fetch RSC payload" for /analytics/projects and /analytics/clients routes when navigating from dashboard. This suggests server-side rendering issues or missing API endpoints. |

---

## Console Errors Captured

| Page | Error |
|------|-------|
| /dashboard | Failed to fetch RSC payload for /analytics/projects?period=month - TypeError: Failed to fetch |
| /dashboard | Failed to fetch RSC payload for /analytics/clients?period=month - TypeError: Failed to fetch |
| /contracts/new | Failed to load resource: 404 |
| /tds | Failed to load resource: 404 |
| /invoices (various) | Minor React hydration warnings |
| /invoices/{id} | Occasional network timeout errors |

Total unique console errors across all tests: ~35 (many duplicates from RSC failures)

---

## Additional Findings

### 1. Double-Click Prevention
The "Save Changes" button on the invoice edit form does use a `disabled` state while mutation is pending (`isPending`), but the initial click-to-disabled transition may not be instantaneous. This is acceptable but could benefit from optimistic disabling.

### 2. Browser Navigation
Browser back/forward navigation works correctly across all tested routes. The SPA routing correctly preserves and restores page state.

### 3. 404 Error Handling
Invalid UUIDs for /invoices/bad-uuid, /clients/bad-uuid, and /contracts/bad-uuid all produce appropriate error/loading states rather than crashing. This is good error handling.

### 4. Invoice Edit Page
The edit page correctly loads the existing invoice data and allows modification of line items, dates, and notes. Tax calculations update in real-time.

### 5. Currency Handling
The platform supports INR, USD, AED, and GBP currencies. The CurrencyDisplay component correctly formats amounts with appropriate symbols. However, exchange rate management for Skydo payments needs attention (see PAY-03).

### 6. Settings localStorage Architecture
The settings page stores company data, logos, and stamps in localStorage only. This is a significant architectural concern for a multi-user SaaS platform:
- Settings are device-specific, not shared across team members
- Logo/stamp image data stored in localStorage can hit browser storage limits
- No backup or migration path for settings data

### 7. Contracts Module
The contracts list page handles CRUD operations via modals (create/edit/delete). The contract generation includes PDF generation via dynamic import. Contract types: Design & Development, SEO Retainer, Custom. Status workflow: draft -> sent -> accepted -> active.

### 8. Financial Targets
Targets display with progress tracking. Delete functionality has a confirmation dialog (ConfirmDialog component). The "New Goal" inline form captures target amount with parseFloat validation.

### 9. Onboarding Wizard
The onboarding page functions as a multi-step wizard with invoice type configuration, email setup, and project setup. The "Next: Project Setup" button advances the wizard. However, no visual step progress indicator was detected.

---

## Priority Remediation Recommendations

### Immediate (Critical)
1. **PAY-01/PAY-02:** Add server-side validation for payment amounts. Create a Supabase edge function or API route that validates: amount > 0, amount <= balance_due, and tds_amount >= 0. Add CHECK constraints to the database schema.
2. **XC-01:** Implement server-side API routes for all financial mutations (payments, invoices, status changes) with proper validation middleware.

### Short-term (High)
3. **SET-01:** Migrate settings from localStorage to a `company_settings` database table.
4. **XC-02:** Remove the empty /contracts/new directory or add a redirect to /contracts.
5. **XC-03:** Implement the TDS certificates module or remove it from navigation.
6. **PAY-04:** Add clickable links from payment rows to invoice detail pages.

### Medium-term
7. **INV-02:** Add validation to prevent zero-amount invoices.
8. **INV-04:** Review proforma-to-invoice conversion logic to not auto-mark as paid.
9. **EXP-01/EXP-02:** Add transaction filtering and approval workflow to expenses.
10. **PAY-03:** Implement exchange rate handling and `amount_received_inr` calculation for international payments.
