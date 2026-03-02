# 11 - Investor Reports

## Auto-Generation Trigger

In the first week of each month, the system prompts: "Generate Investor Report for {Previous Month}?"
This can also be triggered manually from `/reports`.

## Report Data Collection

When generating, the system auto-collects from the database:

```typescript
interface InvestorReportData {
  // Period
  month: string; // "February 2026"
  financialYear: string; // "2025-26"

  // Revenue Metrics
  totalRevenue: number; // INR received this month
  previousMonthRevenue: number;
  revenueGrowthPercent: number;
  revenueByService: { service: string; amount: number }[];

  // MRR
  currentMRR: number; // Sum of active retainer amounts
  previousMRR: number;
  mrrGrowthPercent: number;
  newRetainerRevenue: number; // New retainers added this month
  churnedRevenue: number; // Lost retainers this month

  // Clients
  totalActiveClients: number;
  newClientsThisMonth: number;
  churnedClientsThisMonth: number;
  clientsByRegion: { region: string; count: number }[];

  // Projects
  activeProjects: number;
  completedThisMonth: number;
  newProjectsThisMonth: number;

  // Financial
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashBalance: number; // Latest bank statement closing balance

  // Pipeline
  projectedRevenueNext3Months: number; // From active retainers + known upcoming payments
  outstandingReceivables: number;
}
```

## Report Dashboard View (`/reports`)

### Report List
- Table: Month/Year, Status (Draft/Generated/Sent), Generated Date, Actions
- "Generate Report" button for current/selected month

### Report Detail (`/reports/[id]`)

Visual dashboard view of all metrics with:

**Header Section**
- Report title: "WODO Ally - Investor Update: {Month Year}"
- Period badge

**KPI Grid (4 cards)**
- Monthly Revenue with growth %
- MRR with growth %
- New Client Signups
- Net Profit Margin

**Charts Section**
- Revenue Trend (6-month line chart)
- MRR Growth (6-month bar chart)
- Revenue by Service (pie chart)
- Client Distribution by Region (donut)

**Tables Section**
- New Clients This Month (name, service, value)
- Active Retainer Clients (name, MRR, months active)
- Churned Clients (if any)

**Financial Summary**
- Simplified P&L for the month
- Cash position

**Outlook Section**
- Projected revenue for next 3 months
- Pipeline highlights (manually editable text field)

### Actions
- "Generate PDF" - creates downloadable PDF version
- "Send to Investor" - email with PDF attachment
- "Edit Notes" - add manual commentary/outlook text before sending

## PDF Template

Clean, professional PDF report matching WODO branding:
- WODO logo at top
- Title: "Monthly Investor Report"
- Subtitle: "{Month Year}"
- Sections with KPIs, charts (rendered as static images), and tables
- Footer with confidentiality note

Use @react-pdf/renderer. For charts in PDF, render Recharts to canvas/SVG, then embed as images.

## Revenue Forecasting

Calculate projected revenue for next 3-6 months:

```
Month N+1 Revenue = Active Retainer MRR + Known one-time payments (from draft invoices/pipeline)
Month N+2 Revenue = Active Retainer MRR * retention_rate + pipeline
Month N+3 Revenue = Active Retainer MRR * retention_rate^2 + pipeline
```

Default retention_rate = 0.95 (95% monthly retention). Configurable in settings.
