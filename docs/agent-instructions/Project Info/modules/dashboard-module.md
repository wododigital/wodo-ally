# WODO Ally - Dashboard Module Documentation

Complete reference guide for the main dashboard, KPI metrics, and business intelligence overview in WODO Ally.

---

## Database Models & Data Sources

### Tables Used
- **`invoices`** - Revenue metrics
- **`invoice_payments`** - Collections data
- **`transactions`** - Expense data
- **`projects`** - MRR from retainers
- **`financial_targets`** - Goal progress
- **`clients`** - Health scores

### Views & Aggregations
- `revenue_by_client_view` - Top clients by revenue
- `monthly_pl_view` - Monthly profit & loss
- `cash_flow_monthly` - Monthly cash flow
- `client_health_scores` - Client payment reliability
- Dashboard KPIs - Real-time calculations

---

## Core Hooks

### File: `src/lib/hooks/use-analytics.ts` (Dashboard functions)

#### 1. **useDashboardKPIs(period?)**
Fetch all primary KPI metrics.
```typescript
// Usage
const { data: kpis, isLoading } = useDashboardKPIs("this_month");

// Returns: DashboardKPIs
// {
//   total_revenue: 250000,
//   total_outstanding: 50000,
//   total_clients: 8,
//   overdue_invoices: 2,
//   mrr: 45000,
//   cash_in_this_month: 150000,
//   cash_out_this_month: 80000,
//   net_cash_flow: 70000
// }
```
- Period: "this_month", "last_month", "this_quarter", "this_fy", "all_time"
- Type: Query (TanStack, 5-min cache)
- Real-time aggregations

#### 2. **useAttentionItems()**
Fetch items requiring immediate attention.
```typescript
// Usage
const { data: items } = useAttentionItems();

// Returns: AttentionItem[]
// [
//   { type: "overdue_invoice", id, client_name, amount, days_overdue },
//   { type: "pending_payment", id, invoice_id, days_pending },
//   { type: "expiring_contract", id, client_name, days_until_expiry },
//   { type: "upcoming_payment_due", id, client_name, days_until_due }
// ]
```
- Type: Query (TanStack, real-time)
- Alerts for: overdue, pending, expiring

#### 3. **useMonthlyRevenueTrend(months?)**
Fetch monthly revenue line data for charts.
```typescript
// Usage
const { data } = useMonthlyRevenueTrend(12);

// Returns: MonthData[]
// [
//   { month: "Jan 2025", revenue: 200000, invoices: 15 },
//   { month: "Feb 2025", revenue: 250000, invoices: 18 },
//   ...
// ]
```
- Default: Last 12 months
- Type: Query (TanStack)
- Used for Recharts area chart

#### 4. **useTopClients(limit?)**
Fetch top clients by revenue.
```typescript
// Usage
const { data } = useTopClients(5);

// Returns: ClientRevenue[]
// [
//   { id, name, total_revenue, invoices_count, avg_payment_days },
//   ...
// ]
```
- Default: Top 5
- Type: Query (TanStack)
- Ordered by revenue DESC

---

## Dashboard Components & Layout

### File: `src/app/(dashboard)/page.tsx`

**Page Structure:**

#### Section 1: KPI Cards (Top Row)
- **Total Revenue**: YTD or selected period, link to invoices
- **Outstanding Amount**: Unpaid invoices, link to collections
- **Total Clients**: Active clients, link to clients page
- **Overdue Invoices**: Count + total amount, link to overdue invoices
- **Monthly Recurring Revenue (MRR)**: From retainer projects, link to projects
- **Cash In (This Month)**: Payments received
- **Cash Out (This Month)**: Expenses
- **Net Cash Flow**: Cash In - Out

Cards use:
- Large typography for primary value
- Subtitle with period or description
- Icon from lucide-react
- Color-coded (green for positive, red for negative)
- Click-through link to detail page

#### Section 2: Attention Items (Cards)
- **Overdue Invoices**: Red flag, count + total, link to overdue
- **Pending Approvals**: Yellow flag, action items
- **Expiring Contracts**: Orange flag, days remaining
- **Upcoming Payments**: Blue flag, due soon

#### Section 3: Revenue Trend Chart (Area Chart)
- Last 12 months line chart
- X-axis: Month (Jan, Feb, Mar, etc.)
- Y-axis: Revenue amount
- Tooltip showing exact amounts
- Color: Accent color (#fd7e14) for line
- Area fill: Transparent accent color
- Uses Recharts `AreaChart` component

#### Section 4: Top Clients (List)
- List of top 5 clients by revenue
- Columns: Client Name, YTD Revenue, Invoice Count, Health Score
- Health score color-coded: Red (At Risk), Yellow (Fair), Green (Good), Teal (Excellent)
- Sortable by revenue
- Click to view client detail

#### Section 5: Financial Targets Progress
- Current FY targets displayed as cards
- Shows target value vs actual progress
- Progress bar (0-100%)
- Color-coded by achievement:
  - Red: <50%
  - Yellow: 50-80%
  - Green: 80-100%
  - Teal: >100% (exceeded)
- Link to targets page for details

#### Section 6: Collections Overview
- Scheduled invoices for next 30 days
- Retainer invoice generation status
- Outstanding amount by client
- Days to payment due summary
- Link to collections/pipeline page

---

## Mobile Responsive Behavior

**Mobile Layout (375px+):**
- KPI cards: Stack vertically (1 column)
- Charts: Full width, scrollable if needed
- Attention items: Single column
- Top clients: Simplified (client name + revenue only)
- Hide secondary columns and details

**Tablet Layout (768px+):**
- KPI cards: 2 columns
- Charts: 50% width side-by-side
- Top clients: Table with 4 columns
- Attention items: 2 columns

**Desktop Layout (1024px+):**
- KPI cards: Multiple columns (4-6)
- Charts: Full width or side-by-side
- Top clients: Full table
- Attention items: 3-4 columns
- All details visible

---

## Hooks & Data Fetching

**Hooks Used:**
- `useDashboardKPIs(period)` - Primary metrics
- `useAttentionItems()` - Alerts & notifications
- `useMonthlyRevenueTrend(12)` - Chart data
- `useTopClients(5)` - Client list
- `useTargets(fy)` - Target progress
- `useScheduledInvoices()` - Collections forecast
- `useAnalytics()` - Historical trends

**Data Fetching Strategy:**
- All queries use TanStack Query with caching
- Real-time KPIs: 5-minute cache, auto-refresh
- Charts: 15-minute cache
- Attention items: Real-time (no cache)
- Parallel queries for performance
- Error boundaries for individual sections

---

## Components Used

- `GlassCard` / `DarkCard` - Container styling
- `StatCard` - KPI card component
- `StatusBadge` - Status indicators
- `ProgressBar` - Progress visualization
- `Recharts` components:
  - `AreaChart` - Revenue trend
  - `BarChart` - Monthly breakdown (optional)
  - `PieChart` - Category breakdown (optional)
- `EmptyState` - When no data available
- `Skeleton` - Loading state
- `FloatingFAB` - Quick actions button
- `ConfirmDialog` - Action confirmations

---

## Quick Actions

**Floating Action Button (FAB):**
- Create Invoice
- Add Payment
- Create Project
- Add Expense
- Send Report

---

## Filters & Period Selectors

**Time Period Filter:**
- This Month
- Last Month
- Last 3 Months
- This Quarter
- This FY (Apr-Mar)
- All Time
- Custom date range (picker)

**Refresh Button:**
- Manual refresh of all KPIs
- Shows last-updated timestamp
- Auto-refresh every 5 minutes (optional)

---

## Performance Optimizations

- Lazy load charts (Recharts with dynamic import)
- Skeleton loading states
- Query caching with automatic invalidation
- Parallel data fetching (Promise.all)
- Image optimization for logos/avatars
- CSS media queries for responsive design
- Memoization of expensive calculations (useMemo)

---

## Error Handling

**Per-Section Error Boundaries:**
- KPI cards: Show "N/A" on error
- Charts: Show empty chart on error
- Lists: Show empty state on error
- Attention items: Show "No items" on error
- Toast notification for retry options

---

## Integrations

### Page Links
- Revenue card → `/invoices`
- Outstanding card → `/invoices?status=sent`
- Clients card → `/clients`
- Overdue card → `/invoices?status=overdue`
- MRR card → `/projects`
- Chart → `/analytics/pl`
- Top clients → `/clients/[id]`
- Targets → `/targets`
- Collections → `/pipeline`

### External Data Sources
- Invoices, payments, expenses, projects tables
- Analytical views (SQL aggregations)
- Real-time calculations for KPIs

---

## Type Definitions

```typescript
// KPI Metrics
interface DashboardKPIs {
  total_revenue: number;
  total_outstanding: number;
  total_clients: number;
  overdue_invoices: number;
  mrr: number;
  cash_in_this_month: number;
  cash_out_this_month: number;
  net_cash_flow: number;
  profit_margin: number;
}

// Attention item
interface AttentionItem {
  id: string;
  type: "overdue_invoice" | "pending_payment" | "expiring_contract" | "upcoming_due";
  client_name: string;
  amount: number;
  days_overdue?: number;
  urgency: "high" | "medium" | "low";
}

// Monthly trend
interface MonthData {
  month: string;
  revenue: number;
  expenses?: number;
  profit?: number;
  invoices: number;
}

// Client revenue
interface ClientRevenue {
  id: string;
  name: string;
  total_revenue: number;
  invoices_count: number;
  avg_payment_days: number;
  health_score: number;
}
```

---

## Last Updated

**Date:** 2026-03-05
**Status:** Phase 5 Complete
**Build:** 0 TypeScript errors

---

## Related Documentation
- `analytics-module.md` - Detailed analytics
- `invoicing-module.md` - Invoice data
- `payments-module.md` - Payment data
- `clients-module.md` - Client data
- `targets-module.md` - Goal tracking
