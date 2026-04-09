# WODO Ally - Pipeline Module Documentation

Complete reference guide for revenue pipeline, project forecasting, and collections management in WODO Ally.

---

## Database Models & Data Sources

### Tables Used
- **`projects`** - Project details, values, statuses, completion dates
- **`scheduled_invoices`** - Retainer invoice generation schedule
- **`invoices`** - Outstanding amounts
- **`invoice_payments`** - Received payments
- **`contracts`** - Contract dates and values

### Data Aggregations
- Revenue projection by project status stage
- MRR (Monthly Recurring Revenue) from retainers
- Collections forecast (when invoices expected to be paid)
- Project completion timeline
- Payment pipeline

---

## Core Hooks

### File: `src/lib/hooks/use-projects.ts` + `src/lib/hooks/use-analytics.ts`

#### 1. **useScheduledInvoices(startDate?, endDate?)**
Fetch retainer invoices scheduled for generation in date range.
```typescript
// Usage
const { data } = useScheduledInvoices("2026-03-01", "2026-06-30");

// Returns: ScheduledInvoice[]
// [
//   { id, project_id, scheduled_date, amount, frequency, status }
// ]
```
- Default: Next 90 days
- Type: Query (TanStack)
- Used for cash flow forecasting

#### 2. **useProjectsByStatus()**
Fetch projects grouped by status stage.
```typescript
// Usage
const { data } = useProjectsByStatus();

// Returns: Record<status, Project[]>
// {
//   onboarding: [...],
//   design_phase: [...],
//   development_phase: [...],
//   deployment_qa: [...],
//   active_execution: [...],
//   maintenance: [...],
//   completed: [...]
// }
```
- Groups for pipeline visualization
- Type: Query (TanStack)

#### 3. **usePipelineMetrics()**
Fetch aggregated pipeline metrics.
```typescript
// Usage
const { data: metrics } = usePipelineMetrics();

// Returns: PipelineMetrics
// {
//   total_pipeline_value: 500000,
//   active_projects: 5,
//   completed_projects_this_month: 2,
//   avg_project_value: 75000,
//   mrr: 45000,
//   expected_revenue_next_month: 120000
// }
```
- Type: Query (TanStack, 15-min cache)

#### 4. **useCollectionsForecast(days?)**
Forecast expected collections for next N days.
```typescript
// Usage
const { data } = useCollectionsForecast(90);

// Returns: CollectionItem[]
// [
//   { date: "2026-04-01", expected_amount: 50000, client_name },
//   ...
// ]
```
- Based on invoice due dates and payment history
- Type: Query (TanStack)

---

## Pipeline Features

### Revenue Pipeline View

**By Project Status:**
- **Onboarding**: New projects just started, % to first invoice
- **Design Phase**: Design work ongoing, 20% revenue expected
- **Development Phase**: Active development, 50% revenue expected
- **Deployment QA**: Testing & QA phase, 75% expected
- **Active Execution**: Full project delivery, 90% expected
- **Maintenance**: Post-delivery maintenance phase
- **Completed**: Project finished, 100% complete

**Visualization:**
- Cards or kanban columns per stage
- Show count of projects, total value
- Click to expand and see project details
- Drag-and-drop to update status (optional)

### MRR Tracking
**Monthly Recurring Revenue Calculation:**
```
MRR = SUM(projects where engagement_type='retainer' AND status='active_execution')
    = SUM(retainer_amount × 12 / billing_cycle_months)
```

- Monthly: retainer_amount
- Quarterly: retainer_amount / 3
- Annual: retainer_amount / 12
- Churn tracking: MRR lost from terminations
- Growth tracking: MRR gained from new retainers

### Collections Forecast

**Expected Collections:**
```
For each invoice:
  If status = "paid": skip (already collected)
  If status = "overdue": show as immediate
  If status = "sent" or "partially_paid":
    expected_date = due_date (from invoice.due_date field)
    expected_amount = balance_due
```

**Visualization:**
- Timeline showing when money expected
- Stacked by client (click to see details)
- Compared to monthly targets
- Alerts for high-risk collections (overdue)

### Project Completion Timeline

**Waterfall Chart:**
- X-axis: Timeline (months forward)
- Y-axis: Cumulative revenue
- Shows expected revenue on each completion date
- Stacked bars for each project
- Hoverable for details

### Stage Distribution

**Pie/Donut Chart:**
- Shows % of pipeline in each stage
- Colors by stage
- Weighted by project value
- Insights: Which stages have bottlenecks

---

## Pages

### File: `src/app/(dashboard)/pipeline/page.tsx`

**Features:**

#### Section 1: Pipeline Metrics (Top Cards)
- Total Pipeline Value
- Number of Active Projects
- Average Project Value
- Monthly Recurring Revenue (MRR)
- Expected Revenue This Month
- Expected Revenue Next Month

#### Section 2: Revenue by Stage (Kanban/Cards)
- Columns or cards for each project status
- Show project count + total value
- List projects in stage
- Progress bar per project
- Days remaining counter
- Quick actions: Update status, view details

#### Section 3: Collections Forecast (Timeline)
- Next 30/60/90 days collections
- Stacked bars by client
- Total expected each month
- Comparison to targets
- Overdue highlight
- Drill-down by client

#### Section 4: Project Completion Timeline (Gantt)
- Horizontal bars for each project
- Start date → Projected/Actual completion
- On-time indicator (green/red)
- Project name + value on hover
- Milestone markers
- Scroll horizontally for full timeline

#### Section 5: Stage Distribution (Donut Chart)
- Pie/donut chart
- Slices for each status
- Colored by stage
- Size by value %
- Legend with counts

**Hooks Used:**
- `useScheduledInvoices()` - Scheduled collections
- `useProjectsByStatus()` - Grouped projects
- `usePipelineMetrics()` - Summary stats
- `useCollectionsForecast()` - Collections timeline
- `useAnalytics()` - Chart data

**Components:**
- `GlassCard` / `DarkCard` - Containers
- `StatCard` - Metric cards
- `ProgressBar` - Progress visualization
- `Recharts` components:
  - `BarChart` - Collections forecast
  - `PieChart` - Stage distribution
  - `ComposedChart` - Waterfall
- `Skeleton` - Loading states

---

## Filters & Interactivity

**Period Selector:**
- This Month
- Next Month
- Next Quarter
- Next 90 Days
- Custom range (date picker)

**Stage Filter:**
- Show all stages or select specific ones
- Hide completed projects (checkbox)

**Project Type Filter:**
- All projects
- One-time only
- Retainer only

**Client Filter:**
- Show all or select specific client

**Refresh Button:**
- Manual refresh (recalculate projections)
- Shows last-updated timestamp

---

## Performance Optimizations

- Lazy load charts (dynamic import)
- Query caching (15 min TTL)
- Memoize expensive calculations
- Skeleton loading for sections
- Virtual scrolling for long project lists (optional)
- CSS media queries for responsive layout

---

## Mobile Responsive

**Mobile (375px+):**
- KPI cards: Stack vertically
- Charts: Full width, scrollable
- Timeline: Horizontal scroll
- Kanban: Single column (status tabs)

**Tablet (768px+):**
- KPI cards: 2-3 columns
- Charts: Side-by-side
- Timeline: Full width, scrollable

**Desktop (1024px+):**
- KPI cards: 5-6 columns
- All charts visible
- Full kanban columns
- Timeline visible

---

## Type Definitions

```typescript
// Scheduled invoice
interface ScheduledInvoice {
  id: string;
  project_id: string;
  scheduled_date: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "annual";
  status: "scheduled" | "generated" | "invoiced";
}

// Pipeline metrics
interface PipelineMetrics {
  total_pipeline_value: number;
  active_projects: number;
  completed_projects_this_month: number;
  avg_project_value: number;
  mrr: number;
  expected_revenue_next_month: number;
  collections_overdue: number;
}

// Collections item
interface CollectionItem {
  date: string;
  expected_amount: number;
  client_name: string;
  invoice_count: number;
  is_overdue?: boolean;
}

// Stage value summary
interface StageValueSummary {
  status: ProjectStatus;
  total_value: number;
  project_count: number;
  pct_of_pipeline: number;
}
```

---

## Last Updated

**Date:** 2026-03-05
**Status:** Phase 5 Complete
**Build:** 0 TypeScript errors

---

## Related Documentation
- `projects-module.md` - Project data
- `invoicing-module.md` - Invoice scheduling
- `analytics-module.md` - Detailed analytics
- `targets-module.md` - Revenue targets
