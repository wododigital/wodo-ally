# 01 - Tech Stack & Project Setup

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | React-based with built-in API routes, SSR, ISR |
| Database | Supabase (PostgreSQL) | Auth, DB, Storage, Edge Functions, RLS |
| Styling | Tailwind CSS 3.4 + shadcn/ui | Utility-first + accessible component primitives |
| State (Server) | TanStack Query v5 | Caching, optimistic updates, background refetch |
| State (Client) | Zustand | Lightweight global state for UI |
| Forms | React Hook Form + Zod | Validation with TypeScript inference |
| PDF Generation | @react-pdf/renderer | Invoice and report PDFs |
| Excel Parsing | SheetJS (xlsx) | Bank statement upload parsing |
| Charts | Recharts | Composable chart components |
| Email | Nodemailer (Microsoft 365 SMTP) | Transactional emails via business email |
| Icons | Lucide React | Consistent icon set |
| Date Handling | date-fns | Lightweight date utilities |
| Deployment | Railway | Node.js hosting with easy Supabase integration |
| Error Tracking | Sentry | Error recording and debugging |

## Project Initialization

```bash
# Create Next.js project
npx create-next-app@14 wodo-ally \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd wodo-ally

# Core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query zustand
npm install react-hook-form @hookform/resolvers zod
npm install @react-pdf/renderer
npm install xlsx
npm install recharts
npm install nodemailer
npm install -D @types/nodemailer
npm install lucide-react
npm install date-fns
npm install clsx tailwind-merge class-variance-authority
npm install next-themes
npm install sonner  # Toast notifications
npm install @sentry/nextjs

# Dev dependencies
npm install -D @types/node prettier
```

## Initialize shadcn/ui

```bash
npx shadcn@latest init
# Choose: New York style, Zinc base color, CSS variables: yes

# Install needed components
npx shadcn@latest add button card dialog dropdown-menu input label
npx shadcn@latest add select separator sheet skeleton table tabs
npx shadcn@latest add badge avatar calendar command popover
npx shadcn@latest add form toast tooltip textarea checkbox switch
npx shadcn@latest add progress scroll-area alert alert-dialog
```

## Folder Structure

```
wodo-ally/
  public/
    wodo-logo.png                  # WODO logo (already placed by user)
    bg-wave.jpg                    # Abstract orange wave background (already placed by user)
    wodo-stamp.png                 # Company stamp for invoices (ask user to provide)
  src/
    app/
      (auth)/
        login/page.tsx
        layout.tsx
      (dashboard)/
        layout.tsx                 # Main app layout with sidebar
        page.tsx                   # Dashboard home
        clients/
          page.tsx                 # Client list
          [id]/page.tsx            # Client detail
          new/page.tsx             # New client form
        projects/
          page.tsx
          [id]/page.tsx
        invoices/
          page.tsx                 # Invoice list with filters
          [id]/page.tsx            # Invoice detail/edit
          [id]/preview/page.tsx    # PDF preview
        contracts/
          page.tsx
          [id]/page.tsx
        payments/
          page.tsx                 # Payment tracking
        expenses/
          page.tsx                 # Expense dashboard
          upload/page.tsx          # Bank statement upload
        analytics/
          page.tsx                 # Financial analytics
          pl/page.tsx              # P&L statement
          targets/page.tsx         # Financial targets
        reports/
          page.tsx                 # Investor reports
          [id]/page.tsx
        settings/
          page.tsx                 # App settings, categories, rules
      api/
        invoices/
          generate-pdf/route.ts
        contracts/
          generate-pdf/route.ts
        expenses/
          parse-statement/route.ts
        reports/
          generate/route.ts
        emails/
          send/route.ts
    components/
      ui/                          # shadcn components (auto-generated)
      layout/
        sidebar.tsx
        header.tsx
        mobile-nav.tsx
      dashboard/
        attention-card.tsx
        goal-tracker.tsx
        revenue-chart.tsx
        kpi-cards.tsx
      clients/
        client-form.tsx
        client-card.tsx
      invoices/
        invoice-form.tsx
        invoice-table.tsx
        line-item-editor.tsx
      contracts/
        contract-form.tsx
      payments/
        payment-tracker.tsx
        deduction-form.tsx
      expenses/
        statement-upload.tsx
        category-mapper.tsx
        transaction-table.tsx
      analytics/
        pl-statement.tsx
        revenue-by-service.tsx
        client-health-score.tsx
      reports/
        investor-report-generator.tsx
      shared/
        glass-card.tsx             # Reusable glass morphism card
        stat-card.tsx
        data-table.tsx             # Generic sortable/filterable table
        page-header.tsx
        empty-state.tsx
        currency-display.tsx
        status-badge.tsx
        loading-skeleton.tsx
    lib/
      supabase/
        client.ts                  # Browser client
        server.ts                  # Server client
        middleware.ts              # Auth middleware
        admin.ts                   # Service role client (for server-only ops)
      utils/
        cn.ts                      # clsx + tailwind-merge helper
        format.ts                  # Currency, date, number formatters
        constants.ts               # App-wide constants
        invoice-number.ts          # Invoice number generation logic
      hooks/
        use-clients.ts
        use-invoices.ts
        use-payments.ts
        use-expenses.ts
        use-analytics.ts
        use-financial-year.ts
      stores/
        ui-store.ts                # Sidebar state, theme, etc.
      email/
        templates/
          invoice-sent.tsx
          payment-reminder.tsx
          payment-receipt.tsx
      pdf/
        invoice-template.tsx       # @react-pdf Invoice layout
        contract-template.tsx
        investor-report-template.tsx
    types/
      database.ts                  # Supabase generated types
      invoice.ts
      client.ts
      project.ts
      expense.ts
    config/
      expense-categories.ts        # Default expense categories
      bank-statement-rules.ts      # Pattern matching rules for IDFC FIRST
      invoice-bank-details.ts      # Bank details per currency/region
```

## Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<ask user>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ask user>
SUPABASE_SERVICE_ROLE_KEY=<ask user>

# Email (Microsoft 365 SMTP)
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=<ask user - their Microsoft business email, e.g. accounts@wodo.digital>
SMTP_PASSWORD=<ask user - app password or account password>
SMTP_FROM_NAME=WODO Digital
SMTP_FROM_EMAIL=<same as SMTP_USER>

# Sentry
SENTRY_DSN=<ask user>
NEXT_PUBLIC_SENTRY_DSN=<ask user>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ASK THE USER FOR:
1. Supabase project URL and keys (create project in ap-south-1 region)
2. Microsoft 365 SMTP credentials (email address + app password for accounts@wodo.digital or whichever business email)
   - If MFA is enabled, generate an App Password from Microsoft 365 Admin > Security
   - SMTP Host: smtp.office365.com, Port: 587, TLS: required
3. Sentry DSN (or skip for Phase 1)
4. Company stamp image (wodo-stamp.png for invoices) - or extract from existing invoice PDFs
5. Confirm that wodo-logo.png and bg-wave.jpg are in the public/ folder

## Sentry Error Recording Setup

Initialize Sentry for error tracking and debugging:

```bash
npx @sentry/wizard@latest -i nextjs
```

This creates `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`. Configure with project DSN. All unhandled errors, API failures, and PDF generation issues will be captured automatically.

## Utility: cn() helper

Create `src/lib/utils/cn.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Next Steps

After setup, run `npm run dev` to verify the project starts. Then proceed to 02-DESIGN-SYSTEM.md to implement the design tokens before building any components.
