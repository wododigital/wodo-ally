# WODO Ally - Targets Module Documentation (Financial Targets)

Complete reference guide for financial goal setting, progress tracking, and target management in WODO Ally.

---

## Database Models

### Tables
- **`financial_targets`** - Target goals with period and progress
- **`invoices`** - Revenue data source
- **`invoice_payments`** - Collections data source
- **`transactions`** - Expense data source
- **`projects`** - Retainer MRR source

### Target Types
- `revenue` - Total revenue target
- `profit` - Net profit target
- `margin` - Profit margin % target
- `cash_flow` - Net cash flow target
- `collections` - Payment collections target
- `mrr` - Monthly recurring revenue target

### Period Types
- `monthly` - Calendar month (1st - last day)
- `quarterly` - Quarter (Q1-Q4, Apr-Mar FY)
- `annual` - Financial year (Apr 1 - Mar 31)

### Indian Financial Year (FY)
- FY format: "FY2025-26" (Apr 2025 - Mar 2026)
- Quarters: Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)

---

## Core Hooks

### File: `src/lib/hooks/use-targets.ts`

#### 1. **useTargets(fy?)**
Fetch all targets for current or specified financial year.
```typescript
// Usage
const { data: targets } = useTargets("FY2025-26");

// Returns: Target[]
// [
//   { id, type, period, target_value, progress_value, progress_pct, currency, fy }
// ]
```
- Type: Query (TanStack)
- Default: Current FY (Apr-Mar based on today's date)

#### 2. **useTarget(id)**
Fetch single target with live progress calculation.
```typescript
// Usage
const { data: target } = useTarget("target-123");

// Returns: Target with live_progress, live_progress_pct
```
- Recalculates progress from latest data
- Type: Query (TanStack)

#### 3. **useCreateTarget()**
Create new financial target.
```typescript
// Usage
const createTarget = useCreateTarget();

await createTarget.mutateAsync({
  type: "revenue",
  period: "quarterly",
  quarter: "Q1",
  fy: "FY2025-26",
  target_value: 500000,
  currency: "INR",
  notes: "Q1 revenue target"
});
```
- Auto-toast on success/error
- Invalidates target queries

#### 4. **useUpdateTarget()**
Update target value or notes.
```typescript
// Usage
const updateTarget = useUpdateTarget();

await updateTarget.mutateAsync({
  id: "target-123",
  data: {
    target_value: 550000,
    notes: "Updated target based on Q1 actual"
  }
});
```
- Invalidates queries
- Auto-toast

#### 5. **useDeleteTarget()**
Delete target.
```typescript
// Usage
const deleteTarget = useDeleteTarget();

await deleteTarget.mutateAsync("target-123");
```
- Auto-toast

#### 6. **useRefreshTargetProgress(id)**
Recalculate target progress from latest data.
```typescript
// Usage
const refresh = useRefreshTargetProgress("target-123");

await refresh.mutateAsync();

// Recalculates: invoices, payments, expenses for period
// Updates progress_pct and progress_value
```
- Called manually for real-time updates
- Or auto-called on hourly basis

#### 7. **useTargetsByType(type, fy?)**
Fetch targets filtered by type.
```typescript
// Usage
const { data } = useTargetsByType("revenue", "FY2025-26");

// Returns: Target[] (filtered to revenue type)
```
- Type: Query (TanStack)

---

## Target Features

### Progress Calculation

**Revenue Target:**
```
progress = SUM(invoices.total_amount) where invoice_date in period
```

**Collections Target:**
```
progress = SUM(invoice_payments.amount) where payment_date in period
```

**Expense Target:**
```
progress = SUM(transactions.amount) where type='expense' AND date in period
```

**Profit Target:**
```
progress = (total_revenue - total_expenses) for period
```

**Margin Target:**
```
progress_pct = (profit / revenue) × 100
```

**MRR Target:**
```
progress = SUM(projects.retainer_amount) where status='active_execution'
```

### Period Boundaries

**Monthly:**
- 1st - Last day of calendar month
- Current month: Jan 1 - Jan 31, Feb 1 - Feb 28, etc.

**Quarterly (Indian FY):**
- Q1: Apr 1 - Jun 30
- Q2: Jul 1 - Sep 30
- Q3: Oct 1 - Dec 31
- Q4: Jan 1 - Mar 31

**Annual (Indian FY):**
- Apr 1, Year1 - Mar 31, Year2
- Example: Apr 1, 2025 - Mar 31, 2026 = FY2025-26

### Visual Progress Indicators
- Progress bar (0-100%)
- Percentage of target achieved
- Actual vs Target in KPI cards
- Color coding:
  - Red: < 50% of target
  - Yellow: 50-80% of target
  - Green: 80%+ of target
  - Teal: 100%+ of target (exceeded)

---

## Pages

### File: `src/app/(dashboard)/targets/page.tsx`

**Features:**
- Current FY selector (dropdown)
- Target cards with:
  - Target type (Revenue, Profit, MRR, etc.)
  - Target value with currency
  - Current progress value
  - Progress percentage & bar
  - Variance (under/over target)
  - Last updated timestamp
- Add Target button (form modal)
- Edit/Delete actions per target
- Monthly breakdown (if applicable)
- Refresh Progress button (manual update)
- Target history chart (actual vs target over time)

**Hooks Used:**
- `useTargets(fy)` - Fetch for selected FY
- `useCreateTarget()` - Add new
- `useUpdateTarget()` - Edit
- `useDeleteTarget()` - Delete
- `useRefreshTargetProgress(id)` - Refresh progress
- `useAnalytics()` - Chart data

**Components:**
- `GlassCard` / `DarkCard` - Container
- `ProgressBar` - Visual progress
- `StatCard` - KPI display
- `Recharts` - Actual vs Target chart
- `Modal` - Create/Edit form

---

## Form Fields

### Create/Edit Target Form
- `type` (required, dropdown) - Revenue, Profit, Margin, Cash Flow, Collections, MRR
- `period` (required, dropdown) - Monthly, Quarterly, Annual
- `fy` (for quarterly/annual, dropdown) - Financial year (FY2025-26)
- `quarter` (for quarterly, dropdown) - Q1, Q2, Q3, Q4
- `month` (for monthly, dropdown) - Jan-Dec
- `target_value` (required, number) - Target amount
- `currency` (required, dropdown) - INR, USD, AED, GBP, EUR
- `notes` (optional, textarea) - Target notes/context

### Validation Rules
- `type` must be valid enum value
- `period` required
- `target_value` required, > 0
- `currency` must be valid
- `fy` format: "FYXXXX-XX" (e.g., "FY2025-26")
- Period dates must be valid

---

## Special Features

### Real-Time Progress Calculation
- Progress calculated on-demand (useTarget)
- Or auto-refreshed hourly
- Queries latest: invoices, payments, expenses, projects
- Instant feedback without waiting for batch jobs

### MRR (Monthly Recurring Revenue)
- Tracks all active retainer projects
- Sum of monthly equivalent: `retainer_amount × (12 / billing_cycle_months)`
- Updated when projects' retainer terms change
- Used for revenue forecasting

### Target Variance Analysis
- Tracks how much over/under target
- Calculates % variance from target
- Visual indicator: negative (red), neutral (yellow), positive (green)
- Trend analysis: improving vs declining towards target

### Multiple Targets Per Period
- Can set revenue, profit, margin, and MRR targets simultaneously
- Each tracked independently
- Dashboard shows all at once
- Quick comparison of progress across metrics

### Historical Tracking
- All target versions tracked with timestamps
- Can view past targets (prior FYs)
- Analyze consistency of goal-setting
- Learn from historical targets vs actuals

---

## Integrations

### Data Sources
- **Invoices** - Revenue totals
- **Payments** - Collections tracking
- **Expenses/Transactions** - Expense data
- **Projects** - MRR from retainers
- **Analytics** - Dashboard KPI display

### Dashboard Integration
- KPI cards show current progress vs target
- Color coded by achievement %
- Links to targets page for details
- Refresh on dashboard load

### Reports
- Target vs Actual comparison in investor reports
- Historical achievement rates
- Target setting trends

---

## Type Definitions

```typescript
// Database
type Target = Database["public"]["Tables"]["financial_targets"]["Row"];

// With calculated progress
type TargetWithProgress = Target & {
  live_progress_value: number;
  live_progress_pct: number;
  variance: number;
  status: "under" | "on_track" | "exceeded";
};

// Period info
interface TargetPeriod {
  fy: string;
  quarter?: "Q1" | "Q2" | "Q3" | "Q4";
  month?: number;
  start_date: string;
  end_date: string;
}
```

---

## API Routes (Planned)

- `GET /api/targets` - List for current FY
- `GET /api/targets/[id]` - Fetch single
- `POST /api/targets` - Create new
- `PATCH /api/targets/[id]` - Update
- `DELETE /api/targets/[id]` - Delete
- `POST /api/targets/[id]/refresh` - Recalculate progress
- `GET /api/targets/by-type/[type]` - Filter by type
- `GET /api/targets/history/[id]` - Historical versions

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Total Hooks | 7 |
| Target Types | 6 |
| Period Types | 3 (Monthly, Quarterly, Annual) |
| Supported Currencies | 5 |
| Typical Targets/Year | 4-12 |

---

## Last Updated

**Date:** 2026-03-05
**Status:** Phase 5 Complete
**Build:** 0 TypeScript errors

---

## Related Documentation
- `analytics-module.md` - Real-time metrics data
- `invoicing-module.md` - Revenue source
- `payments-module.md` - Collections source
- `expenses-module.md` - Expense source
- `dashboard-module.md` - KPI display
