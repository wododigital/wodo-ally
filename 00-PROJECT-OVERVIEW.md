# WODO Ally - Internal Accounting & Financial Management Platform

## Read Order for Claude Code Agents

Read these files in numbered order. Each file is a self-contained module. Agents can work on modules in parallel after reading 00, 01, 02, and 03 (which are foundational).

```
00-PROJECT-OVERVIEW.md        <- YOU ARE HERE (read first, always)
01-TECH-STACK-AND-SETUP.md    <- Project init, dependencies, folder structure
02-DESIGN-SYSTEM.md           <- Design tokens, glass morphism, components (MUST read before any UI work)
03-DATABASE-SCHEMA.md         <- All Supabase tables, RLS, seed data
04-AUTH-AND-ROLES.md          <- Supabase Auth, RBAC
05-CLIENT-PROJECT-MGMT.md     <- Client onboarding, project lifecycle
06-INVOICING-ENGINE.md        <- Invoice generation, pro forma, PDF templates
07-CONTRACT-GENERATION.md     <- Contract PDF templates
08-PAYMENT-TRACKING.md        <- Multi-currency, deductions, reconciliation
09-EXPENSE-MANAGEMENT.md      <- Bank statement parser, auto-categorization
10-ANALYTICS-DASHBOARD.md     <- P&L, balance sheet, charts, KPIs
11-INVESTOR-REPORTS.md        <- Auto-generated monthly investor reports
12-EMAIL-NOTIFICATIONS.md     <- Transactional emails, reminders
13-FINANCIAL-TARGETS.md       <- Goal setting and tracking
14-AGENT-ORCHESTRATION.md     <- Claude Code Agent Teams setup instructions
15-PHASE-PLAN.md              <- Phased delivery with parallel tracks
PROJECT-INFO.md               <- Living doc, updated after each major build
elite-ui-ux-designer-skill.md <- MUST READ before any UI/UX work (in project root)
```

## What is WODO Ally?

WODO Ally is an internal SaaS platform for WODO Digital Private Limited - a design, development, and SEO services company based in Bangalore, India. It replaces manual Excel tracking and Canva invoicing with a unified system for:

- Client and project management with lifecycle tracking
- Automated invoice generation (GST, International, Non-GST, Pro Forma)
- Contract generation from templates
- Multi-currency payment tracking with reconciliation (INR, USD, AED, GBP)
- Expense management via bank statement upload (IDFC FIRST Bank)
- Financial analytics (P&L, Balance Sheet, Revenue by Service)
- Investor reporting with auto-generated monthly PDFs
- Financial target setting and progress tracking

## Company Details (Hardcoded in Templates)

```
Company: WODO Digital Private Limited
Address: #1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore, India - 560091
GSTIN: 29AADCW8591N1ZA
CEO: Shyam Singh Bhati
Email: accounts@wodo.digital
Phone: +91 63621 80633
Website: www.wodo.digital
Tagline Options (used in invoice headers based on type):
  - "DESIGN | DEVELOPMENT | DIGITAL GROWTH"
  - "DESIGN | DEVELOPMENT | ORGANIC GROWTH"
  - "DESIGN | DEVELOPMENT | DIGITAL MARKETING | BRANDING"
  - "WEB DESIGN | VISUAL IDENTITY | DIGITAL MARKETING"
```

## Bank Accounts (Used in Invoice Templates)

### Indian (IDFC FIRST) - for GST and Non-GST invoices
```
Name: WODO DIGITAL PRIVATE LIMITED
Account: 10213871315
IFSC: IDFB0080574
SWIFT: IDFBINBBMUM
Bank: IDFC FIRST
Branch: KARNATAKA-DEVARAJA URS ROAD BRANCH
```

### USA (via Skydo) - for US clients
```
Account Holder: WODO DIGITAL PRIVATE LIMITED
Payment Method: ACH
ACH Routing: 026073150
Account: 8335312671
Bank: COMMUNITY FEDERAL SAVINGS BANK
Currency: USD
```

### UAE (via Skydo) - for UAE/AED clients
```
Account: WODO DIGITAL PRIVATE LIMITED
Payment Method: IPP / FTS
IBAN: AE190960000691060009302
BIC/SWIFT: ZANDAEAAXXX
Bank: Zand Bank PJSC
Beneficiary Address: 1st Floor, Emaar Square, Building 6, Dubai, UAE
Currency: AED
```

## Key Business Rules

1. Financial Year: April 1 - March 31 (Indian FY)
2. GST Rate: 18% (shown as single line, not CGST+SGST split)
3. International invoices: 0% tax ("VAT not applicable - Export of services")
4. Invoice numbering: G00001 series (GST + International), NG00001 series (Non-GST), sequences are independent
5. Pro forma invoices: Use internal reference IDs only (PF-YYYYMMDD-XXX), NO sequential numbers
6. Pro forma converts to final invoice only after payment, at which point a G/NG number is assigned
7. All internal calculations and reporting in INR
8. International payments arrive via Skydo as INR after FX conversion and fees
9. TDS deductions tracked per invoice (Section 194J typically)
10. Retainer invoices auto-generated monthly in draft state

## CRITICAL RULES FOR ALL AGENTS

- NEVER use em dashes (--) in any content, copy, or code comments. Use hyphens (-) instead.
- Read elite-ui-ux-designer-skill.md before any UI work
- Read 02-DESIGN-SYSTEM.md before building any component
- Follow the design system strictly unless told otherwise
- All UI must be mobile-responsive
- Use test/seed data in all tables so agents have data to build against
- ASK the user for anything you need (Supabase credentials, MCP access, env vars, etc.)
- Update PROJECT-INFO.md after completing any major module
