# WODO Ally - Analytics Module Documentation

Complete reference guide for all analytics features, dashboards, hooks, and calculations in the WODO Ally application.

---

## Analytics System Overview

WODO Ally's analytics system is built on **SQL views** that aggregate data from core tables (invoices, invoice_payments, transactions, clients, projects, services) and **TanStack Query hooks** that fetch and enrich view data for dashboard visualizations.

**Key Characteristics:**
- View-based (read-only queries, performance optimized)
- Real-time calculations (no separate sync job)
- Multi-dimensional analysis (revenue, expenses, client behavior, project performance)
- Indian FY support (Apr 1 - Mar 31)
- Recharts visualizations (bar, line, pie, radar, area charts)

---

## Database Views

### 1. **monthly_pl_view** - Monthly Profit & Loss
**Purpose:** Revenue vs expenses per month for P&L dashboard and trend analysis.

**Columns:**
- `month_start` (DATE) - First day of month
- `month_label` (TEXT) - "Jan 2026" format
- `total_revenue` (NUMERIC) - SUM(amount_received) from invoice_payments
- `total_expenses` (NUMERIC) - SUM(debit) from transactions where debit IS NOT NULL
- `net_profit` (NUMERIC) - total_revenue - total_expenses

**Query Logic:**
```sql
-- Aggregate revenue from all successful payments
WITH revenue AS (
  SELECT DATE_TRUNC('month', payment_date) as month,
         SUM(COALESCE(amount_received_inr, amount_received)) as total
  FROM invoice_payments
  GROUP BY DATE_TRUNC('month', payment_date)
)
-- Aggregate expenses (excluding income transactions)
WITH expenses AS (
  SELECT DATE_TRUNC('month', transaction_date) as month,
         SUM(debit) as total
  FROM transactions
  WHERE debit IS NOT NULL AND transaction_type != 'income'
  GROUP BY DATE_TRUNC('month', transaction_date)
)
-- Outer join to include months with only revenue or expenses
SELECT ... FROM revenue FULL OUTER JOIN expenses ...
```

**Used By:**
- Analytics main dashboard
- P&L page
- Balance sheet (for retained earnings calculation)
- Monthly trend analysis

---

### 2. **revenue_by_client_view** - Client Revenue Analytics
**Purpose:** Track revenue collected per client, including payment behavior metrics.

**Columns:**
- `client_id` (UUID)
- `client_name` (TEXT)
- `invoice_count` (INTEGER) - Total invoices sent (excludes drafts)
- `total_invoiced` (NUMERIC) - Sum of all invoice totals
- `total_collected` (NUMERIC) - Sum of payments received (INR)
- `avg_days_to_payment` (NUMERIC) - Average days from invoice_date to paid_at for paid invoices

**Query Logic:**
```sql
SELECT
  c.id, c.company_name,
  COUNT(DISTINCT i.id) as invoice_count,
  SUM(i.total_amount) as total_invoiced,
  COALESCE(SUM(ip.amount_received_inr), 0) as total_collected,
  ROUND(AVG(CASE WHEN i.status = 'paid'
    THEN EXTRACT(EPOCH FROM (i.paid_at - i.invoice_date)) / 86400
  END), 1) as avg_days_to_payment
FROM clients c
LEFT JOIN invoices i ON i.client_id = c.id AND i.status != 'draft'
LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
GROUP BY c.id, c.company_name
ORDER BY total_collected DESC
```

**Used By:**
- Analytics main dashboard (revenue by client bar chart)
- Client analytics page
- Top clients widget

---

### 3. **expenses_by_category_view** - Expense Breakdown
**Purpose:** Track spending patterns by expense category over time.

**Columns:**
- `month_label` (TEXT) - "Jan 2026" format
- `month_start` (DATE) - First day of month
- `category` (TEXT) - Expense category name
- `total_amount` (NUMERIC) - SUM(debit) for category in month
- `transaction_count` (INTEGER) - Number of transactions

**Query Logic:**
```sql
SELECT
  TO_CHAR(DATE_TRUNC('month', t.transaction_date), 'Mon YYYY') as month_label,
  DATE_TRUNC('month', t.transaction_date) as month_start,
  COALESCE(ec.name, 'Uncategorized') as category,
  SUM(t.debit) as total_amount,
  COUNT(*) as transaction_count
FROM transactions t
LEFT JOIN expense_categories ec ON t.category_id = ec.id
WHERE t.debit IS NOT NULL AND t.transaction_type != 'income'
GROUP BY month_start, category
ORDER BY month_start DESC
```

**Used By:**
- Expense analytics page (stacked bar chart, pie breakdown)
- Financial reporting
- Budget analysis

---

### 4. **invoice_status_summary** - Invoice Status Distribution
**Purpose:** Count invoices and total value by status for at-a-glance view.

**Columns:**
- `status` (TEXT) - draft | sent | paid | overdue | partially_paid | cancelled | archived
- `invoice_count` (INTEGER) - Count of invoices
- `total_value` (NUMERIC) - Sum of total_amount for status

**Query Logic:**
```sql
SELECT
  status,
  COUNT(*) as invoice_count,
  SUM(total_amount) as total_value
FROM invoices
WHERE status != 'draft'  -- Usually exclude drafts
GROUP BY status
ORDER BY total_value DESC
```

**Used By:**
- Invoice analytics page (pie chart)
- Dashboard status widget
- Collections summary

---

### 5. **client_health_scores** - Client Payment Behavior
**Purpose:** Comprehensive client health metrics (payment reliability, risk assessment).

**Columns:**
- `client_id` (UUID)
- `client_name` (TEXT)
- `paid_count` (INTEGER) - Total invoices paid
- `on_time_count` (INTEGER) - Invoices paid on or before due_date
- `overdue_count` (INTEGER) - Count of overdue invoices
- `avg_payment_days` (NUMERIC) - Average days to payment (paid invoices)
- `total_collected` (NUMERIC) - Total amount collected from client
- `on_time_pct` (NUMERIC) - (on_time_count / paid_count) × 100
- `health_score` (NUMERIC) - Calculated 0-100 score

**Health Score Calculation:**
```
Formula: Weighted combination of:
  - on_time_pct (40%)
  - (100 - avg_payment_days/30 capped at 100) (30%)
  - (total_collected / total_invoiced × 100) (30%)

Scale:
  >= 80: Excellent (green #16a34a)
  >= 60: Good (blue #3b82f6)
  >= 40: Fair (amber #f59e0b)
  < 40: At Risk (red #ef4444)
```

**Used By:**
- Client analytics page (radar chart, health scores table)
- Client list (circular health indicator)
- AR management (risk assessment)

---

### 6. **project_revenue_by_type** - Revenue by Engagement Type
**Purpose:** Analyze revenue distribution across retainer, milestone, fixed-price, hourly projects.

**Columns:**
- `project_type` (TEXT) - engagement_type: retainer | milestone | fixed_price | hourly
- `project_count` (INTEGER) - Number of projects
- `total_collected` (NUMERIC) - Total revenue from projects of this type

**Query Logic:**
```sql
SELECT
  p.engagement_type as project_type,
  COUNT(DISTINCT p.id) as project_count,
  SUM(COALESCE(ip.amount_received_inr, ip.amount_received)) as total_collected
FROM projects p
LEFT JOIN invoices i ON i.project_ids @> ARRAY[p.id]::uuid[] AND i.status != 'draft'
LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
GROUP BY p.engagement_type
ORDER BY total_collected DESC
```

**Used By:**
- Analytics main dashboard (project type breakdown)
- Project analytics page
- Business model analysis (retainer vs project mix)

---

### 7. **cash_flow_monthly** - Cash Inflows vs Outflows
**Purpose:** Track liquidity and cash position by month.

**Columns:**
- `month_start` (DATE)
- `month_label` (TEXT) - "Jan 2026" format
- `inflow` (NUMERIC) - Payments received (from invoice_payments)
- `outflow` (NUMERIC) - Expenses paid (from transactions)
- `net` (NUMERIC) - inflow - outflow (cash generation)

**Query Logic:**
```sql
WITH inflows AS (
  SELECT DATE_TRUNC('month', payment_date) as month,
         SUM(COALESCE(amount_received_inr, amount_received)) as total
  FROM invoice_payments
  GROUP BY DATE_TRUNC('month', payment_date)
),
outflows AS (
  SELECT DATE_TRUNC('month', transaction_date) as month,
         SUM(debit) as total
  FROM transactions
  WHERE debit IS NOT NULL AND transaction_type != 'income'
  GROUP BY DATE_TRUNC('month', transaction_date)
)
SELECT ... inflow - outflow as net ...
```

**Used By:**
- Balance sheet (bank balance projection)
- Liquidity analysis
- Cash flow forecasting

---

### 8. **revenue_by_service_view** - Service Revenue Analysis
**Purpose:** Track revenue generated by each service (SEO, web dev, GMB, etc.).

**Columns:**
- `service_id` (UUID)
- `service_name` (TEXT)
- `color` (TEXT) - Brand color for visualization
- `is_active` (BOOLEAN) - Whether service is active
- `project_count` (INTEGER) - Projects using this service
- `line_item_count` (INTEGER) - Total line items across projects
- `total_line_item_revenue` (NUMERIC) - SUM of line item amounts
- `monthly_retainer_value` (NUMERIC) - SUM of monthly retainer amounts from projects

**Used By:**
- Analytics main dashboard (revenue by service donut)
- Service revenue breakdown
- Product mix analysis

---

## Core Hooks (TanStack Query)

### File: `src/lib/hooks/use-analytics.ts`

#### **useMonthlyPL(financialYear?)**
Fetch P&L data with optional FY filtering.

```typescript
// Usage
const { data: plRows, isLoading } = useMonthlyPL("2025-26");

// Returns: MonthlyPLRow[]
// [
//   {
//     month_start: "2025-04-01",
//     month_label: "Apr 2025",
//     total_revenue: 450000,
//     total_expenses: 280000,
//     net_profit: 170000
//   },
//   ...
// ]
```

**Logic:**
- Default: Current financial year (Apr-Mar)
- FY filter: Parses "2025-26" → Apr 1, 2025 to Mar 31, 2026
- Query: `monthly_pl_view`
- Order: month_start ASC (chronological)

---

#### **useRevenueByClient()**
Fetch revenue metrics per client, ordered by total_collected DESC.

```typescript
// Usage
const { data: clients, isLoading } = useRevenueByClient();

// Returns: RevenueByClientRow[]
// [
//   {
//     client_id: "uuid",
//     client_name: "ABC Corp",
//     invoice_count: 12,
//     total_invoiced: 750000,
//     total_collected: 650000,
//     avg_days_to_payment: 18.5
//   },
//   ...
// ]
```

**Calculation:**
- `total_collected` = SUM(amount_received) for all payments
- `avg_days_to_payment` = AVG(paid_at - invoice_date) for paid invoices
- Shows collection rate implicitly: (collected / invoiced) × 100

---

#### **useExpensesByCategory(months = 6)**
Fetch expense breakdown by category for last N months.

```typescript
// Usage
const { data: expenses } = useExpensesByCategory(12);  // Last 12 months

// Returns: ExpensesByCategoryRow[]
// [
//   {
//     month_label: "Apr 2025",
//     month_start: "2025-04-01",
//     category: "Salaries",
//     total_amount: 150000,
//     transaction_count: 3
//   },
//   ...
// ]
```

**Logic:**
- `getNMonthsAgo(months)` calculates date N months back
- Query: `expenses_by_category_view` filtered by month_start >= N months ago
- Order: month_start ASC (chronological)

---

#### **useInvoiceStatusSummary()**
Fetch invoice counts and values by status.

```typescript
// Usage
const { data: statusData } = useInvoiceStatusSummary();

// Returns: InvoiceStatusSummaryRow[]
// [
//   { status: "paid",           invoice_count: 45, total_value: 2250000 },
//   { status: "sent",           invoice_count: 8,  total_value: 520000 },
//   { status: "partially_paid", invoice_count: 3,  total_value: 180000 },
//   { status: "overdue",        invoice_count: 2,  total_value: 95000 },
//   ...
// ]
```

---

#### **useClientHealthScores()**
Fetch comprehensive client health metrics, ordered by health_score DESC.

```typescript
// Usage
const { data: healthScores } = useClientHealthScores();

// Returns: ClientHealthScoreRow[]
// [
//   {
//     client_id: "uuid",
//     client_name: "Premium Client",
//     paid_count: 24,
//     on_time_count: 23,
//     overdue_count: 0,
//     avg_payment_days: 8.5,
//     total_collected: 1500000,
//     on_time_pct: 95.83,
//     health_score: 92
//   },
//   ...
// ]
```

**Health Assessment:**
- Used for client risk evaluation
- Visual indicators (circular progress, color bands)
- Input for collections prioritization

---

#### **useProjectRevenueByType()**
Fetch revenue distribution across project types (retainer, milestone, etc.).

```typescript
// Usage
const { data: byType } = useProjectRevenueByType();

// Returns: ProjectRevenueByTypeRow[]
// [
//   { project_type: "retainer",    project_count: 5, total_collected: 2100000 },
//   { project_type: "fixed_price", project_count: 8, total_collected: 1200000 },
//   { project_type: "milestone",   project_count: 3, total_collected: 450000 },
//   { project_type: "hourly",      project_count: 2, total_collected: 125000 },
// ]
```

---

#### **useCashFlowMonthly(months = 6)**
Fetch cash inflows vs outflows for last N months.

```typescript
// Usage
const { data: cashFlow } = useCashFlowMonthly(6);

// Returns: CashFlowMonthlyRow[]
// [
//   {
//     month_start: "2025-10-01",
//     month_label: "Oct 2025",
//     inflow: 450000,      // Payments received
//     outflow: 280000,     // Expenses paid
//     net: 170000          // Cash generated
//   },
//   ...
// ]
```

---

#### **useRevenueByService()**
Fetch revenue contribution by service type.

```typescript
// Usage
const { data: services } = useRevenueByService();

// Returns: RevenueByServiceRow[]
// [
//   {
//     service_id: "uuid",
//     service_name: "SEO",
//     color: "#3b82f6",
//     is_active: true,
//     project_count: 12,
//     line_item_count: 48,
//     total_line_item_revenue: 850000,
//     monthly_retainer_value: 125000
//   },
//   ...
// ]
```

**Revenue Calculation:**
- `total_line_item_revenue` = SUM(amount) from invoice line items
- `monthly_retainer_value` = SUM(retainer_amount) from projects
- Total service revenue = line_item + retainer components

---

#### **useDashboardKPIs()**
Fetch key performance indicators for dashboard widget.

```typescript
// Usage
const { data: kpis } = useDashboardKPIs();

// Returns: DashboardKPIs
// {
//   revenue_this_month: 450000,
//   revenue_last_month: 380000,
//   outstanding: 245000,
//   active_clients: 18,
//   overdue_invoices: 2,
//   mrr: 185000
// }
```

**Calculation Details:**
```typescript
// This month: SUM(amount_received) for current month payments
revenue_this_month = SUM(amount_received_inr ?? amount_received)
  WHERE payment_date >= 2026-03-01 AND payment_date <= 2026-03-31

// Last month: Same calculation for previous month
revenue_last_month = Similar calc for 2026-02-01 to 2026-02-28

// Outstanding: Total balance_due for unpaid invoices
outstanding = SUM(balance_due)
  WHERE status IN ['sent', 'overdue', 'partially_paid']

// Active clients: Count
active_clients = COUNT(id) from clients WHERE status = 'active'

// Overdue count: Count
overdue_invoices = COUNT(id) from invoices WHERE status = 'overdue'

// MRR: Monthly Recurring Revenue from retainer projects
mrr = SUM(retainer_amount) from projects
  WHERE engagement_type = 'retainer'
  AND status IN ['active_execution', 'maintenance']
```

---

#### **usePaymentsList()**
Fetch all payments with client/invoice enrichment.

```typescript
// Usage
const { data: payments } = usePaymentsList();

// Returns: PaymentListItem[]
// [
//   {
//     id: "uuid",
//     invoice_id: "uuid",
//     invoice_number: "G00107",
//     client_id: "uuid",
//     client_name: "ABC Corp",
//     payment_date: "2026-03-04",
//     amount_received: 1000,
//     amount_received_inr: 1000,
//     tds_amount: 180,
//     skydo_fx_margin: 0,
//     skydo_processing_fee: 0,
//     payment_method: "bank_transfer",
//     reference_number: "UTR123456"
//   },
//   ...
// ]
```

---

## Analytics Pages

### `/analytics` - Main Analytics Dashboard
**File:** `src/app/(dashboard)/analytics/page.tsx`

**KPI Cards:**
- Total revenue (filtered period)
- Total expenses (filtered period)
- Net profit (revenue - expenses)
- Profit margin % (net profit / revenue × 100)

**Charts:**
1. **Monthly Revenue & Expenses** (Area chart)
   - X-axis: Months
   - Y-axis: Amount (Rs.)
   - Series: Revenue (green), Expenses (red)
   - Shows trends over selected period

2. **Revenue by Service** (Donut chart)
   - Top 6 services by revenue
   - Color-coded by service.color
   - Shows both line item + retainer revenue

3. **Revenue by Client** (Horizontal bar chart)
   - Top 10 clients by revenue collected
   - Sorted descending
   - Shows collection amount in INR

**Date Filter:**
- All time | Last 30 days | Last 90 days | This FY | Custom range
- Affects all charts

---

### `/analytics/pl` - Detailed P&L Statement
**File:** `src/app/(dashboard)/analytics/pl/page.tsx`

**Summary Cards:**
- Total Revenue (period)
- Total Expenses (period)
- Net Profit (period)
- Profit Margin % (period)

**Table:**
| Month | Revenue | Expenses | Gross Profit | Net Profit | Margin % |
|-------|---------|----------|--------------|-----------|----------|
| Apr 2025 | 450,000 | 280,000 | 170,000 | 170,000 | 37.8% |
| May 2025 | 520,000 | 310,000 | 210,000 | 210,000 | 40.4% |

**Chart:**
- Stacked/grouped bar chart: Revenue vs Expenses
- Reference line: Break-even (0 profit)
- Color-coded series

**Calculations:**
```
Gross Profit = Revenue - Expenses
Net Profit = Revenue - Expenses
Margin % = (Net Profit / Revenue) × 100
```

---

### `/analytics/expenses` - Expense Analysis
**File:** `src/app/(dashboard)/analytics/expenses/page.tsx`

**Date Filter:**
- 6-month view (last 6 months by default)

**Charts:**

1. **Expenses by Category** (Stacked bar chart)
   - X-axis: Months
   - Y-axis: Amount
   - Series: Each expense category (color-coded)
   - Shows composition of spending

2. **Expense Distribution** (Pie chart)
   - Categories in current period
   - Size = total amount per category
   - Percentage labels

**Table:**
| Category | Jan 2026 | Feb 2026 | Mar 2026 | Total |
|----------|----------|----------|----------|-------|
| Salaries | 150,000 | 150,000 | 150,000 | 450,000 |
| Tech | 25,000 | 30,000 | 28,000 | 83,000 |

**Category Palette:**
- 10 distinct colors assigned dynamically to categories
- Maps consistently across period

---

### `/analytics/clients` - Client Performance
**File:** `src/app/(dashboard)/analytics/clients/page.tsx`

**Summary Stats:**
- Total clients (with health score >= 0)
- Premium clients (health_score >= 80)
- Growth clients (60 <= health_score < 80)
- Average collection days
- Best client (highest health_score)

**Charts:**

1. **Client Health Radar Chart**
   - Top 10 clients by health_score
   - Axes: paid_count, on_time_count, collection_rate, avg_payment_days
   - Shows multidimensional client performance

2. **Revenue by Client** (Bar chart)
   - Top 6 clients by revenue collected
   - Sorted descending
   - Color-coded by health tier

---

### `/analytics/invoices` - Invoice Analytics
**File:** `src/app/(dashboard)/analytics/invoices/page.tsx`

**Summary Stats:**
- Total invoices sent
- Total invoiced amount
- Total collected
- Collection rate %

**Charts:**

1. **Invoice Status Distribution** (Pie chart)
   - Segments: Paid | Sent | Overdue | Partially Paid | Cancelled | Archived
   - Size = invoice count or value
   - Status color coding

2. **Revenue by Client** (Bar chart)
   - Top clients by revenue

---

### `/analytics/projects` - Project Analytics
**File:** `src/app/(dashboard)/analytics/projects/page.tsx`

**Charts:**

1. **Revenue by Project Type** (Pie/Bar)
   - Retainer vs Milestone vs Fixed-Price vs Hourly
   - Shows business model distribution

2. **Project Profitability** (if data available)
   - Revenue vs costs per project type

---

### `/analytics/balance` - Balance Sheet Projection
**File:** `src/app/(dashboard)/analytics/balance/page.tsx`

**Estimated Position:**

**Assets:**
- Current:
  - Accounts Receivable (outstanding invoices)
  - Security Deposits
  - Advance to Freelancers
- Fixed:
  - Equipment (net book value)
  - Office Furniture
- Intangible:
  - Domain Names
  - Software Licenses

**Liabilities:**
- Current:
  - Freelancer Dues
  - GST Payable
  - TDS Payable
- Long-term:
  - Director Loan
  - Equity

**Equity:**
- Calculated from: Assets - Liabilities
- Retained Earnings = cumulative net profit

---

## Helper Functions

### Date Range Resolution
```typescript
function getCurrentFYRange(): { from: string; to: string }
// Returns Apr 1 (current or last) to Mar 31 (next year)
// Logic: if month >= 4 → current year, else → previous year

function getNMonthsAgo(months: number): string
// Returns date string N months in the past
// Used for expense lookback period
```

### Calculations
```typescript
netProfit = totalRevenue - totalExpenses

profitMargin = netProfit > 0 ? (netProfit / totalRevenue) * 100 : 0

collectionRate = (totalCollected / totalInvoiced) * 100

healthScore = weighted formula based on:
  - on_time_pct (40%)
  - avg_payment_days (30%)
  - collection_rate (30%)
```

---

## Navigation

**Analytics Sub-Navigation** (`analytics-sub-nav.tsx`):
- Overview (main)
- P&L Statement
- Expenses
- Clients
- Invoices
- Projects
- Balance Sheet

**Breadcrumb:** Dashboard → Analytics → [Selected Page]

---

## Key Features Summary

✅ **Multi-dimensional Analysis** - Revenue, expenses, clients, projects, services
✅ **P&L Dashboard** - Monthly profit/loss with trend visualization
✅ **Cash Flow Analysis** - Inflows vs outflows, liquidity tracking
✅ **Client Health Scoring** - Risk assessment (0-100 score)
✅ **Expense Categorization** - Breakdown by category, per-month trends
✅ **Service Revenue** - Track performance by service type
✅ **Project Analysis** - Revenue by engagement type (retainer, fixed, hourly, milestone)
✅ **Invoice Status Tracking** - Distribution across statuses
✅ **Balance Sheet Projection** - Asset/liability/equity estimation
✅ **Date Filtering** - Period, FY, custom range support
✅ **Real-time Updates** - View-based queries (no ETL job)
✅ **Responsive Charts** - Recharts (bar, line, pie, radar, area)
✅ **KPI Dashboard** - Key metrics at a glance
✅ **Collections Analytics** - Outstanding, overdue, payment behavior
✅ **Color Coding** - Service colors, status colors, health tier colors

---

## Data Flow

```
1. Core Tables
   ├── invoices
   ├── invoice_payments
   ├── transactions
   ├── clients
   ├── projects
   └── services

2. SQL Views (Read-only)
   ├── monthly_pl_view
   ├── revenue_by_client_view
   ├── expenses_by_category_view
   ├── invoice_status_summary
   ├── client_health_scores
   ├── project_revenue_by_type
   ├── cash_flow_monthly
   └── revenue_by_service_view

3. Hooks (useQuery with TanStack)
   ├── useMonthlyPL
   ├── useRevenueByClient
   ├── useExpensesByCategory
   ├── useInvoiceStatusSummary
   ├── useClientHealthScores
   ├── useProjectRevenueByType
   ├── useCashFlowMonthly
   ├── useRevenueByService
   ├── useDashboardKPIs
   └── usePaymentsList

4. Dashboard Pages
   ├── /analytics (main)
   ├── /analytics/pl
   ├── /analytics/expenses
   ├── /analytics/clients
   ├── /analytics/invoices
   ├── /analytics/projects
   └── /analytics/balance
```

---

## Performance Considerations

- **Views:** Indexed queries on transaction_date, payment_date, status
- **Caching:** TanStack Query caches all analytics queries
- **Invalidation:** Manual on payment/invoice/transaction changes
- **Pagination:** Not used (all data loaded, client-side filtering)
- **Real-time:** Queries execute on page load (no background sync)

---

## Indian FY Support

WODO Ally's financial year follows Indian fiscal year:
- **Starts:** April 1
- **Ends:** March 31

**Example:** FY 2025-26 = Apr 1, 2025 to Mar 31, 2026

---

## Related Documentation

- See **invoicing-module.md** for invoice data source
- See **payments-module.md** for payment data source
- See **expenses-module.md** for transaction data source
- See **clients-module.md** for client health metrics
- See **projects-module.md** for project and service data

---

**Last Updated:** 2026-03-04
**Status:** Phase 5 Complete (Polish + Deploy)
