# Phases 4, 8, 9: Financial Logic, Cross-Module Flow & Analytics Audit

## Summary
- Files analyzed: 28
- Calculations verified: 42
- Issues found: 27 (Critical: 7, High: 8, Medium: 7, Low: 5)
- Financial accuracy score: 4/10

---

## Phase 4: Financial Logic

### 4.1 Invoice Math

**Calculation path traced (new-invoice-modal.tsx, lines 85-87):**

```
subtotal = SUM(parseFloat(item.amount) * item.quantity)   // line 85
tax      = subtotal * (taxRate / 100)                      // line 86
total    = subtotal + tax                                  // line 87
```

The same calculation is replicated in the edit page (edit/page.tsx, lines 117-120).

**Tax rate logic:**
- GST invoices: 18% - CORRECT
- International: 0% - CORRECT
- Non-GST: 0% - CORRECT
- Pro Forma: Applies the underlying client type's tax rate - CORRECT

**Retainer auto-draft (use-invoices.ts, lines 407-411):**
```
taxRate    = invoiceType === "gst" ? 18 : 0
subtotal   = project.retainer_amount ?? 0
taxAmount  = (subtotal * taxRate) / 100
totalAmount = subtotal + taxAmount
```
This path is correct.

**CRITICAL ISSUE 4.1-A: No rounding on any financial calculations**
- File: `src/components/shared/new-invoice-modal.tsx:85-87`
- File: `src/app/(dashboard)/invoices/[id]/edit/page.tsx:117-120`
- File: `src/lib/hooks/use-invoices.ts:407-411`
- Severity: CRITICAL
- All subtotal, tax, and total calculations use raw floating-point arithmetic with no `Math.round()`, `toFixed()`, or any rounding strategy. The database schema uses `NUMERIC(12,2)` which will truncate, but the JS values sent to the DB are unrounded floats. Example: an amount of 33333.33 * 3 * 0.18 = 17999.9982 would be stored as 17999.99 (truncated, not rounded to 18000.00). This creates cent-level discrepancies that accumulate across line items.

**CRITICAL ISSUE 4.1-B: Line item amount stored as single "amount" field, not rate**
- File: `src/components/shared/new-invoice-modal.tsx:107`
- The line item model has `amount` and `quantity`, and the PDF renders `item.amount * item.quantity` (invoice-pdf.tsx:582). However, the database schema stores `amount NUMERIC(12,2)` and `quantity INTEGER` separately. The subtotal calculation in the modal sums `amount * quantity` for each line item, but the `amount` stored in the DB via `finalLineItems` (line 107) stores the per-unit amount. This is internally consistent but the naming is confusing - "amount" typically implies the total, not the unit rate. This is not a bug but a documentation risk.

**ISSUE 4.1-C: Edit page does not update line items in the database**
- File: `src/app/(dashboard)/invoices/[id]/edit/page.tsx:150-172`
- Severity: HIGH
- The edit page recalculates subtotal/tax/total from modified line items and saves them to the invoice row, but it does NOT update the `invoice_line_items` table. The `updateInvoice.mutate()` call (line 150) only calls `supabase.from("invoices").update(data)`. This means editing line items changes the invoice totals but the PDF (which reads from `invoice_line_items`) will still show the OLD line items. The invoice total and the sum of line items in the PDF will diverge.

**ISSUE 4.1-D: GST split (CGST/SGST vs IGST) not implemented**
- Severity: MEDIUM
- Indian GST law requires: intra-state = 9% CGST + 9% SGST; inter-state = 18% IGST. The system applies a flat 18% without distinguishing. The invoice PDF (invoice-pdf.tsx:597-605) shows a single "GST @ 18%" line. For formal tax compliance, this should show the CGST/SGST or IGST split based on client state vs. company state (Karnataka).

### 4.2 Payment Balance Calculation

**Payment recording path (use-invoices.ts, lines 811-891):**

1. Insert payment record to `invoice_payments`
2. Re-query ALL payments for this invoice
3. `totalReceived = SUM(payment.amount_received)`
4. `totalTds = SUM(payment.tds_amount)`
5. `balanceDue = MAX(0, invoice.total_amount - totalReceived)`
6. Status: if `balanceDue <= 0` then "paid"; else if `totalReceived > 0` then "partially_paid"

**CRITICAL ISSUE 4.2-A: TDS not accounted for in balance_due calculation**
- File: `src/lib/hooks/use-invoices.ts:852`
- Severity: CRITICAL
- `balanceDue = Math.max(0, (invoice.total_amount ?? 0) - totalReceived)`
- TDS is tracked (`totalTds` is computed and stored in `total_tds_deducted`) but is NOT subtracted from the balance_due. In Indian business practice, when a client deducts 10% TDS, the amount_received is 90% of the invoice, and TDS should satisfy the remaining 10%. The current formula means an invoice with TDS deduction will NEVER show as fully paid unless the client overpays the received amount to cover the TDS gap. This will leave invoices perpetually in "partially_paid" status.
- Expected formula: `balanceDue = total_amount - totalReceived - totalTds`

**CRITICAL ISSUE 4.2-B: Floating-point accumulation in payment totals**
- File: `src/lib/hooks/use-invoices.ts:834-841`
- Severity: CRITICAL
- The `.reduce()` accumulation of `amount_received` values uses raw floating-point addition. For many partial payments, this will accumulate rounding errors. Example: three payments of $33.33 each sum to 99.99000000000001 in JS, not 99.99.

**ISSUE 4.2-C: No overdue auto-detection mechanism**
- Severity: HIGH
- There is no cron job, database trigger, or on-access check to transition invoices from "sent" to "overdue" when `due_date` passes. The `useCollectionsInvoices` hook (use-invoices.ts:616-639) calculates overdue status client-side for display, but does NOT update the DB status. This means: (a) the `overdue_invoices` KPI count on the dashboard only counts invoices manually set to "overdue", (b) investor reports will undercount overdue amounts, (c) the invoice list filter for "overdue" will miss invoices that are past due but still have status "sent".

**ISSUE 4.2-D: Skydo fees not deducted from balance calculation**
- File: `src/lib/hooks/use-invoices.ts:852`
- Severity: MEDIUM
- Payment records store `skydo_fx_margin`, `skydo_processing_fee`, `bank_charges`, and `other_deductions`, but these are not factored into the balance_due calculation. These are company-side costs (not client-facing), so this may be intentional. However, it means the system does not track the true net amount received per invoice (gross - fees). The `amount_received` field appears to already be the net amount after Skydo deductions, so this is acceptable IF the data entry convention is documented.

### 4.3 Revenue Recognition

**Dashboard revenue (use-analytics.ts:392-414):**
- Revenue = SUM(invoice_payments.amount_received_inr ?? amount_received) for the period
- This is payment-date-based (cash-basis accounting) - CORRECT for a small business

**SQL view revenue (004_analytics.sql:12-16):**
- `SUM(COALESCE(ip.amount_received_inr, ip.amount_received))` from invoice_payments
- Consistent with dashboard - CORRECT

**ISSUE 4.3-A: Pro forma converted invoices counted with original invoice_date**
- File: `src/lib/hooks/use-invoices.ts:717-728`
- Severity: MEDIUM
- When converting a proforma to a real invoice (`useConvertProformaToInvoice`), the `invoice_date` is kept as-is (the proforma date, line 725 comment). The invoice is immediately marked "paid" with `total_received = inv.total_amount` and `balance_due = 0`, BUT no payment record is created in `invoice_payments`. This means: (a) the revenue will NOT appear in the P&L view (which sums from `invoice_payments`, not from `invoices.total_received`), (b) the invoice shows as "paid" but contributes zero to revenue metrics. This is a revenue recognition gap.

**ISSUE 4.3-B: Revenue mixes currencies without conversion**
- File: `src/lib/hooks/use-analytics.ts:398-401`
- Severity: HIGH
- `sum + Number(p.amount_received_inr ?? p.amount_received ?? 0)` - the fallback `p.amount_received` is used when `amount_received_inr` is null. If a USD payment of $5000 does not have `amount_received_inr` filled in, it will be counted as Rs.5000 in the revenue total. The P&L view (004_analytics.sql:14) has the same issue: `SUM(COALESCE(ip.amount_received_inr, ip.amount_received))`.

### 4.4 Expense Calculations

**Expense summary (use-transactions.ts:265-316):**
- Queries all transactions with `debit > 0`, groups by category, sums debit amounts
- Correctly excludes income-type transactions in the SQL views but NOT in the useExpenseSummary hook (line 275: only filters `debit IS NOT NULL AND debit > 0`, does not filter by transaction_type)

**ISSUE 4.4-A: Expense summary includes transfers, tax, and loan payments**
- File: `src/lib/hooks/use-transactions.ts:275`
- Severity: HIGH
- The `useExpenseSummary` hook does NOT filter by `transaction_type`. It sums ALL debit transactions regardless of type (expense, transfer, tax, loan). This means inter-account transfers and loan repayments inflate the expense total. The SQL views (expenses_by_category_view, monthly_pl_view) correctly filter `transaction_type != 'income'`, but that still includes transfers and loans as expenses.

**ISSUE 4.4-B: SQL views count transfers and loans as expenses**
- File: `supabase/migrations/004_analytics.sql:25`
- Severity: HIGH
- The `monthly_pl_view` expenses CTE filters `WHERE t.transaction_type != 'income'`, which includes transaction types: expense, transfer, tax, loan, uncategorized. Transfers between own accounts should not be expenses. Loan principal repayments should not be operating expenses (interest may be). This inflates the P&L expense line and deflates net profit in investor reports.

### 4.5 Currency Handling

**CRITICAL ISSUE 4.5-A: Indian numbering format applied to all currencies in invoice PDF**
- File: `src/lib/pdf/invoice-pdf.tsx:53`
- Severity: CRITICAL
- The `formatCurrency` function in invoice-pdf.tsx uses `toLocaleString("en-IN")` for ALL currencies regardless of type. This means a USD invoice for $12,345.67 will be formatted as "$12,345.67" (happens to match since the amount is small) but for $1,234,567 it would show "$12,34,567.00" (Indian grouping: 12,34,567 instead of 1,234,567). This is confusing and unprofessional for international clients.

**ISSUE 4.5-B: Dashboard formatRevenue hardcodes "Rs." prefix**
- File: `src/app/(dashboard)/dashboard/page.tsx:17-19`
- Severity: MEDIUM
- The `formatRevenue()` helper always uses "Rs." prefix regardless of currency. Since dashboard KPIs use INR-normalized amounts, this is technically correct but will be misleading if the normalization is incomplete (see 4.3-B).

**ISSUE 4.5-C: formatNumber uses en-IN for all numbers**
- File: `src/lib/utils/format.ts:37`
- Severity: LOW
- `formatNumber` uses `Intl.NumberFormat("en-IN")` which applies Indian grouping (e.g., 12,34,567) to all numbers. If used for non-INR amounts, the grouping will be incorrect.

**ISSUE 4.5-D: Invoice PDF GST tax line hardcodes "Rs." for tax display**
- File: `src/components/shared/new-invoice-modal.tsx:343`
- Severity: MEDIUM
- The tax line in the invoice creation modal shows `Rs.{tax.toLocaleString("en-IN")}` even for non-INR currencies. If a USD invoice has GST (shouldn't happen, but the UI allows it if user manually selects GST type for a USD client), the tax would show with Rs. prefix.

### 4.6 Indian Financial Year

**FY boundary logic (use-analytics.ts:111-121):**
```
month >= 4 ? fyStart = year : fyStart = year - 1
from = fyStart-04-01, to = (fyStart+1)-03-31
```
This is CORRECT for Indian FY (Apr 1 to Mar 31).

**FY in targets (use-targets.ts:18-25):**
```
getFYBounds("2025-26") => start: 2025-04-01, end: 2026-03-31
```
CORRECT.

**Quarter bounds (use-targets.ts:43-55):**
```
Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
```
CORRECT for Indian FY quarters.

**ISSUE 4.6-A: getFinancialYear in format.ts parses FY string differently**
- File: `src/lib/utils/format.ts:45-52`
- The function returns `${year}-${String(year + 1).slice(2)}`, e.g., "2025-26". This is consistent with how `use-targets.ts` expects FY strings. No issue found.

---

## Phase 8: Cross-Module Data Flow

### Entity Relationship Map

| Parent | Child | FK Column | ON DELETE |
|--------|-------|-----------|-----------|
| auth.users | profiles | profiles.id | CASCADE |
| profiles | clients.created_by | created_by | (no cascade) |
| clients | projects | projects.client_id | CASCADE |
| clients | invoices | invoices.client_id | (no action - NOT CASCADE) |
| clients | contracts | contracts.client_id | (no action) |
| clients | client_contacts | client_contacts.client_id | CASCADE |
| clients | scheduled_invoices | scheduled_invoices.client_id | CASCADE |
| clients | tds_certificates | tds_certificates.client_id | (no action) |
| projects | contracts | contracts.project_id | (no action) |
| projects | scheduled_invoices | scheduled_invoices.project_id | SET NULL |
| invoices | invoice_line_items | invoice_line_items.invoice_id | CASCADE |
| invoices | invoice_payments | invoice_payments.invoice_id | CASCADE |
| invoices | scheduled_invoices.invoice_id | invoice_id | SET NULL |
| bank_statements | transactions | transactions.statement_id | CASCADE |
| expense_categories | transactions.category_id | category_id | (no action) |
| expense_categories | expense_rules.category_id | category_id | CASCADE |
| expense_rules | transactions.matched_rule_id | matched_rule_id | (no action) |
| invoices | transactions.linked_invoice_id | linked_invoice_id | (no action) |
| services | invoice_line_items.service_id | service_id | SET NULL |
| services | projects.service_id | service_id | SET NULL |

### Data Consistency Issues

**CRITICAL ISSUE 8.1-A: Deleting a client does NOT cascade to invoices**
- File: `supabase/migrations/001_schema.sql:136`
- Severity: CRITICAL
- The `invoices.client_id` FK has NO `ON DELETE CASCADE` (just `REFERENCES clients(id) NOT NULL`). If a client is deleted, the database will throw a FK constraint error, preventing deletion. This is actually protective behavior, but the `useDeleteClient` hook (use-clients.ts:238-258) has no guard against this - it will fail silently at the DB level with an unhelpful error message. Meanwhile, `projects` DO cascade on client delete (CASCADE), which means deleting a client would orphan their invoices while deleting their projects.

**ISSUE 8.1-B: Deleting a client cascades projects but invoices reference project_ids as UUID array**
- File: `supabase/migrations/001_schema.sql:137`
- Severity: HIGH
- `invoices.project_ids` is a `UUID[]` column, not a FK. There is no referential integrity between invoices and projects via this column. If projects are deleted (via client cascade), the `project_ids` array in invoices will contain dangling UUIDs pointing to deleted projects.

**ISSUE 8.1-C: No cascade for contracts on client delete**
- File: `supabase/migrations/001_schema.sql:230`
- Severity: MEDIUM
- `contracts.client_id REFERENCES clients(id)` without ON DELETE behavior. Same as invoices - will prevent client deletion if contracts exist, but with an unhelpful error.

**ISSUE 8.1-D: Transactions linked to invoices have no cascade**
- File: `supabase/migrations/001_schema.sql:335`
- Severity: LOW
- `transactions.linked_invoice_id REFERENCES invoices(id)` without ON DELETE behavior. If an invoice is deleted (only drafts can be), linked transactions would fail the FK check. Since only drafts can be deleted and transactions are unlikely to be linked to drafts, this is low risk.

### Missing Connections

**ISSUE 8.2-A: No project profitability calculation**
- Expenses can be linked to projects (transactions.project_id added in migration 002), and there is a `project_expense_breakdown` view (migration 006). However, there is no corresponding revenue-per-project calculation that would enable project profitability = revenue - expenses. The `project_revenue_by_type` view aggregates by project_type, not individual project.

**ISSUE 8.2-B: No client-level P&L**
- Revenue per client exists (`revenue_by_client_view`), but there is no way to see expenses attributed to a client. Transactions can link to projects (which link to clients), but there is no view or hook that computes client-level profitability.

**ISSUE 8.2-C: No unified financial activity view per client**
- The `useClientStats` hook (use-clients.ts:83-106) shows total_invoiced, total_received, and outstanding for a client, but does not include expenses, payments timeline, or contract details. There is no single view showing all financial activity for a client.

### Dashboard vs Analytics Consistency

**ISSUE 8.3-A: Dashboard KPIs use different source than P&L page**
- Dashboard `revenue_this_month` (use-analytics.ts:392-401): Queries `invoice_payments` directly with JS reduce
- P&L page: Uses `monthly_pl_view` SQL view which also queries `invoice_payments`
- Both use `COALESCE(amount_received_inr, amount_received)` - CONSISTENT

**ISSUE 8.3-B: Dashboard outstanding vs invoice list outstanding**
- Dashboard (use-analytics.ts:418-424): `SUM(balance_due) WHERE status IN (sent, overdue, partially_paid)`
- Invoice KPI (use-kpi.ts:86-98): Same query pattern - CONSISTENT
- Collections view (use-invoices.ts:597): Same statuses plus `gt("balance_due", 0)` - CONSISTENT but stricter (excludes zero-balance invoices)

**ISSUE 8.3-C: Overdue count inconsistency**
- Dashboard `overdue_invoices` (use-analytics.ts:435-437): Counts invoices with `status = "overdue"` (DB status field)
- Collections view urgency (use-invoices.ts:627-629): Calculates overdue by comparing `due_date < today` regardless of DB status
- These will diverge because there is no mechanism to update the DB status to "overdue" (see 4.2-C). The dashboard will show 0 overdue while the collections view correctly shows past-due invoices.

---

## Phase 9: Analytics & Reporting

### SQL View Audit

**View 1: monthly_pl_view (004_analytics.sql:11-36)**
- Revenue CTE: `SUM(COALESCE(ip.amount_received_inr, ip.amount_received))` grouped by month of `payment_date`
- Expense CTE: `SUM(t.debit)` where `transaction_type != 'income'` grouped by month of `transaction_date`
- Join: FULL OUTER JOIN on month_start
- ISSUE: Currency mixing (see 4.3-B) and transfer/loan inclusion (see 4.4-B)
- ISSUE: No filtering by invoice status - includes payments on cancelled invoices (though payments on cancelled invoices should be rare)

**View 2: revenue_by_client_view (004_analytics.sql:41-59)**
- Joins clients -> invoices -> invoice_payments
- Filters `i.status != 'draft'` but includes cancelled and archived invoices in `total_invoiced`
- `total_collected` uses `COALESCE(SUM(ip.amount_received_inr), 0)` - NOTE: this ONLY uses amount_received_inr, falling back to 0 if null. This differs from the P&L view which falls back to amount_received. **INCONSISTENCY**: Foreign currency payments without INR conversion will show as 0 collected in this view but will show their original currency amount in the P&L view.

**View 3: expenses_by_category_view (004_analytics.sql:64-76)**
- Correct grouping by month and category
- Same transfer/loan inclusion issue as P&L view

**View 4: invoice_status_summary (004_analytics.sql:80-86)**
- Simple GROUP BY status with SUM(total_amount)
- Includes all statuses including draft and cancelled - this is intentional for a summary view
- No currency consideration - sums INR and USD totals together

**View 5: client_health_scores (004_analytics.sql:90-131)**
- Calculates on-time percentage and health score per client
- Health formula: 60% * on_time_rate + 40% * (1 - avg_days/30)
- `on_time_count` checks `paid_at::date <= due_date` - CORRECT
- `total_collected` uses `SUM(COALESCE(ip.amount_received_inr, ip.amount_received))` - mixed currencies again
- The JOIN between invoices and invoice_payments may double-count invoices if multiple payments exist (COUNT DISTINCT i.id would be needed for invoice counts, but paid_count uses `COUNT(*) FILTER` on the joined result which counts one per payment-invoice pair, not per invoice). **BUG**: If an invoice has 3 payments, it will be counted 3 times in `paid_count`, inflating the health metrics.

**View 6: project_revenue_by_type (004_analytics.sql:135-144)**
- Joins projects -> invoices via `p.id = ANY(i.project_ids)` - uses the UUID array correctly
- Uses INNER JOINs so projects without invoices/payments are excluded
- Currency mixing in total_collected

**View 7: cash_flow_monthly (004_analytics.sql:148-173)**
- Structurally identical to monthly_pl_view (inflow = revenue, outflow = expenses)
- Same issues apply

**View 8: revenue_by_service_view (005_services.sql:52-71)**
- `total_line_item_revenue = SUM(ili.amount * ili.quantity)` - this is INVOICED revenue (from line items), not COLLECTED revenue (from payments). This is a different metric than other revenue views. The naming could mislead users into thinking it represents actual collected revenue.
- `monthly_retainer_value` sums retainer amounts from projects, which is a projected metric, not actual

### Analytics Hook Audit

The `use-analytics.ts` file exports 10 hooks:
1. `useMonthlyPL` - Reads from `monthly_pl_view`, applies FY filter - CORRECT
2. `useRevenueByClient` - Reads from `revenue_by_client_view` - CORRECT
3. `useExpensesByCategory` - Reads from `expenses_by_category_view` with N-month lookback - CORRECT
4. `useInvoiceStatusSummary` - Reads from `invoice_status_summary` - CORRECT
5. `useClientHealthScores` - Reads from `client_health_scores` - has double-counting bug (see view 5)
6. `useProjectRevenueByType` - Reads from `project_revenue_by_type` - CORRECT
7. `useCashFlowMonthly` - Reads from `cash_flow_monthly` - CORRECT
8. `useRevenueByService` - Reads from `revenue_by_service_view` - CORRECT
9. `useDashboardKPIs` - Direct queries, not using views - potential consistency risk
10. `usePaymentsList` - Direct query on invoice_payments with joins - CORRECT

All hooks properly cast numeric values with `Number()` and handle nulls with `?? 0`. No client-side recalculations found that would diverge from SQL views (the hooks are pass-through readers).

### Investor Report Accuracy

**CRITICAL ISSUE 9.1-A: Quarterly report covers only 2 months, not 3**
- File: `src/lib/hooks/use-reports.ts:109-111`
- Severity: CRITICAL
- Quarterly date range calculation:
  ```
  const quarterStart = new Date(report_year, report_month - 1, 1);
  const quarterEnd = new Date(report_year, report_month + 1, 0);
  ```
- `report_month` is the first month of the quarter (e.g., 4 for Q1 Apr-Jun).
- `quarterEnd = new Date(2026, 4+1, 0) = new Date(2026, 5, 0) = May 31, 2026`
- This gives Apr 1 to May 31 - only 2 months instead of 3!
- The correct calculation should be: `new Date(report_year, report_month + 2, 0)` to get the last day of the 3rd month (June 30).
- This means Q1 report misses June, Q2 misses September, Q3 misses December, Q4 misses March. Every quarterly investor report will understate revenue and expenses by approximately one-third.

**ISSUE 9.1-B: Investor report hardcodes "Rs." in email body**
- File: `src/lib/hooks/use-reports.ts:369`
- Severity: LOW
- `revenue: \`Rs.\${reportData.revenue.toLocaleString("en-IN")}\``
- All investor reports format amounts with "Rs." and Indian numbering. Since this is an Indian company reporting in INR, this is acceptable. But if the company ever reports in USD to foreign investors, this would be incorrect.

**ISSUE 9.1-C: Report PDF shows "Monthly Performance Report" for all report types**
- File: `src/lib/pdf/report-pdf.tsx:346`
- Severity: LOW
- The PDF title is hardcoded as "Monthly Performance Report" regardless of whether it's monthly, quarterly, or annual. For a quarterly report, this would be misleading.

**ISSUE 9.1-D: Active clients/projects in reports are point-in-time, not period-specific**
- File: `src/lib/hooks/use-reports.ts:162-171`
- Severity: LOW
- `activeClients` and `activeProjects` count current totals, not the values as of the report period. A December 2025 report generated in March 2026 would show March 2026's active client count, not December 2025's.

### P&L Verification

**Revenue calculation:**
- Source: `invoice_payments.amount_received_inr` (with fallback to `amount_received`)
- Basis: Cash-basis (by payment_date, not invoice_date) - appropriate for small business
- Issue: Currency mixing when INR conversion is missing (4.3-B)

**Expense calculation:**
- Source: `transactions.debit` where `transaction_type != 'income'`
- Issue: Includes transfers, tax payments, and loan repayments (4.4-B)

**Net profit:**
- `revenue - expenses` - mathematically correct given the inputs
- No accrual adjustments, depreciation, or provisions

**Balance sheet:**
- There is NO balance sheet in the system. The "balance" analytics page likely shows cash flow, not a formal balance sheet. This is acceptable for an operational tool but should not be represented to investors as a balance sheet.

---

## Critical Financial Risks

### Priority 1 - Will cause wrong money on invoices/reports

| # | Issue | Impact | File:Line |
|---|-------|--------|-----------|
| 1 | **Quarterly report covers 2 months instead of 3** | Investor reports understate quarterly revenue/expenses by ~33% | use-reports.ts:110 |
| 2 | **TDS not deducted from balance_due** | Indian client invoices show perpetually unpaid balance; overdue counts inflated | use-invoices.ts:852 |
| 3 | **Bank account mismatch in invoice PDF** | GST and non-GST PDFs show account "10113982735" while constants.ts has "10213871315" and "10221086461" | invoice-pdf.tsx:92,102 vs constants.ts:22,47 |
| 4 | **No rounding on tax/total calculations** | Cent-level discrepancies on every invoice with non-round amounts | new-invoice-modal.tsx:85-87 |
| 5 | **Edit page does not save line items** | PDF shows stale line items after edit; totals and line items diverge | edit/page.tsx:150-172 |

### Priority 2 - Will cause wrong analytics/KPIs

| # | Issue | Impact | File:Line |
|---|-------|--------|-----------|
| 6 | **Currency mixing in revenue aggregates** | USD/GBP amounts counted as INR when amount_received_inr is null | use-analytics.ts:400, 004_analytics.sql:14 |
| 7 | **Transfers/loans counted as expenses** | P&L overstates expenses; net profit understated in investor reports | 004_analytics.sql:25 |
| 8 | **No overdue auto-detection** | Dashboard shows 0 overdue while invoices are actually past due | No cron/trigger exists |
| 9 | **Proforma conversion creates no payment record** | Converted proforma revenue invisible in P&L | use-invoices.ts:717-728 |
| 10 | **client_health_scores double-counts invoices** | Health scores inflated for clients with multiple partial payments | 004_analytics.sql:94 |
| 11 | **Indian numbering on all currencies in PDF** | International clients see "$12,34,567" instead of "$1,234,567" | invoice-pdf.tsx:53 |
| 12 | **revenue_by_client_view drops foreign revenue** | Uses only amount_received_inr (no fallback); foreign payments show as 0 | 004_analytics.sql:47 |

### Priority 3 - Data integrity risks

| # | Issue | Impact | File:Line |
|---|-------|--------|-----------|
| 13 | **No FK cascade on invoices -> clients** | Client deletion fails with unhelpful error | 001_schema.sql:136 |
| 14 | **project_ids array has no referential integrity** | Deleted projects leave dangling UUIDs in invoices | 001_schema.sql:137 |
| 15 | **useExpenseSummary includes all transaction types** | Expense summary inflated with transfers/loans | use-transactions.ts:275 |

---

## Recommendations

### Immediate Fixes (before next invoice/report)

1. **Fix quarterly report date range** - Change `report_month + 1` to `report_month + 2` in use-reports.ts:110
2. **Fix TDS in balance_due** - Change formula to `total_amount - totalReceived - totalTds` in use-invoices.ts:852
3. **Fix bank account in invoice PDF** - Update account numbers in invoice-pdf.tsx:92,102 to match constants.ts values (10213871315 for GST, 10221086461 for non-GST)
4. **Add rounding to financial calculations** - Apply `Math.round(value * 100) / 100` to all subtotal, tax, and total computations
5. **Fix edit page to save line items** - Add upsert of invoice_line_items in the edit page submit handler

### Short-term Fixes (within 2 weeks)

6. **Add overdue status cron** - Create a Supabase Edge Function or pg_cron job that runs daily: `UPDATE invoices SET status = 'overdue' WHERE status IN ('sent', 'partially_paid') AND due_date < CURRENT_DATE`
7. **Fix currency formatting in PDFs** - Use `en-US` locale for USD/GBP/EUR/AED, `en-IN` only for INR
8. **Fix expense type filtering** - Add `AND transaction_type = 'expense'` to P&L views and expense summaries (or at minimum exclude 'transfer' and 'loan')
9. **Fix revenue_by_client_view** - Change `COALESCE(SUM(ip.amount_received_inr), 0)` to `COALESCE(SUM(COALESCE(ip.amount_received_inr, ip.amount_received)), 0)` for consistency
10. **Fix client_health_scores double-counting** - Use a subquery to deduplicate invoices before counting

### Medium-term Improvements (within 1 month)

11. **Implement CGST/SGST vs IGST split** based on client state
12. **Create payment record on proforma conversion** to ensure revenue recognition in P&L
13. **Add FK constraints or validation** for project_ids array in invoices
14. **Add project-level profitability view** joining project revenue with project expenses
15. **Fix report PDF title** to reflect report_type (monthly/quarterly/annual)
16. **Document accounting basis** (cash-basis) in the reports UI for investor clarity
