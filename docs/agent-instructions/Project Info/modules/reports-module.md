# WODO Ally - Reports Module Documentation

Complete reference guide for investor reports, financial reports, and report generation in WODO Ally.

---

## Database Models

### Tables
- **`investor_reports`** - Generated investor reports with type, period, and status
- **`invoices`** - Data source for revenue metrics
- **`invoice_payments`** - Data source for collections & cash received
- **`transactions`** - Data source for expenses
- **`projects`** - Data source for project revenue breakdown

### Report Types
- `monthly` - Monthly financial snapshot (30-day period)
- `quarterly` - Quarterly report (Q1-Q4, 3-month periods)
- `annual` - Annual report (Full FY: Apr 1 - Mar 31)

### Report Statuses
- `draft` - Report generated, not yet finalized
- `finalized` - Report finalized, ready to share
- `sent` - Report sent to recipients (sent_at timestamp recorded)
- `archived` - Report archived for records

### Indian Financial Year (FY)
- **FY2025-26**: Apr 1, 2025 - Mar 31, 2026
- **Quarters**:
  - Q1: Apr 1 - Jun 30
  - Q2: Jul 1 - Sep 30
  - Q3: Oct 1 - Dec 31
  - Q4: Jan 1 - Mar 31

---

## Core Hooks

### File: `src/lib/hooks/use-reports.ts`

#### 1. **useReports(filters?)**
Fetch all reports with optional filtering by type/period.
```typescript
// Usage
const { data, isLoading } = useReports({
  report_type: "quarterly",
  period: "Q1"
});

// Returns: InvestorReport[]
```
- Filters: `report_type`, `period` (optional)
- Ordering: `created_at` DESC
- Type: Query (TanStack)

#### 2. **useReport(id)**
Fetch single report with full data aggregation.
```typescript
// Usage
const { data: report } = useReport("report-123");

// Returns: InvestorReportWithData
// {
//   ...reportData,
//   metrics: {
//     total_revenue, total_expenses, net_profit, cash_flow,
//     invoices_count, clients_count, projects_completed
//   }
// }
```
- Type: Query (TanStack)

#### 3. **useCreateReport()**
Generate new report for specified period/type.
```typescript
// Usage
const createReport = useCreateReport();

await createReport.mutateAsync({
  report_type: "quarterly",
  period: "Q1",
  fy: "FY2025-26",
  include_summary: true,
  include_details: true
});
```
- Fetches data for period: invoices, payments, expenses, projects
- Calculates P&L, cash flow, metrics
- Creates draft report
- Auto-toast on success/error

#### 4. **useUpdateReport()**
Update report fields (for draft reports).
```typescript
// Usage
const updateReport = useUpdateReport();

await updateReport.mutateAsync({
  id: "report-123",
  data: {
    status: "finalized",
    notes: "Updated with Q1 actuals"
  }
});
```
- Invalidates report queries
- Auto-toast on success/error

#### 5. **useDeleteReport()**
Delete report (draft status only).
```typescript
// Usage
const deleteReport = useDeleteReport();

await deleteReport.mutateAsync("report-123");
```
- Only draft reports can be deleted
- Invalidates queries
- Auto-toast

#### 6. **useGeneratePDF(reportId)**
Trigger PDF generation from report data.
```typescript
// Usage
const { mutate: generatePDF } = useGeneratePDF("report-123");

generatePDF({
  includeCharts: true,
  includeDetails: true
});
```
- Calls report-pdf.tsx component
- Returns PDF blob for download or storage
- Auto-toast on error

#### 7. **useSendReport()**
Send report via email with recipients and subject.
```typescript
// Usage
const sendReport = useSendReport();

await sendReport.mutateAsync({
  reportId: "report-123",
  recipients: ["investor@example.com", "cfo@company.com"],
  cc: ["finance@wodo.digital"],
  subject: "Q1 2026 Investor Report",
  message: "Please find attached the Q1 financial report..."
});
```
- Generates PDF if not exists
- Sends via nodemailer + Microsoft 365 SMTP
- Records sent_at timestamp
- Auto-toast on success/error

---

## Report Features

### Period Calculation
**Monthly Reports:**
- 30-day or calendar month period
- Covers all transactions in that month

**Quarterly Reports:**
- Q1 (Apr-Jun): 92 days
- Q2 (Jul-Sep): 92 days
- Q3 (Oct-Dec): 92 days
- Q4 (Jan-Mar): 90 days

**Annual Reports:**
- Full financial year (Apr 1 - Mar 31)
- 365 days or 366 days (leap year)

### Key Metrics Calculated

**Revenue:**
- Total invoiced amount (invoices.total_amount)
- Amount received (SUM invoice_payments)
- Outstanding amount (Revenue - Received)
- By client, by service, by project type

**Expenses:**
- Total expenses (SUM transactions where type='expense')
- By category
- By project

**Profitability:**
- Net Profit = Total Revenue - Total Expenses
- Profit Margin = (Net Profit / Total Revenue) × 100

**Cash Flow:**
- Cash In = Payments received
- Cash Out = Expenses paid
- Net Cash Flow = Cash In - Cash Out

**Project Metrics:**
- Projects completed in period
- Average project value
- Projects pending completion

**Client Metrics:**
- Active clients in period
- New clients acquired
- Clients by health score

---

## Pages

### File: `src/app/(dashboard)/reports/page.tsx`

**Features:**
- Report list with period filters (Monthly, Quarterly, Annual)
- Indian FY year selector for quarterly/annual
- Quarter selector (Q1-Q4) for quarterly reports
- Report cards with:
  - Report type badge (Monthly/Quarterly/Annual)
  - Period display (e.g., "Q1 2026" or "Mar 2026")
  - Status badge (Draft, Finalized, Sent)
  - Net profit display (green for positive, red for negative)
  - Key metrics: Revenue, Expenses, Profit
  - Generated date & sent date (if applicable)
- Action buttons:
  - View PDF (opens modal with PDF preview)
  - Download PDF
  - Send Email (opens modal for recipients/subject)
  - Resend (if already sent)
  - Edit (draft only)
  - Delete (draft only)
- Generate Report button (opens period selector)

**Hooks Used:**
- `useReports(filters)` - Fetch reports
- `useCreateReport()` - Generate new
- `useGeneratePDF(id)` - PDF generation
- `useSendReport()` - Email sending
- `useDeleteReport()` - Delete draft

**Components:**
- `GlassCard` - Container styling
- `StatusBadge` - Status display
- `EmptyState` - When no reports exist
- `PDF Preview Modal` - View PDF in modal with iframe
- `Send Email Modal` - Recipient, CC, Subject, Message editor
- `Period Selector Modal` - Choose report type/period/FY

**Responsive:**
- Mobile: Single column, hide details
- Desktop: Multi-column grid

---

## Form Fields

### Generate Report Form
- `report_type` (required, dropdown) - Monthly/Quarterly/Annual
- `period` (required, dropdown) - Month/Quarter selector
- `fy` (for quarterly/annual, dropdown) - Financial year selector
- `include_summary` (checkbox) - Include summary metrics
- `include_details` (checkbox) - Include detailed breakdown
- `include_charts` (checkbox) - Include visualizations

### Send Report Form
- `recipients` (required, email list) - To addresses
- `cc` (optional, email list) - CC addresses (defaults to wodo emails)
- `subject` (required, text) - Email subject
- `message` (optional, textarea) - Email body message

### Validation Rules
- `report_type` must be valid enum value
- `period` required if generating new report
- `recipients` must have at least one valid email
- `subject` required, max 255 chars
- Email addresses must be valid format

---

## Special Features

### Data Aggregation
Report generation:
1. Fetch all invoices for period
2. Fetch all payments for period
3. Calculate outstanding amounts
4. Fetch all expenses for period
5. Calculate P&L
6. Fetch project completions
7. Calculate metrics
8. Generate PDF with all data

### PDF Generation
- Uses @react-pdf/renderer (report-pdf.tsx)
- Includes: Header, Period, Metrics Table, Charts, Footer
- Charts: P&L waterfall, Revenue trend, Expense breakdown
- Professional formatting with company logo
- Page breaks for long reports

### Email Integration
- Microsoft 365 SMTP (accounts@wodo.digital)
- Email subject: Auto-formatted period (e.g., "Q1 2026 Investor Report")
- CC defaults to WODO email addresses (finance, CEO)
- Attachments: PDF report
- Tracks sent_at timestamp

### Report Status Workflow
```
Draft (create) → Finalized (review) → Sent (email) → Archived (record)
```

---

## Integrations

### Data Sources
- **Invoices** - Revenue metrics
- **Payments** - Collections & cash received
- **Expenses/Transactions** - Expense metrics
- **Projects** - Completion tracking
- **Services** - Revenue by service

### Email System
- Integrated with email/client.ts (nodemailer)
- Uses Microsoft 365 SMTP
- Requires SMTP_PASS env var

### PDF Storage
- Option to save PDF to Supabase storage (reports/ folder)
- Retrieve via signed URL for sharing
- Track PDF generation timestamp

---

## Type Definitions

```typescript
// Report data
type InvestorReport = Database["public"]["Tables"]["investor_reports"]["Row"];

// With aggregated metrics
type InvestorReportWithData = InvestorReport & {
  metrics: {
    total_revenue: number;
    total_received: number;
    outstanding: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
    cash_flow: number;
    invoices_count: number;
    clients_count: number;
    projects_completed: number;
  };
};
```

---

## API Routes (Planned)

- `GET /api/reports` - List reports with pagination
- `GET /api/reports/[id]` - Fetch single
- `POST /api/reports` - Generate new
- `PATCH /api/reports/[id]` - Update fields
- `DELETE /api/reports/[id]` - Delete (draft only)
- `POST /api/reports/[id]/generate-pdf` - Trigger PDF
- `POST /api/reports/[id]/send` - Send via email
- `GET /api/reports/[id]/pdf` - Download PDF

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Total Hooks | 7 |
| Pages | 1 |
| Report Types | 3 |
| Statuses | 4 |
| Supported Periods | Monthly, Quarterly, Annual |

---

## Last Updated

**Date:** 2026-03-05
**Status:** Phase 5 Complete
**Build:** 0 TypeScript errors

---

## Related Documentation
- `invoicing-module.md` - Invoice revenue data
- `payments-module.md` - Payment collections data
- `expenses-module.md` - Expense data
- `analytics-module.md` - Similar metrics
