# CLAUDE-CODE-START-HERE.md

## Master Instruction for Claude Code

You are building WODO Ally - an internal accounting and financial management SaaS platform for WODO Digital Private Limited.

### Before You Begin

1. Read ALL files in this PRD folder in numbered order (00 through 15)
2. Read `elite-ui-ux-designer-skill.md` in the project root
3. Read `PROJECT-INFO.md` for current build status
4. The project folder is: `WODO Ally/`
5. The WODO logo (`wodo-logo.png`) and background image (`bg-wave.jpg`) are already in `public/`

### What to Ask the User For

Before starting any implementation, ask the user to provide:

1. **Supabase credentials**: Project URL, Anon Key, Service Role Key
   - The project should be in ap-south-1 (Mumbai) region
   - If not created yet, guide them to create one at supabase.com
2. **Company stamp image**: `wodo-stamp.png` for invoice PDFs
   - Or confirm if they want you to extract it from the uploaded invoice PDFs
3. **Microsoft 365 SMTP credentials**: Business email (e.g., accounts@wodo.digital) + app password for sending emails (can skip for Phase 1-2)
4. **Sentry DSN**: For error tracking (can skip for Phase 1-2)
5. **Non-GST bank details**: Bank account details for NG invoices (personal account)

### Build Approach

**UI-First Strategy**: Build all UI pages first (Phase 1 + 2) with seed/test data. Deploy locally. Get user feedback on design. THEN implement backend logic.

**Design System First**: NEVER build a page component without first implementing the design system tokens and shared components. The glass morphism dark theme is critical to get right before building pages.

**Test Data**: Populate all tables with realistic seed data from day one. Use the actual client names, invoice amounts, and bank statement patterns from the PRD files.

### Phase 1 Start Command (for Agent Teams)

If using Agent Teams, start with this prompt:

```
I'm building WODO Ally, an internal financial management platform. 
The PRD is in the project root in numbered markdown files (00 through 15).

Create an agent team for Phase 1 - Foundation:

1. "Design System Agent" - Read 02-DESIGN-SYSTEM.md and elite-ui-ux-designer-skill.md.
   Set up Tailwind config with all design tokens, globals.css with glass morphism classes,
   and build shared components in src/components/shared/. 
   Files: tailwind.config.ts, src/app/globals.css, src/components/shared/*

2. "Layout & Auth Agent" - After Design System Agent completes shared components,
   build the dashboard layout (sidebar, header, mobile nav, background), login page,
   and Supabase auth middleware.
   Files: src/components/layout/*, src/app/(auth)/*, src/app/(dashboard)/layout.tsx, src/middleware.ts

3. "Database Agent" - Read 03-DATABASE-SCHEMA.md. Create Supabase client setup,
   write all SQL migrations, seed data script, and generate TypeScript types.
   Files: src/lib/supabase/*, src/types/*, supabase/*

All three agents should read 00-PROJECT-OVERVIEW.md first. 
Agent 2 depends on Agent 1 for shared components.
Agent 3 works independently.
```

### If NOT Using Agent Teams (Single Agent)

Follow this sequence:

1. Initialize the Next.js project (01-TECH-STACK-AND-SETUP.md)
2. Implement design system (02-DESIGN-SYSTEM.md)
3. Build shared components
4. Build layout and auth
5. Set up database and seed data
6. Build dashboard UI
7. Build remaining page UIs
8. Review with user
9. Implement backend logic
10. Polish and deploy

### Model Routing (Token Efficiency)

Route by complexity - use the cheapest model that can handle the task:

- **Haiku:** file reads, simple edits, renaming, formatting, linting fixes, boilerplate generation, grep/search, straightforward CRUD endpoints, config changes, any task needing no reasoning
- **Sonnet:** writing new functions/modules, debugging, refactoring, API integrations, database schema design, middleware logic, test writing, multi-file changes needing context awareness
- **Opus:** complex architectural decisions, multi-system design, tricky cross-layer debugging, performance optimization analysis, or when Sonnet fails

Before executing, briefly assess complexity and pick the cheapest model. Default to Haiku unless reasoning is genuinely required. Batch related small changes into single calls. When reading files for context, read only relevant lines. Keep responses concise - skip explanations unless asked.

### Critical Rules (Repeat)

- NEVER use em dashes (--) anywhere. Use hyphens (-).
- ALWAYS follow the design system. No hardcoded colors.
- ALWAYS make pages responsive.
- ALWAYS use TypeScript strict mode.
- ALWAYS update PROJECT-INFO.md after completing a module.
- Use TanStack Query for server state, Zustand for UI state.
- Use React Hook Form + Zod for all forms.
- Use sonner for toast notifications.
- Use glass-card class for all card containers.
- Use the accent color (#fd7e14) for CTAs and highlights only.
