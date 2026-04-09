# WODO Ally - Payments Module Documentation

Complete reference guide for all payment-related features, components, and actions in the WODO Ally application. Covers invoice payments, payment tracking, collections, and payment deductions.

---

## Payment System Overview

WODO Ally has a unified payment tracking system built around **invoice_payments** table, which records all payments received against invoices. This integrates with:

- **Invoices** - Each payment is linked to an invoice
- **Clients** - Payments are tracked per client for AR/collections
- **Analytics** - Payment data feeds into P&L and cash flow analysis
- **Transactions** - Bank statement matching and reconciliation
- **TDS Certificates** - Tax deduction tracking from payments

---

## Database Models

### Table: `invoice_payments`

**Purpose:** Store all payments received for invoices, including payment method, deductions (TDS, Skydo fees, bank charges), and reconciliation details.

**Columns:**

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `invoice_id` | UUID | FK to invoices (ON DELETE CASCADE) |
| `payment_date` | DATE | When payment was received |
| `amount_received` | NUMERIC(12,2) | Amount in original currency |
| `amount_received_inr` | NUMERIC(12,2) | Converted to INR (if foreign currency) |
| `currency` | TEXT | Currency (default: INR) |
| `tds_amount` | NUMERIC(12,2) | Tax Deducted at Source (TDS) deduction |
| `tds_section` | TEXT | TDS section (e.g., "194C", "194J") |
| `skydo_fx_margin` | NUMERIC(12,2) | Skydo forex margin on international transfers |
| `skydo_processing_fee` | NUMERIC(12,2) | Skydo processing fee on international transfers |
| `bank_charges` | NUMERIC(12,2) | Bank transaction charges |
| `other_deductions` | NUMERIC(12,2) | Any other deductions |
| `deduction_notes` | TEXT | Explanation of deductions |
| `payment_method` | TEXT | Enum: `bank_transfer` \| `skydo_usd` \| `skydo_aed` \| `skydo_gbp` \| `upi` \| `other` |
| `reference_number` | TEXT | UTR, cheque number, transaction ID, etc. |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMPTZ | Timestamp |
| `created_by` | UUID | User who recorded payment |

**RLS Policies:**
- Authenticated users can view payments
- Admin/Manager/Accountant can manage payments

**Key Constraints:**
- `payment_method` must be valid enum value
- FK constraint: invoice_id references invoices (cascading delete)

---

## Payment Flow & Calculations

### Recording a Payment
1. User records payment on invoice detail page via `RecordPaymentModal`
2. Mutation: `useRecordPayment()` (from use-invoices.ts)
3. Payment record inserted into `invoice_payments`
4. System recalculates invoice totals:
   ```
   total_received = SUM(amount_received) from all payments
   total_tds_deducted = SUM(tds_amount) from all payments
   balance_due = total_amount - total_received
   ```
5. Invoice status updated based on balance:
   - If balance_due <= 0 → `paid` + set paid_at
   - Else if total_received > 0 → `partially_paid`
   - Else → `sent` (unchanged)

### Payment Methods & Deductions

#### Bank Transfer (NEFT)
- Direct bank transfer via NEFT
- May have TDS deduction (India-specific)
- May have bank charges

#### UPI
- Unified Payments Interface (India)
- Real-time, typically no deductions
- May track reference number

#### Skydo International
- **Skydo (USD)** - USD payments via Skydo
- **Skydo (AED)** - AED payments via Skydo
- **Skydo (GBP)** - GBP payments via Skydo

**Deductions:**
- `skydo_fx_margin` - Forex margin charged by Skydo
- `skydo_processing_fee` - Processing fee for international transfer
- Both are automatically deducted from payment amount

**Conversion:**
- `amount_received` - Original amount in foreign currency
- `amount_received_inr` - Converted to INR at actual exchange rate
  ```
  amount_received_inr = amount_received × exchange_rate - skydo_fx_margin - skydo_processing_fee
  ```

#### Other
- Any other payment method (cheque bounce handling, adjustments, etc.)

### TDS (Tax Deducted at Source)

**What:** Tax deduction at source required for certain payments under Indian Income Tax Act.

**Sections:**
- `194C` - Payments for work/services (contractors, consultants)
- `194J` - Payments for professional services
- Others as applicable

**Calculation:**
- `tds_amount` - Amount withheld by client
- `tds_section` - Which section applies
- Automatically deducted from `amount_received` to calculate `balance_due`

**Example:**
```
Invoice total: Rs. 1,18,000
Payment received: Rs. 1,00,000 (with TDS)
TDS deducted: Rs. 18,000 (at 18% under 194C)
balance_due = 1,18,000 - 1,00,000 = Rs. 18,000
(TDS is tracked separately for tax compliance)
```

---

## Payment Types (TanStack Query)

### PaymentListItem
```typescript
interface PaymentListItem {
  id: string;
  invoice_id: string;
  invoice_number: string | null;
  client_id: string;
  client_name: string;
  payment_date: string;
  amount_received: number;           // Original amount
  amount_received_inr: number | null; // INR converted
  currency: string;
  tds_amount: number;
  skydo_fx_margin: number;
  skydo_processing_fee: number;
  bank_charges: number;
  other_deductions: number;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
}
```

---

## Core Hooks

### File: `src/lib/hooks/use-invoices.ts`

#### **useRecordPayment()**
Record a payment against an invoice. Automatically recalculates invoice totals and status.

```typescript
// Usage
const recordPayment = useRecordPayment();

await recordPayment.mutateAsync({
  payment: {
    invoice_id: "invoice-123",
    payment_date: "2026-03-04",
    amount_received: 1000,      // Original amount
    amount_received_inr: 1000,  // INR amount (auto-calculated for Skydo)
    currency: "INR",
    tds_amount: 180,            // 18% TDS
    tds_section: "194C",
    skydo_fx_margin: 0,
    skydo_processing_fee: 0,
    bank_charges: 0,
    other_deductions: 0,
    deduction_notes: "18% TDS as per 194C",
    payment_method: "bank_transfer",
    reference_number: "UTR123456789",
    notes: "Payment received from ABC Corp"
  }
});

// onSuccess: Invalidates ["invoices"], ["invoice", invoiceId], ["invoice-payments", invoiceId]
// Toast: "Payment recorded successfully"
```

**Payment Recording Logic:**
```typescript
// 1. Insert payment record
// 2. Fetch all payments for this invoice
// 3. Recalculate:
//    - total_received = SUM(amount_received)
//    - total_tds_deducted = SUM(tds_amount)
//    - balance_due = MAX(0, total_amount - total_received)
// 4. Determine new status:
//    - balance_due <= 0 → "paid" + set paid_at = now()
//    - balance_due < total_amount → "partially_paid"
//    - else → no change
// 5. Update invoice with new totals & status
```

---

### File: `src/lib/hooks/use-analytics.ts`

#### **usePaymentsList()**
Fetch all payments with enriched client/invoice information for the Payments page.

```typescript
// Usage
const { data: payments, isLoading, error } = usePaymentsList();

// Returns: PaymentListItem[]
// Ordered by payment_date DESC
// Enriched with: client_name, invoice_number
```

**Data Fetching:**
1. Fetch all invoice_payments (ordered by payment_date DESC)
2. Fetch related invoices (invoice_number, client_id)
3. Fetch related clients (company_name)
4. Join and return enriched list

---

## Pages

### `/payments` - Payment Records & Collections
**File:** `src/app/(dashboard)/payments/page.tsx`

**Features:**

#### KPI Cards (Dark Section Header)
- **Total Received** - All-time total from all payments (in INR, formatted as Lakh)
- **Outstanding** - Total balance_due across all unpaid invoices (in thousands)
- **Overdue** - Count of overdue invoices (requires follow-up)
- **TDS Deducted** - Total TDS deducted (all time)

**Calculation:**
```typescript
totalReceivedAllTime = SUM(amount_received_inr) for all payments
totalTdsAllTime = SUM(tds_amount) for all payments
totalOutstanding = SUM(balance_due) where status != "paid"
overdueCount = COUNT(invoices) where status = "overdue"
```

#### Search & Filtering
- **Search** - By client name or invoice number
- **Date Filter** - All | Last 30 days | Last 90 days | This FY | Custom range
  - Uses `resolveDateRange()` helper to calculate date boundaries
  - Indian FY: Apr 1 - Mar 31

#### Sortable Table
- **Columns:**
  1. Client / Invoice # (with reference number if available)
  2. Payment Method (bank_transfer → "Bank Transfer", skydo_usd → "Skydo (USD)", etc.)
  3. Date (formatted)
  4. Amount (in INR, green text)
     - Shows TDS deduction below (yellow, if > 0)
     - Shows Skydo fees below (blue, if > 0)

- **Sortable by:**
  - payment_date (default, DESC)
  - client_name
  - amount_received
  - payment_method

- **Sort icons:** Chevron up (ASC) / Chevron down (DESC)

#### Mobile Responsive
- Cards layout on mobile
- Table layout on desktop (md breakpoint)
- Amount right-aligned on mobile

#### Overdue Alert
If `overdueCount > 0`, displays warning card:
```
"Overdue invoices need attention"
"{count} invoice(s) - Total outstanding: Rs.{amount}K"
```

**Data Loading:**
```typescript
usePaymentsList()      // All payment records
useDashboardKPIs()     // For outstanding + overdue counts
```

---

## Payment Modal (Recorded in Invoices)

### RecordPaymentModal
**Location:** `src/app/(dashboard)/invoices/[id]/page.tsx`

**Purpose:** Form to record a payment against an invoice.

**Fields:**
- `payment_date` (required) - DATE picker (default: today)
- `amount_received` (required) - NUMERIC
- `payment_method` (required) - SELECT:
  - Bank Transfer (NEFT)
  - UPI
  - Skydo (USD)
  - Skydo (AED)
  - Skydo (GBP)
  - Other
- `reference` (optional) - TEXT (UTR, cheque #, transaction ID)
- `tds_amount` (optional) - NUMERIC (amount withheld)
- `tds_section` (optional) - SELECT (194C, 194J, etc.)
- `notes` (optional) - TEXT

**Calculation on Submit:**
- If Skydo method: Prompt for FX margin & processing fee
- If currency != INR: Calculate `amount_received_inr` with deductions
- Auto-calculate balance remaining

**Validation:**
- amount_received > 0
- payment_date <= today
- If Skydo: fx + fee should not exceed amount_received

**On Success:**
- Closes modal
- Invalidates invoice cache
- Shows: "Payment recorded successfully"

---

## Payment Method Details

### Bank Transfer (NEFT)
```
Payment Method: "bank_transfer"
Deductions:
  - tds_amount: Optional
  - bank_charges: Optional
Amount Calculation:
  amount_received_inr = amount_received - tds_amount - bank_charges
```

### UPI
```
Payment Method: "upi"
Deductions:
  - Minimal (usually zero)
  - bank_charges: Optional
Amount Calculation:
  amount_received_inr = amount_received - bank_charges
```

### Skydo USD
```
Payment Method: "skydo_usd"
Requires:
  - amount_received: Original amount in USD
  - skydo_fx_margin: Forex spread
  - skydo_processing_fee: Transfer fee
Amount Calculation:
  amount_received_inr = (amount_received × usd_to_inr_rate) - skydo_fx_margin - skydo_processing_fee
```

### Skydo AED / GBP
```
Same as Skydo USD but for:
  - skydo_aed (AED to INR)
  - skydo_gbp (GBP to INR)
```

### Other
```
Payment Method: "other"
For: Cheques, adjustments, barter, etc.
Deductions: Custom via other_deductions field
```

---

## Analytics & Reporting

### View: `monthly_pl_view`
Combines revenue from invoice_payments with expenses from transactions.

```sql
SELECT
  month_start,
  month_label,
  total_revenue,    -- SUM(amount_received_inr) from invoice_payments
  total_expenses,   -- SUM(debit) from transactions
  profit            -- total_revenue - total_expenses
FROM monthly_pl_view
ORDER BY month_start DESC
```

**Usage:** P&L dashboard, financial analysis

### View: `cash_flow_monthly`
Tracks cash inflows (payments) vs outflows (expenses) per month.

```sql
SELECT
  month_start,
  inflow,           -- SUM(amount_received_inr) from invoice_payments
  outflow,          -- SUM(debit) from transactions
  net_cash_flow     -- inflow - outflow
FROM cash_flow_monthly
ORDER BY month_start DESC
```

**Usage:** Cash flow forecasting, liquidity analysis

### View: `revenue_by_client_view`
Revenue collected per client.

```sql
SELECT
  client_id,
  client_name,
  total_collected,  -- SUM(amount_received) from invoice_payments
  avg_days_to_payment
FROM revenue_by_client_view
```

### Calculated Metrics

#### Total Received (All Time)
```typescript
totalReceivedAllTime = SUM(
  COALESCE(amount_received_inr, amount_received)
) from all invoice_payments
```

#### Total TDS Deducted
```typescript
totalTdsDeducted = SUM(tds_amount) from all invoice_payments
```

#### Total Outstanding
```typescript
totalOutstanding = SUM(balance_due)
WHERE status IN ['sent', 'viewed', 'partially_paid', 'overdue']
```

#### Overdue Count
```typescript
overdueCount = COUNT(invoices)
WHERE status = 'overdue'
```

#### Average Days to Payment
```sql
avg_days_to_payment = AVG(
  EXTRACT(EPOCH FROM (paid_at - invoice_date)) / 86400
)
WHERE status = 'paid'
```

#### Collection Rate
```typescript
collectionRate = (total_received / total_invoiced) × 100
```

#### On-Time Payment %
```sql
on_time_pct = (
  COUNT(paid invoices with paid_at <= due_date) /
  COUNT(all paid invoices)
) × 100
```

---

## Integration Points

### From Invoices
- Record payment button on invoice detail page
- Opens RecordPaymentModal
- Auto-updates invoice status + balance_due
- Links to payments page via "Record Payment" action

### From Clients
- Client detail page shows payment history
- Links to create invoice or record payment
- Client health score includes payment behavior
- Collections view for overdue invoices

### From Dashboard
- Payment KPIs widget
- Cash flow chart
- Collections widget (overdue alert)
- "Record Payment" quick action in FAB

### From Analytics
- Monthly P&L includes revenue from payments
- Cash flow dashboard
- Revenue by client
- Payment trends

---

## Payment Constants

### Method Labels
```typescript
const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  skydo_usd: "Skydo (USD)",
  skydo_aed: "Skydo (AED)",
  skydo_gbp: "Skydo (GBP)",
  upi: "UPI",
  other: "Other",
};
```

### TDS Sections (Indian Income Tax)
- `194C` - Payments for work/services (contractors, consultants) - 1-5%
- `194J` - Payments for professional services - 10%
- `194H` - Payments for commissions - 5%
- `194LB` - Payments for specified financial products - 1%

---

## Calculation Functions

### Net Amount After Deductions
```typescript
netAmount = amount_received - (tds_amount + skydo_fx_margin + skydo_processing_fee + bank_charges + other_deductions)

// If currency != INR:
netAmountInr = (amount_received × exchangeRate) - deductions
```

### Invoice Balance Calculation
```typescript
totalReceived = SUM(amount_received) from all payments
totalTdsDeducted = SUM(tds_amount) from all payments

balance_due = MAX(0, total_amount - totalReceived)

// Note: TDS is tracked but doesn't reduce balance_due
// (it's a tax adjustment, not a payment reduction)
```

### Payment Status Determination
```typescript
if (balance_due <= 0):
  status = "paid"
  paid_at = NOW()
else if (totalReceived > 0):
  status = "partially_paid"
else:
  status = "sent" (unchanged)
```

### Days to Payment Calculation
```typescript
daysToPayment = (paid_at - invoice_date) / 86400 seconds

// Only calculated for invoices where status = "paid"
// Used for average_payment_days metrics
```

---

## Key Features Summary

✅ **Payment Recording** - Against specific invoices with full audit trail
✅ **Multi-currency Support** - INR, USD, AED, GBP with forex tracking
✅ **International Transfers** - Skydo integration with fx margin + processing fees
✅ **TDS Tracking** - Tax deduction management with section codes
✅ **Bank Charges** - Track fees and charges per payment
✅ **Payment Methods** - Bank transfer, UPI, Skydo, other
✅ **Auto Status Update** - Invoice status auto-updates based on payment
✅ **Collections Tracking** - Overdue alerts, outstanding amounts, payment behavior
✅ **Payment Analytics** - P&L, cash flow, revenue by client
✅ **Payment Search** - By client name or invoice number
✅ **Date Filtering** - All-time, 30/90 days, FY, custom range
✅ **Sortable Payments** - By date, client, amount, method
✅ **KPI Dashboard** - Total received, outstanding, overdue, TDS deducted
✅ **Mobile Responsive** - Cards on mobile, table on desktop
✅ **Audit Trail** - created_by, created_at, reference numbers

---

## Error Handling

- Invalid payment_date (future dates blocked)
- Invalid payment_method (enum validation)
- amount_received <= 0 rejected
- TDS section mismatch warnings
- Skydo fees > amount warning
- Duplicate reference number detection (optional)

---

## Security

**RLS Policies:**
- Authenticated users can view all payments
- Only Admin/Manager/Accountant can create/edit/delete payments
- Prevent unauthorized payment recording

**Audit Trail:**
- `created_by` - Which user recorded the payment
- `created_at` - When payment was recorded
- Reference number for reconciliation

---

## Migration History

- **001_schema.sql** - Initial invoice_payments table definition
- Payment structure supports multi-currency, multi-method, deductions

---

## Related Documentation

- See **invoicing-module.md** for invoice management
- See **clients-module.md** for AR and collections
- See **expenses-module.md** for expense tracking and transactions

---

**Last Updated:** 2026-03-04
**Status:** Phase 5 Complete (Polish + Deploy)
