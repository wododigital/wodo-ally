# WODO Ally - Invoicing Module Documentation

Complete reference guide for all invoice-related features, components, and actions in the WODO Ally application.

---

## Database Models

### Tables
- **`invoices`** - Main invoice table with status & type management
- **`invoice_line_items`** - Line items for invoices (description, amount, quantity)
- **`invoice_payments`** - Payment records per invoice (payment_method, tds_amount, etc.)
- **`scheduled_invoices`** - For recurring/scheduled invoice generation

### Invoice Types
- `gst` - GST invoices (18% tax, India)
- `non_gst` - Non-GST invoices (India, no tax)
- `international` - International invoices
- `proforma` - Proforma invoices (quote-style, can be converted)

### Invoice Statuses
- `draft` - Not yet sent, fully editable
- `sent` - Finalized and sent to client
- `paid` - Fully paid
- `partially_paid` - Partial payment received
- `overdue` - Due date passed, still unpaid
- `cancelled` - Cancelled (cannot be deleted, only cancelled)
- `archived` - Archived (read-only)
- `viewed` - Client has viewed the invoice

---

## Core Hooks

### File: `src/lib/hooks/use-invoices.ts`

#### 1. **useInvoices(filters?)**
Fetch all invoices with optional filtering.
```typescript
// Usage
const { data, isLoading, error } = useInvoices({
  status: "sent",
  clientId: "client-123"
});

// Returns: InvoiceListItem[] (includes client_name, client_currency)
```
- Filters: `status`, `clientId`
- Ordering: `invoice_date` DESC
- Type: Query (TanStack)

#### 2. **useInvoice(id)**
Fetch single invoice with line items and client details.
```typescript
// Usage
const { data: invoice } = useInvoice("invoice-id");

// Returns: InvoiceWithDetails
// {
//   ...invoiceData,
//   line_items: LineItemRow[],
//   client: ClientRow | null
// }
```

#### 3. **useCreateInvoice()**
Create a new invoice as draft with line items.
```typescript
// Usage
const createInvoice = useCreateInvoice();

await createInvoice.mutateAsync({
  invoice: {
    invoice_type: "gst",
    client_id: "client-123",
    currency: "INR",
    subtotal: 1000,
    tax_rate: 18,
    tax_amount: 180,
    total_amount: 1180,
    balance_due: 1180,
    invoice_date: "2026-03-04",
    status: "draft",
    // ... other fields
  },
  lineItems: [
    {
      description: "Service",
      amount: 1000,
      quantity: 1
    }
  ]
});
```
- Auto-toast on success/error
- Invalidates `["invoices"]` query cache

#### 4. **useUpdateInvoice()**
Update invoice fields (for drafts only).
```typescript
const updateInvoice = useUpdateInvoice();

await updateInvoice.mutateAsync({
  id: "invoice-id",
  data: {
    total_amount: 1500,
    notes: "Updated notes"
  }
});
```

#### 5. **useDeleteInvoice()**
Delete draft invoices only (safety check).
```typescript
const deleteInvoice = useDeleteInvoice();

await deleteInvoice.mutateAsync("invoice-id");
// Throws error if invoice is not draft
```
- Deletes line items first (FK constraint)
- Only works on `status: "draft"`

#### 6. **useFinalizeInvoice()**
Convert draft → sent (assigns invoice number, sets sent_at).
```typescript
const finalizeInvoice = useFinalizeInvoice();

await finalizeInvoice.mutateAsync({ id: "invoice-id" });

// Logic:
// - Proforma: generates PF-20260304-123
// - GST: gets next G00107 from RPC
// - Non-GST: gets next NG00202 from RPC
// - International: uses GST sequence
// - Sets status: "sent", sent_at: now()
```
- Only works on `status: "draft"`
- Auto-toast with invoice number

#### 7. **useGenerateRetainerInvoices()**
Auto-generate monthly invoices for active retainer projects.
```typescript
const generateRetainers = useGenerateRetainerInvoices();

const result = await generateRetainers.mutateAsync();
// Returns: { created: number }

// Logic:
// - Finds active retainer projects
// - Creates draft invoices for current month if not already created
// - Skips if project already has an invoice this month
```
- Monthly billing (1st to last day of month)
- Determines invoice type from client.client_type
- Auto-calculates tax (18% for GST, 0% for others)

#### 8. **useScheduledInvoices()**
Fetch pending/generated scheduled invoices.
```typescript
const { data: scheduled } = useScheduledInvoices();

// Returns: ScheduledInvoiceEnriched[]
// {
//   ...row,
//   client_name,
//   payment_terms_days,
//   project_name,
//   engagement_type,
//   expected_payment_date,
//   display_amount
// }
```

#### 9. **useUpdateScheduledInvoice()**
Update status of scheduled invoice.
```typescript
const update = useUpdateScheduledInvoice();

await update.mutateAsync({
  id: "scheduled-id",
  status: "generated",
  generated_invoice_id: "invoice-123"
});
```
- Statuses: `pending` | `generated` | `skipped` | `cancelled`

#### 10. **useCollectionsInvoices()**
Fetch invoices for AR/collections (overdue, due-soon, upcoming).
```typescript
const { data: collections } = useCollectionsInvoices();

// Returns: CollectionInvoice[] (extends InvoiceListItem)
// {
//   ...invoice,
//   urgency: "overdue" | "due_soon" | "upcoming",
//   days_label: "5 days overdue" | "Due Mar 10" | "Expected Mar 15"
// }

// Filters: status in ["sent", "overdue", "partially_paid"] AND balance_due > 0
```
- Ordered by `due_date` ASC
- Calculates urgency based on due_date vs today

#### 11. **useInvoicePayments(invoiceId)**
Fetch all payments for a single invoice.
```typescript
const { data: payments } = useInvoicePayments("invoice-id");

// Returns: PaymentRow[]
// Ordered by payment_date DESC
```

#### 12. **useConvertProformaToInvoice()**
Convert proforma invoice to real invoice (marked paid).
```typescript
const convert = useConvertProformaToInvoice();

await convert.mutateAsync("proforma-invoice-id");

// Logic:
// - Fetches proforma
// - Gets next invoice number based on client type
// - Sets invoice_type: "gst" | "non_gst" | "international"
// - Sets status: "paid", paid_at: now()
// - Sets total_received: total_amount, balance_due: 0
```
- Only works on `invoice_type: "proforma"`

#### 13. **useRecordPayment()**
Record a payment for an invoice (updates balance_due, status).
```typescript
const recordPayment = useRecordPayment();

await recordPayment.mutateAsync({
  payment: {
    invoice_id: "invoice-id",
    payment_date: "2026-03-04",
    amount_received: 500,
    payment_method: "bank_transfer",
    tds_amount: 50,
    reference: "TRN123456",
    notes: "Payment received"
  }
});

// Logic:
// 1. Insert payment record
// 2. Recalculate total_received from all payments
// 3. Recalculate total_tds_deducted
// 4. Calculate balance_due = total_amount - total_received
// 5. Update invoice status:
//    - balance_due <= 0 → "paid" + set paid_at
//    - total_received > 0 → "partially_paid"
```
- Payment methods: `bank_transfer | upi | skydo_usd | skydo_aed | skydo_gbp | other`
- Auto-toast on success/error

---

## Pages

### `/invoices` - Invoice List
**File:** `src/app/(dashboard)/invoices/page.tsx`

**Features:**
- List all invoices with client names
- Filters:
  - Status: All | Draft | Sent | Paid | Overdue | Proforma | Archived
  - Type: All | GST | Non-GST | International | Proforma
- Sorting: By Invoice # | Client | Type | Date | Amount | Status (toggle asc/desc)
- Status change dropdown (with "Record Payment" option for sent/overdue)
- Proforma conversion option
- Create invoice button → opens `NewInvoiceModal`
- Download PDF (dynamic import of @react-pdf/renderer)
- Type badges: GST | Non-GST | Intl. | Proforma

**Status Transitions:**
```
draft → sent, cancelled
sent → paid, overdue, cancelled
overdue → paid, sent, cancelled
paid → (no transitions)
cancelled → draft
archived → (no transitions)
proforma → (convert to invoice via dropdown)
```

### `/invoices/[id]` - Invoice Detail View
**File:** `src/app/(dashboard)/invoices/[id]/page.tsx`

**Features:**
- Full invoice details (all fields)
- Line items table
- Client info section (address, tax number)
- Payment history table (date, method, amount, TDS)
- Payment status summary bar (total, received, due, TDS)
- Actions:
  - Send invoice (email) - TODO: EMAIL
  - Download PDF
  - Record payment (opens `RecordPaymentModal`)
  - Edit (if draft)
  - Finalize (if draft) - converts to sent
  - Cancel (if not archived)
- Status badge with visual indicators
- Invoice viewing timestamp (viewed_at)
- Proforma conversion option

**Key Components:**
- `RecordPaymentModal` - Form to record payment (date, amount, method, TDS, reference, notes)
- Currency display with proper formatting (Rs. for INR, $ for USD, etc.)
- Responsive layout with dark-section cards

### `/invoices/[id]/edit` - Edit Invoice
**File:** `src/app/(dashboard)/invoices/[id]/edit/page.tsx`

**Features:**
- Edit invoice details (only if draft)
- Edit line items (add/remove, reorder)
- Service selector (pre-fill descriptions)
- Tax calculation (auto-updates based on type)
- Status selector (change between draft/sent/paid/overdue/cancelled)
- Delete invoice button (with confirmation modal)
- Save button
- Form validation (amount required, quantity > 0, etc.)

**Line Item Management:**
- Add new line items
- Delete line items
- Quantity and amount fields
- Sort order management
- Service dropdown selector

### `/analytics/invoices` - Invoice Analytics
**File:** `src/app/(dashboard)/analytics/invoices/page.tsx`

**Features:**
- Date filter (by period/FY/custom date range)
- KPI cards:
  - Total revenue
  - Invoices sent
  - Overdue invoices
  - Collections rate
- Status pie chart (paid | sent | overdue | draft | viewed | partially_paid | cancelled)
- Monthly revenue bar chart
- Revenue by client bar chart
- Summary statistics (average, total, count)

**Hooks Used:**
- `useInvoiceStatusSummary()` - Status counts
- `useRevenueByClient()` - Client revenue breakdown
- `useDashboardKPIs()` - Key metrics
- `useMonthlyPL()` - Monthly trends

---

## Components

### `NewInvoiceModal`
**File:** `src/components/shared/new-invoice-modal.tsx`

**Props:**
```typescript
{
  onClose: () => void;
  preselectedClientId?: string;
  preselectedType?: string | null;
  preselectedProjectId?: string;
  forcedType?: "proforma";
  onCreated?: () => void;
}
```

**Features:**
- Create new invoice (gst | non_gst | international | proforma)
- Client selector (dropdown with company names)
- Project selector (filtered by client)
- Invoice type selector
- Invoice date (defaults to today)
- Add/remove line items dynamically
- Service selector for each item (auto-fills description)
- Quantity and amount fields
- Tax calculation (18% for GST, 0% for others)
- Save as draft or finalize immediately
- Form validation with inline errors
- Close on outside click or X button

**Line Item UI:**
- Service dropdown → auto-fills description
- Amount field (number)
- Quantity field (number)
- Delete button per item
- Add Item button
- Total calculation (subtotal + tax = total)

### `FloatingFAB`
**File:** `src/components/shared/floating-fab.tsx`

**Quick Actions (includes invoice):**
1. Onboard Client → `/onboard`
2. **Create Invoice** → opens `NewInvoiceModal`
3. Upload Bank Statement → `/expenses/upload`
4. Record Payment → `/payments`
5. Investor Report → `/reports`

**Behavior:**
- Bottom-right fixed position
- Expand on click, collapse on outside click
- Smooth fade-in animation
- Color-coded icons per action

### `PdfPreviewModal`
**File:** `src/components/shared/pdf-preview-modal.tsx`

**Usage in Invoices:**
- Preview invoice PDF before download
- Modal with iframe (embedded PDF viewer)
- Download button
- Close button
- Edge-to-edge modal (no padding on overlay)
- Max-width: 860px, height: 90vh, centered

### `StatusBadge`
**File:** `src/components/shared/status-badge.tsx`

**Invoice Statuses:**
- `draft` - Gray
- `sent` - Blue
- `paid` - Green
- `overdue` - Red
- `partially_paid` - Amber
- `cancelled` - Gray
- `archived` - Gray
- `viewed` - Purple

### `CurrencyDisplay`
**File:** `src/components/shared/currency-display.tsx`

**Formats:**
- INR: `Rs.10,00,000` (Indian locale)
- USD: `$10,000.00`
- AED: `AED 10,000.00`
- GBP: `GBP 10,000.00`

---

## Utilities

### Invoice Number Generation
**File:** `src/lib/invoice/number-generator.ts`

#### `generateProformaRef()`
Generates proforma reference in format `PF-YYYYMMDD-NNN`.
```typescript
// Example output: PF-20260304-456
// Uses: Date + last 3 digits of timestamp for uniqueness within day
```

#### `getNextInvoiceNumber(supabase, type)`
Calls Supabase RPC to get next sequential invoice number.
```typescript
const num = await getNextInvoiceNumber(supabase, "gst");
// Output: "G00107"

const num = await getNextInvoiceNumber(supabase, "non_gst");
// Output: "NG00202"
```
- Only call at finalization time, never on draft
- RPC: `get_next_invoice_number(seq_type)` in Supabase

### Invoice PDF Generation
**File:** `src/lib/pdf/invoice-pdf.tsx`

**Props:**
```typescript
interface InvoicePdfProps {
  invoice: {
    invoice_number: string | null;
    proforma_ref: string | null;
    invoice_type: "gst" | "international" | "non_gst" | "proforma";
    invoice_date: string;
    due_date: string | null;
    currency: string;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
    notes: string | null;
    billing_period_start: string | null;
    billing_period_end: string | null;
  };
  client: {
    company_name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    country: string;
    gstin: string | null;
    tax_number: string | null;
    tax_number_label: string | null;
  };
  lineItems: Array<{ description: string; amount: number; quantity: number }>;
}
```

**Features:**
- Uses @react-pdf/renderer
- Professional layout with company branding
- Indian locale formatting for dates and currency
- Tax calculations and summary
- Client and item details
- Dynamically imported (not bundled upfront)

---

## Analytics Hooks

**File:** `src/lib/hooks/use-analytics.ts`

### `useInvoiceStatusSummary()`
```typescript
const { data } = useInvoiceStatusSummary();

// Returns: Array of { status, count, revenue }
```

### `useRevenueByClient()`
```typescript
const { data } = useRevenueByClient();

// Returns: Array of { client_name, revenue, invoice_count }
```

### `useDashboardKPIs()`
```typescript
const { data } = useDashboardKPIs();

// Returns: {
//   total_revenue,
//   total_invoices_sent,
//   overdue_count,
//   collections_rate
// }
```

### `useMonthlyPL()`
```typescript
const { data } = useMonthlyPL();

// Returns: Array of { month_start, month_label, revenue, expenses, profit }
```

---

## Type Definitions

**File:** `src/types/index.ts`

```typescript
export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceLineItem = Database["public"]["Tables"]["invoice_line_items"]["Row"];
export type InvoicePayment = Database["public"]["Tables"]["invoice_payments"]["Row"];

export type InvoiceWithClient = Invoice & {
  invoice_line_items: InvoiceLineItem[];
};

export type InvoiceWithPayments = InvoiceWithClient & {
  invoice_payments: InvoicePayment[];
};

export type InvoiceStatus = Invoice["status"];
export type InvoiceType = Invoice["invoice_type"];
```

---

## Database Migrations

**File:** `supabase/migrations/010_invoice_archived_status.sql`
- Adds `archived` status to invoices table

---

## Key Features Summary

✅ **Draft Management** - Create, edit, delete drafts
✅ **Invoice Types** - GST, Non-GST, International, Proforma
✅ **Auto-numbering** - Sequential numbers per type (G00107, NG00202, PF-YYYYMMDD-NNN)
✅ **Line Items** - Fully customizable with sort order
✅ **Tax Calculation** - Auto 18% for GST, 0% for others
✅ **Payment Recording** - Track partial/full payments with TDS
✅ **Collections Tracking** - Urgency labels for AR
✅ **Retainer Automation** - Monthly invoice generation
✅ **PDF Generation** - Professional invoices with @react-pdf/renderer
✅ **Multi-currency** - INR, USD, AED, GBP
✅ **Analytics Dashboard** - Revenue charts, KPIs, status breakdown
✅ **Scheduled Invoices** - Future invoice scheduling
✅ **Proforma Conversion** - Quote → Invoice workflow

---

## Integration Points

- **Clients Page:** Invoice button in client card, link to create proforma
- **Payments Page:** Record payment action
- **FloatingFAB:** Create Invoice quick action
- **Dashboard:** Invoice KPIs and collections widget
- **Analytics:** Invoice metrics and trends
- **Pipeline:** Invoice milestones and scheduling

---

**Last Updated:** 2026-03-04
**Status:** Phase 5 Complete (Polish + Deploy)
