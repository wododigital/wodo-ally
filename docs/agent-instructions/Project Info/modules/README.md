# WODO Ally - Modules Documentation

Complete reference guides for all major functional modules in WODO Ally.

---

## Module Structure

```
Project Info/
└── modules/
    ├── invoicing-module.md         # Invoice management system
    ├── clients-module.md           # Client management & AR
    ├── payments-module.md          # Payment recording & tracking
    └── analytics/
        └── analytics-module.md     # Analytics dashboards & views
```

---

## Module Index

### 📋 **Invoicing Module** (`invoicing-module.md`)
Complete guide for invoice creation, management, and workflow.

**Covers:**
- 13 core hooks (useInvoices, useCreateInvoice, useFinalizeInvoice, etc.)
- 4 invoice pages (list, detail, edit, analytics)
- Invoice types (GST, Non-GST, International, Proforma)
- Line items, auto-numbering, PDF generation
- Payment recording integration
- Retainer automation
- 480+ line reference documentation

**Key Features:**
- Draft → Sent → Paid/Overdue/Partially Paid workflow
- Multi-currency support (INR, USD, AED, GBP)
- Sequential invoice numbering per type
- Proforma conversion to real invoices
- TDS tracking

---

### 👥 **Clients Module** (`clients-module.md`)
Complete guide for client management, health scoring, and AR.

**Covers:**
- Client table with 28 columns
- Client contacts management
- TDS certificate uploads & storage
- Health score calculation (0-100)
- 8 core hooks (useClients, useCreateClient, useClientStats, etc.)
- 4 client pages (grid, detail, edit, analytics)
- Status workflow (Active → Inactive → Churned → Closed)
- 540+ line reference documentation

**Key Features:**
- Multi-region support (India, USA, UAE, UK, Other)
- Multi-currency (INR, USD, AED, GBP, EUR)
- Client contacts with roles (primary, billing)
- Health scoring based on payment behavior
- On-time payment tracking
- TDS certificate management
- Contract status integration

---

### 💳 **Payments Module** (`payments-module.md`)
Complete guide for payment recording, tracking, and collections.

**Covers:**
- invoice_payments table (18 columns)
- Payment methods (Bank Transfer, UPI, Skydo, Other)
- TDS deduction management
- Skydo forex fees + processing charges
- useRecordPayment() hook
- usePaymentsList() hook
- `/payments` page with KPIs
- 380+ line reference documentation

**Key Features:**
- Multi-currency support with automatic conversion
- TDS section tracking (194C, 194J, etc.)
- Skydo international transfer integration
- Automatic invoice status updates on payment
- Collections tracking (overdue, outstanding, TDS)
- Payment method labels & icons
- Auto-calculated balance due

---

### 📊 **Analytics Module** (`analytics/analytics-module.md`)
Complete guide for analytics dashboards, views, and KPIs.

**Covers:**
- 8 SQL views (monthly_pl_view, revenue_by_client, etc.)
- 10 core hooks (useMonthlyPL, useDashboardKPIs, etc.)
- 7 analytics pages (main, P&L, expenses, clients, invoices, projects, balance)
- Health score calculation (0-100 based on payment behavior)
- KPI calculations (MRR, outstanding, overdue, collections)
- Date filtering (All-time, 30/90 days, FY, custom)
- 580+ line reference documentation

**Key Features:**
- Real-time P&L (revenue vs expenses per month)
- Cash flow analysis (inflows vs outflows)
- Client health scoring (risk assessment)
- Expense breakdown by category
- Revenue by service/client/project type
- Balance sheet projection
- Indian FY support (Apr 1 - Mar 31)
- Recharts visualizations (bar, line, pie, radar, area)

---

## Quick Navigation

**By Feature:**

| Feature | Module |
|---------|--------|
| Create/Edit Invoices | Invoicing |
| Track Client Health | Clients |
| Record Payments | Payments |
| View P&L Reports | Analytics |
| Analyze Cash Flow | Analytics |
| Track Collections | Payments & Clients |
| Manage Client Contacts | Clients |
| Generate Invoice Numbers | Invoicing |
| Calculate KPIs | Analytics |
| TDS Management | Clients & Payments |

**By Page:**

| Page | Module |
|------|--------|
| /invoices | Invoicing |
| /invoices/[id] | Invoicing |
| /invoices/[id]/edit | Invoicing |
| /analytics/invoices | Invoicing + Analytics |
| /clients | Clients |
| /clients/[id] | Clients |
| /clients/[id]/edit | Clients |
| /analytics/clients | Clients + Analytics |
| /payments | Payments + Analytics |
| /analytics | Analytics |
| /analytics/pl | Analytics |
| /analytics/expenses | Analytics |
| /analytics/balance | Analytics |

---

## Hook Organization

### Invoicing Hooks (13 total)
- useInvoices, useInvoice, useCreateInvoice
- useUpdateInvoice, useDeleteInvoice, useFinalizeInvoice
- useGenerateRetainerInvoices, useScheduledInvoices
- useConvertProformaToInvoice, useRecordPayment
- useInvoicePayments, useCollectionsInvoices

### Client Hooks (8 total)
- useClients, useClient, useClientStats
- useCreateClient, useUpdateClient
- useCloseClient, useReactivateClient, useDeleteClient

### Payment Hooks (2 total)
- useRecordPayment, usePaymentsList

### Analytics Hooks (10 total)
- useMonthlyPL, useRevenueByClient, useExpensesByCategory
- useInvoiceStatusSummary, useClientHealthScores
- useProjectRevenueByType, useCashFlowMonthly
- useRevenueByService, useDashboardKPIs, usePaymentsList

---

## Database Views

| View | Purpose | Module |
|------|---------|--------|
| monthly_pl_view | Monthly revenue vs expenses | Analytics |
| revenue_by_client_view | Client revenue metrics | Clients/Analytics |
| expenses_by_category_view | Expense breakdown | Analytics |
| invoice_status_summary | Invoice distribution | Invoicing/Analytics |
| client_health_scores | Client payment behavior | Clients/Analytics |
| project_revenue_by_type | Revenue by engagement type | Analytics |
| cash_flow_monthly | Monthly cash position | Analytics |
| revenue_by_service_view | Service revenue contribution | Analytics |

---

## Key Calculations

### Invoice Balance
```
balance_due = MAX(0, total_amount - total_received)
```

### Client Health Score
```
health_score = (on_time_pct × 40% + (100 - avg_days/30) × 30% + collection_rate × 30%)
Scale: 0-40 (At Risk) | 40-60 (Fair) | 60-80 (Good) | 80-100 (Excellent)
```

### Monthly Recurring Revenue (MRR)
```
mrr = SUM(retainer_amount) from active retainer projects
```

### Profit Margin
```
margin = (net_profit / total_revenue) × 100
```

---

## File Locations

```
src/
├── app/(dashboard)/
│   ├── invoices/
│   │   ├── page.tsx (list)
│   │   └── [id]/
│   │       ├── page.tsx (detail)
│   │       └── edit/page.tsx
│   ├── clients/
│   │   ├── page.tsx (grid)
│   │   └── [id]/
│   │       ├── page.tsx (detail)
│   │       └── edit/page.tsx
│   ├── payments/
│   │   └── page.tsx
│   └── analytics/
│       ├── page.tsx (main)
│       ├── pl/page.tsx
│       ├── expenses/page.tsx
│       ├── clients/page.tsx
│       ├── invoices/page.tsx
│       ├── projects/page.tsx
│       └── balance/page.tsx
│
├── lib/hooks/
│   ├── use-invoices.ts (13 hooks)
│   ├── use-clients.ts (8 hooks)
│   └── use-analytics.ts (10 hooks)
│
├── components/shared/
│   ├── new-invoice-modal.tsx
│   └── add-project-modal.tsx
│
└── types/
    └── index.ts (all TypeScript types)
```

---

## Integration Map

```
Invoices
├── Payments (record payment against invoice)
├── Clients (invoice created for client)
├── Projects (invoice linked to project)
├── Services (line items reference services)
└── Analytics (invoice metrics in dashboards)

Clients
├── Invoices (invoices created for client)
├── Payments (payment behavior metrics)
├── Projects (projects owned by client)
├── Contacts (team members at client)
└── Analytics (health scores, revenue tracking)

Payments
├── Invoices (payments against invoices)
├── Clients (payment behavior for client health)
└── Analytics (revenue, cash flow, collections)

Analytics
├── Invoices (invoice data source)
├── Payments (payment data source)
├── Clients (client health data)
├── Projects (project revenue data)
└── Services (service revenue data)
```

---

## Development Workflow

### Adding a New Feature

1. **Check Module Docs** - Review relevant module documentation
2. **Identify Hooks** - Find existing hooks that fetch required data
3. **Create/Modify Hooks** - Add hooks in `src/lib/hooks/` if needed
4. **Create Pages/Components** - Build UI in `src/app/` or `src/components/`
5. **Update Types** - Add TypeScript types in `src/types/`
6. **Database Changes** - Modify schema or views in `supabase/migrations/`
7. **Test** - Verify against module specs

### Example: Adding "Payment Reminders" Feature

1. Check **Payments Module** - understand current payment tracking
2. Check **Clients Module** - understand collection workflow
3. Create hook: `useOverdueInvoices()` (fetch unpaid, overdue invoices)
4. Create page: `/payments/overdue` or add tab to `/payments`
5. Add types: `OverdueInvoice`, `ReminderPreferences`
6. Database: Add `reminder_sent_at` column to invoices
7. Test: Verify overdue calculation, email integration

---

## Key Statistics

| Module | Hooks | Pages | Views | LOC |
|--------|-------|-------|-------|-----|
| Invoicing | 13 | 4 | 1 | 480+ |
| Clients | 8 | 4 | 2 | 540+ |
| Payments | 2 | 1 | 1 | 380+ |
| Analytics | 10 | 7 | 8 | 580+ |
| **TOTAL** | **33** | **16** | **12** | **1,980+** |

---

## Related Documents

- `docs/tasks.md` - Feature roadmap & open tasks
- `CLAUDE.md` - Project instructions & constraints
- `MEMORY.md` - Project memory & decisions
- `SECURITY_AUDIT.md` - Security findings & fixes

---

## Last Updated

**Date:** 2026-03-04
**Status:** Phase 5 Complete (Polish + Deploy)
**Build:** 0 TypeScript errors, 0 Next.js errors

---

**Questions?** Refer to specific module docs above or check main MEMORY.md for project context.
