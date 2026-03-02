# 14 - Agent Orchestration (Claude Code Agent Teams)

## Overview

WODO Ally is built using Claude Code's native Agent Teams feature (swarm mode) for parallel multi-agent development. This allows multiple specialized agents to work simultaneously on different modules.

## Prerequisites

1. Latest Claude Code installed: `npm update -g @anthropic-ai/claude-code`
2. Enable Agent Teams: Add `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` to your environment or Claude Code settings.json
3. Anthropic API key configured in Claude Code
4. Project folder: `WODO Ally/` (already created by user)

## Model Selection Strategy

Use different models based on task complexity:

| Task Type | Model | Reason |
|-----------|-------|--------|
| Database schema, complex logic | claude-opus-4-6 | Highest reasoning for architecture decisions |
| UI components, page layouts | claude-sonnet-4-5-20250929 | Great for UI code, faster iteration |
| Repetitive CRUD, boilerplate | claude-sonnet-4-5-20250929 | Efficient for standard patterns |
| Bug fixes, small edits | claude-sonnet-4-5-20250929 | Quick turnaround |
| Design system, complex PDF | claude-opus-4-6 | Needs careful attention to detail |

Claude Code Agent Teams will use the configured default model. For critical tasks, you can specify in the task description that it requires careful reasoning.

## Agent Team Structure

When starting a build phase, prompt Claude Code with the team structure. Example for Phase 1:

```
Create an agent team for WODO Ally Phase 1 build:

1. "Design System Agent" - Read 02-DESIGN-SYSTEM.md and elite-ui-ux-designer-skill.md. 
   Implement the complete Tailwind config, global CSS, and all shared components 
   (GlassCard, StatCard, StatusBadge, CurrencyDisplay, DataTable, PageHeader).
   Work in src/components/shared/ and src/app/globals.css.

2. "Layout Agent" - Read 02-DESIGN-SYSTEM.md. Build the dashboard layout with sidebar,
   header, mobile nav, and background setup. Work in src/components/layout/ and 
   src/app/(dashboard)/layout.tsx. Depends on Design System Agent for shared components.

3. "Database Agent" - Read 03-DATABASE-SCHEMA.md. Set up Supabase client libraries, 
   create all migration SQL files, generate TypeScript types, and write seed data scripts.
   Work in src/lib/supabase/ and supabase/migrations/.

These three can work in parallel. Layout Agent should coordinate with Design System Agent 
for shared components.
```

## Phase-Based Team Prompts

### Phase 1: Foundation (agents work in parallel)
```
Agent 1: Design System + Shared Components
Agent 2: Layout + Navigation + Auth Pages  
Agent 3: Database Schema + Supabase Setup + Seed Data
```

### Phase 2A: Core Pages UI (after Phase 1)
```
Agent 1: Dashboard Home Page (KPI cards, attention items, goal preview)
Agent 2: Client List + Client Detail pages
Agent 3: Invoice List + Invoice Form pages
```

### Phase 2B: More Pages UI (parallel with 2A review)
```
Agent 1: Projects pages
Agent 2: Payments page
Agent 3: Expenses dashboard + upload page
```

### Phase 3: Backend Logic (after UI review)
```
Agent 1: Invoice Engine (numbering, PDF generation, CRUD)
Agent 2: Payment Recording + Reconciliation logic
Agent 3: Expense Parser (bank statement upload, auto-categorization)
```

### Phase 4: Advanced Features
```
Agent 1: Analytics + P&L + Charts
Agent 2: Investor Report Generator
Agent 3: Contract Generation + Email System
```

### Phase 5: Polish
```
Agent 1: Financial Targets + Forecasting
Agent 2: Mobile optimization + Loading states + Error handling
Agent 3: Testing + Sentry integration + Performance
```

## Communication Protocol

When assigning tasks to agents, include:

1. **Which PRD files to read** (always include 00 and the relevant module file)
2. **Which files/folders to work in** (prevent merge conflicts)
3. **Dependencies on other agents** (what they need to wait for)
4. **Definition of done** (what constitutes completion)

Example task assignment:
```
@invoice-agent: Read 00-PROJECT-OVERVIEW.md and 06-INVOICING-ENGINE.md.
Build the invoice PDF template in src/lib/pdf/invoice-template.tsx using @react-pdf/renderer.
Match the exact layout from the uploaded invoice PDFs.
You need the shared components from Design System Agent to be complete first.
Done when: PDF renders correctly for GST, International (USD), International (AED), 
and Pro Forma invoice types with sample data.
```

## File Ownership (Avoid Conflicts)

To prevent agents from editing the same files:

| Module | Owned Files/Folders |
|--------|-------------------|
| Design System | src/components/shared/*, globals.css, tailwind.config.ts |
| Layout | src/components/layout/*, src/app/(dashboard)/layout.tsx |
| Database | src/lib/supabase/*, supabase/*, src/types/* |
| Auth | src/app/(auth)/*, src/middleware.ts |
| Clients | src/app/(dashboard)/clients/*, src/components/clients/* |
| Invoices | src/app/(dashboard)/invoices/*, src/components/invoices/*, src/lib/pdf/invoice* |
| Contracts | src/app/(dashboard)/contracts/*, src/components/contracts/*, src/lib/pdf/contract* |
| Payments | src/app/(dashboard)/payments/*, src/components/payments/* |
| Expenses | src/app/(dashboard)/expenses/*, src/components/expenses/* |
| Analytics | src/app/(dashboard)/analytics/*, src/components/analytics/* |
| Reports | src/app/(dashboard)/reports/*, src/components/reports/* |
| Email | src/lib/email/*, src/app/api/emails/* |
| Hooks | src/lib/hooks/* (coordinate - one agent at a time per hook file) |

## Key Instructions for All Agents

1. ALWAYS read 00-PROJECT-OVERVIEW.md first
2. ALWAYS read 02-DESIGN-SYSTEM.md before any UI work
3. ALWAYS read elite-ui-ux-designer-skill.md before any UI work
4. Never use em dashes in any code, comments, or content
5. Use the design system tokens (not hardcoded colors)
6. All pages must be responsive (test at 375px, 768px, 1280px)
7. Use TypeScript strict mode
8. Add loading skeletons for all data-fetching pages
9. Use TanStack Query for all server state
10. Update PROJECT-INFO.md after completing each module
11. ASK the user if you need Supabase credentials, API keys, or any other setup
