# 15 - Phase Plan

## Phase Overview

The build is organized into 5 phases. Within each phase, multiple agents work in parallel on independent tracks. After each phase, the user reviews and approves before the next phase begins.

## Phase 1: Foundation & Design System
**Goal**: Project setup, design system, layout, database, auth - the skeleton of the app.
**User reviews**: UI fundamentals (layout, sidebar, glass morphism, dark theme, login page)

### Track 1A: Project Setup + Design System
- Initialize Next.js project with all dependencies
- Configure Tailwind with design tokens from 02-DESIGN-SYSTEM.md
- Set up globals.css with glass morphism classes
- Build all shared components: GlassCard, StatCard, StatusBadge, CurrencyDisplay, PageHeader, DataTable, EmptyState, LoadingSkeleton
- Import fonts (Inter, JetBrains Mono)

### Track 1B: Layout + Auth
- Build sidebar component with nav items and active states
- Build header with breadcrumbs and user avatar
- Build mobile navigation (sheet-based)
- Set up background image (bg-wave.jpg) with blur effect
- Build login page with WODO branding
- Set up Supabase Auth with middleware
- Create useAuth hook and role-based wrappers

### Track 1C: Database
- Create all Supabase tables from 03-DATABASE-SCHEMA.md
- Set up RLS policies
- Create invoice number sequence functions
- Generate TypeScript types from Supabase schema
- Write and execute comprehensive seed data
- Set up Supabase client utilities (browser + server)

### Deliverables for Review:
- Login page renders with glass morphism
- Dashboard layout with sidebar, header, background
- Empty dashboard page with placeholder cards
- Database seeded with test data
- `npm run dev` runs without errors

---

## Phase 2: Core Pages (UI Only)
**Goal**: Build all page UIs with seed data. No backend logic yet - use hardcoded/seed data.
**User reviews**: Page layouts, component designs, mobile responsiveness

### Track 2A: Dashboard + Clients
- Dashboard home: KPI cards, attention items, goal progress, recent activity
- Client list page with search, filters, grid view
- Client detail page with tabs (overview, projects, invoices, payments, TDS)
- Client create/edit form

### Track 2B: Invoices + Payments
- Invoice list page with status tabs and filters
- Invoice create/edit form with line item editor
- Invoice detail page with payment history
- Payments dashboard with overview cards and timeline
- Payment recording form with deduction fields

### Track 2C: Expenses + Analytics
- Expense dashboard with category charts and transaction table
- Bank statement upload page with drag-drop and preview
- Analytics page with KPI cards and chart placeholders
- P&L statement view
- Financial targets page with progress cards

### Deliverables for Review:
- All pages render with real-looking seed data
- Mobile responsive on all pages
- Navigation works between all routes
- Forms render correctly (no submission logic yet)

---

## Phase 3: Core Backend Logic
**Goal**: Wire up all CRUD operations, invoice generation, payment recording.

### Track 3A: Client & Project CRUD
- TanStack Query hooks for clients and projects
- Create, update, delete operations through Supabase
- Real-time search and filtering
- Client health score calculation

### Track 3B: Invoice Engine
- Invoice CRUD with line items
- Invoice number generation (G/NG sequences)
- Pro forma reference generation
- Pro forma to final invoice conversion
- Retainer invoice auto-draft generation
- PDF generation with @react-pdf/renderer (all 4 templates)
- PDF download and preview

### Track 3C: Payment & Expense
- Payment recording with deduction tracking
- Invoice status auto-update on payment
- Bank statement parser (IDFC FIRST format)
- Auto-categorization engine with rule matching
- Manual review and rule creation UI wiring

### Deliverables:
- Full CRUD working for clients, projects, invoices
- PDF invoices generate correctly for all types
- Bank statement upload parses and categorizes
- Payments record and update invoice statuses

---

## Phase 4: Advanced Features
**Goal**: Analytics, reports, contracts, emails.

### Track 4A: Analytics & P&L
- Revenue analytics queries and charts
- Expense breakdown charts
- P&L statement computation from real data
- Balance sheet simplified view
- MRR tracking and calculation
- Client and project analytics

### Track 4B: Investor Reports & Targets
- Report data collection logic
- Report dashboard view with charts
- PDF report generation
- Financial targets CRUD
- Target auto-calculation from live data
- Goal progress visualization
- Revenue forecasting

### Track 4C: Contracts & Email
- Contract form with template selection
- Contract PDF generation
- Contract lifecycle management
- Nodemailer + Microsoft 365 SMTP integration
- Email templates (invoice sent, reminder, receipt)
- Email preview and send flow

### Deliverables:
- Analytics show real computed data
- Investor reports generate with accurate data
- Contracts generate as PDFs
- Emails send successfully

---

## Phase 5: Polish & Deploy
**Goal**: Error handling, loading states, mobile polish, Sentry, deployment.

### Track 5A: UX Polish
- Loading skeletons on all pages
- Error boundaries with friendly messages
- Empty states for all lists
- Toast notifications (sonner) for all actions
- Form validation messages
- Confirmation dialogs for destructive actions

### Track 5B: Mobile & Performance
- Test and fix all pages at 375px width
- Optimize bundle size
- Image optimization
- Lazy loading for charts and heavy components

### Track 5C: Deploy & Monitor
- Sentry integration for error tracking
- Environment variable setup for Railway
- Railway deployment configuration
- Smoke testing all features in production
- Accountant export feature
- TDS certificate tracking

### Deliverables:
- Production deployment on Railway
- All features working end-to-end
- Error tracking active
- Mobile experience polished

---

## Post-Launch Backlog (Future)
- Supabase Realtime for live invoice status updates
- Bulk invoice operations
- Client portal (client can view their invoices)
- WhatsApp integration for payment reminders
- Multi-company support (if WODO wants to track Hasiru, Nandhini separately)
- AI-powered expense categorization (upgrade from rule-based)
- API integrations (Skydo webhook for payment notifications)
