# PROJECT-INFO.md - Living Document

## IMPORTANT: Update this file after completing each major module or phase milestone.

---

## Project: WODO Ally
**Type**: Internal SaaS - Accounting & Financial Management Platform
**Owner**: WODO Digital Private Limited
**Started**: March 2026

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Supabase (PostgreSQL, Auth, Storage)
- Tailwind CSS + shadcn/ui
- TanStack Query + Zustand
- @react-pdf/renderer (invoices, contracts, reports)
- SheetJS (bank statement parsing)
- Recharts (charts)
- Nodemailer + Microsoft 365 SMTP (email)
- Sentry (error tracking)
- Deployed on Railway

## Current Status
- [x] Phase 1: Foundation & Design System
- [x] Phase 2: Core Pages (UI Only)
- [x] Phase 3: Core Backend Logic
- [x] Phase 4: Advanced Features
- [x] Phase 5: Polish & Deploy

## Completed Modules
(Update as modules are completed)

| Module | Status | Date | Notes |
|--------|--------|------|-------|
| Project Setup | Complete | 2026-03-03 | Next.js 14, Tailwind, Supabase configured |
| Design System | Complete | 2026-03-03 | GlassCard, StatCard, StatusBadge, CurrencyDisplay, PageHeader, EmptyState, LoadingSkeleton |
| Layout & Auth | Complete | 2026-03-03 | TopNavV2 dark pill nav, dashboard layout, login page with Supabase auth |
| Database Schema | Complete | 2026-03-03 | supabase/migrations/001_schema.sql + seed.sql |
| Dashboard UI | Complete | 2026-03-03 | KPI cards, attention items, targets, recent payments |
| Clients UI | Complete | 2026-03-03 | List (search/filter/grid), detail (4 tabs), new form, edit form |
| Invoices UI | Complete | 2026-03-03 | List (tabs/search/table), new form (line items, real-time totals), detail (payment sidebar + record modal) |
| Payments UI | Complete | 2026-03-03 | Stats, payment list with TDS/Skydo callouts, overdue sidebar, monthly summary |
| Expenses UI | Complete | 2026-03-03 | Category breakdown, transaction list, bank statement upload with drag/drop |
| Analytics UI | Complete | 2026-03-03 | Recharts area/pie/bar charts, P&L table |
| Projects UI | Complete | 2026-03-03 | Search, engagement filter, list view |
| Reports UI | Complete | 2026-03-03 | Investor reports list with generate/send/resend actions |
| Contracts UI | Complete | 2026-03-03 | Search, status filter dropdown, contract cards |
| Targets UI | Complete | 2026-03-03 | Progress cards with bars, inline add form |
| Settings UI | Complete | 2026-03-03 | 5 tabs: Company, Bank Details, Invoice settings, Users, Notifications |
| Client CRUD | Complete | 2026-03-03 | use-clients.ts - full CRUD, close/reactivate, stats |
| Invoice Engine | Complete | 2026-03-03 | use-invoices.ts - create/finalize/number gen/retainer auto-draft |
| PDF Generation | Complete | 2026-03-03 | invoice-pdf.tsx (4 types), contract-pdf.tsx, report-pdf.tsx |
| Payment Logic | Complete | 2026-03-03 | useRecordPayment - auto-recalculates balance, updates status |
| Expense Parser | Complete | 2026-03-03 | bank-statement.ts + auto-categorize.ts + use-transactions.ts |
| Pipeline Backend | Complete | 2026-03-03 | useScheduledInvoices, useCollectionsInvoices wired in pipeline |
| Analytics Queries | Complete | 2026-03-03 | use-analytics.ts (10 hooks) - all 7 SQL views + dashboard KPIs + payments |
| Services Catalogue | Complete | 2026-03-03 | use-services.ts - CRUD; invoice line items wired to real services |
| Investor Reports | Complete | 2026-03-03 | use-reports.ts - data collection, PDF gen, email send |
| Contract Gen | Complete | 2026-03-03 | use-contracts.ts + contract-pdf.tsx - CRUD, PDF, status lifecycle |
| Email System | Complete | 2026-03-03 | email/client.ts + templates.ts + /api/email/send (Microsoft 365 SMTP) |
| Financial Targets | Complete | 2026-03-03 | use-targets.ts - CRUD + useRefreshTargetProgress (live calculations) |
| Dashboard KPIs | Complete | 2026-03-03 | useDashboardKPIs - real revenue/outstanding/clients/overdue/MRR |
| Payments Page | Complete | 2026-03-03 | usePaymentsList - wired to real invoice_payments table |
| UX Polish | Complete | 2026-03-03 | ConfirmDialog component; destructive action dialogs on contracts/targets/settings/reports; Zod+RHF on clients/new and targets form |
| Mobile + Perf | Complete | 2026-03-03 | Responsive fixes (375px) on expenses/invoices/pipeline; dynamic PDF imports on contracts/reports/invoices/[id]; viewport meta |
| TDS Certificates | Complete | 2026-03-03 | migration 007, use-tds.ts, /tds page with CRUD + FY filter + KPI; TopNavV2 link added |
| Invoice CSV Export | Complete | 2026-03-03 | Download CSV button on invoices list page (client-side, all columns incl. TDS) |
| Sentry | Complete | 2026-03-03 | @sentry/nextjs installed; sentry.client.config.ts + sentry.server.config.ts; withSentryConfig in next.config.mjs; NEXT_PUBLIC_SENTRY_DSN in .env.example |
| Deployment | Complete | 2026-03-03 | Railway connected to GitHub (main branch auto-deploy). Run migrations 005-007 in Supabase SQL Editor. Set SMTP_PASS + NEXT_PUBLIC_SENTRY_DSN in Railway env vars. |

## Environment Setup
- Supabase URL: (to be filled)
- Supabase Region: ap-south-1 (Mumbai)
- SMTP Host: smtp.office365.com port 587 (STARTTLS)
- SMTP User: accounts@wodo.digital - add SMTP_PASS to .env
- Sentry: set NEXT_PUBLIC_SENTRY_DSN in Railway env vars (create project at sentry.io first)
- Railway: connected to GitHub wododigital/wodo-ally, auto-deploys on push to main

## Known Issues / Decisions Log

1. Supabase SQL views (monthly_pl_view, etc.) are not in generated Database types - use `(supabase as any).from('view_name')` pattern with explicit `Record<string, unknown>[]` casts. Same for `services` table until types are regenerated.
2. Migration 006_project_expenses.sql (project_expense_breakdown view) needs to be run in Supabase SQL Editor before project-level expense analytics appear.
3. Email requires SMTP_PASS in .env - fill in Microsoft 365 app password for accounts@wodo.digital.
4. `useRefreshTargetProgress` uses Apr-Mar Indian FY bounds. For '2025-26': Apr 1 2025 - Mar 31 2026.

## Files Modified Registry
(Track which major files each agent/phase created or modified)

### Phase 1
- (To be updated)

## User Feedback Notes
(Record UI feedback from user reviews here)

1. (No entries yet)
