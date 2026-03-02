# 10 - Analytics Dashboard

## Analytics Home (`/analytics`)

### Period Selector (top of page)
- Quick select: This Month, Last Month, This Quarter, This FY, Custom Range
- Financial Year selector: 2025-26, 2024-25, etc.
- All data updates based on selected period

### KPI Row (4 stat cards)
1. **Total Revenue**: Sum of all received payments (INR)
2. **Total Expenses**: Sum of all debit transactions (categorized)
3. **Net Profit**: Revenue - Expenses
4. **Profit Margin**: (Net Profit / Revenue) * 100

Each card shows: value, period-over-period change (%), trend arrow

### Revenue Analytics Section

**Revenue by Service Type** (Recharts bar chart)
- Group invoices by project_type
- Bars: SEO, Web Development, Branding, Google Ads, GMB, Other
- Shows which services contribute most revenue

**Revenue by Client Region** (Recharts pie/donut chart)
- India vs USA vs UAE vs UK
- Shows geographic revenue distribution

**Monthly Revenue Trend** (Recharts area chart)
- 12-month rolling view
- Line: Total Revenue, Second line: Total Expenses
- Shaded area between = profit zone

**MRR Tracking** (for retainer clients)
- Current MRR = sum of all active retainer monthly amounts (in INR)
- MRR trend over last 6-12 months
- Show new retainer additions and churns

### Client Analytics

**Client Revenue Ranking** (horizontal bar chart)
- Top 10 clients by revenue
- Show each client's total invoiced, paid, outstanding

**Payment Timeliness Distribution** (donut chart)
- On Time, Late (1-15 days), Very Late (15-30 days), Severely Late (30+)
- Based on invoice due_date vs paid_at

**Client Health Overview** (grid/heatmap)
- All active clients with health score color indicators
- Click to drill into client detail

### Project Analytics

**Completion Rate** 
- Projects completed on time vs delayed
- Average delay in days for delayed projects

**Revenue per Project Type** (comparison)
- Average project value by type
- Average time to complete by type
- Revenue concentration (are you too dependent on one type?)

## P&L Statement (`/analytics/pl`)

Simplified P&L for the business owner (not accountant format):

```
PROFIT & LOSS STATEMENT
Period: {selected period}

REVENUE
  Client Payments (by type)
    - GST Invoices:           Rs. X,XX,XXX
    - International Invoices: Rs. X,XX,XXX
    - Non-GST Invoices:       Rs. X,XX,XXX
  Other Income:               Rs. X,XXX
  ──────────────────────────────────────
  TOTAL REVENUE:              Rs. X,XX,XXX

EXPENSES
  Salaries:                   Rs. X,XX,XXX
  Software/SaaS:              Rs. XX,XXX
  Rent:                       Rs. XX,XXX
  Professional Fees:          Rs. XX,XXX
  Commissions:                Rs. XX,XXX
  Freelancer/Vendor:          Rs. XX,XXX
  GST Paid:                   Rs. XX,XXX
  Loan/EMI:                   Rs. XX,XXX
  Office Expenses:            Rs. XX,XXX
  Marketing:                  Rs. XX,XXX
  Travel:                     Rs. XX,XXX
  Director Salary:            Rs. XX,XXX
  Miscellaneous:              Rs. XX,XXX
  ──────────────────────────────────────
  TOTAL EXPENSES:             Rs. X,XX,XXX

  ══════════════════════════════════════
  NET PROFIT/LOSS:            Rs. X,XX,XXX
  PROFIT MARGIN:              XX.X%
```

### Data Sources for P&L
- Revenue: Sum of invoice_payments.amount_received_inr grouped by invoice type, filtered by payment_date
- Expenses: Sum of transactions.debit grouped by expense_category, filtered by transaction_date
- Only include reviewed/categorized transactions

### Visual P&L
- Show as a glass card with clear sections
- Revenue items in green tones
- Expense items in neutral tones
- Net profit highlighted: green if positive, red if negative
- Include mini bar chart showing expense breakdown

## Balance Sheet (Simplified)

```
BALANCE SHEET
As of: {date}

ASSETS
  Bank Balance (from latest statement):  Rs. X,XX,XXX
  Accounts Receivable (outstanding):     Rs. X,XX,XXX
  TDS Receivable:                        Rs. XX,XXX
  ──────────────────────────────────────
  TOTAL ASSETS:                          Rs. X,XX,XXX

LIABILITIES
  (Manual entries or from expense data)
  Outstanding Loans:                     Rs. X,XX,XXX
  Pending GST:                           Rs. XX,XXX
  ──────────────────────────────────────
  TOTAL LIABILITIES:                     Rs. X,XX,XXX

  ══════════════════════════════════════
  NET WORTH:                             Rs. X,XX,XXX
```

Note: This is a simplified management view, not a full accounting balance sheet. The accountant handles the formal one. This is for the owner to see where money stands.

## Export Options

- "Export as PDF" button on P&L and Balance Sheet pages
- "Download CSV" for raw data tables
- Date range selector for all exports
