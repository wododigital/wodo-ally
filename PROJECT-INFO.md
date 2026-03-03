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
- [ ] Phase 3: Core Backend Logic
- [ ] Phase 4: Advanced Features
- [ ] Phase 5: Polish & Deploy

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
| Client CRUD | Pending | - | Phase 3 |
| Invoice Engine | Pending | - | Phase 3 |
| PDF Generation | Pending | - | Phase 3 |
| Payment Logic | Pending | - | Phase 3 |
| Expense Parser | Pending | - | Phase 3 |
| Analytics Queries | Pending | - | Phase 4 |
| Investor Reports | Pending | - | Phase 4 |
| Contract Gen | Pending | - | Phase 4 |
| Email System | Pending | - | Phase 4 |
| Financial Targets | Pending | - | Phase 4 |
| Deployment | Pending | - | Phase 5 |

## Environment Setup
- Supabase URL: (to be filled)
- Supabase Region: ap-south-1 (Mumbai)
- SMTP (Microsoft 365): (to be configured)
- Sentry: (to be configured)
- Railway: (to be configured)

## Known Issues / Decisions Log
(Record architectural decisions, trade-offs, and known issues here)

1. (No entries yet)

## Files Modified Registry
(Track which major files each agent/phase created or modified)

### Phase 1
- (To be updated)

## User Feedback Notes
(Record UI feedback from user reviews here)

1. (No entries yet)
