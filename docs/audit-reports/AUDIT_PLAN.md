# WODO Ally - Comprehensive Production Audit Plan

**Created:** 2026-04-09
**Platform:** WODO Ally (Internal Financial Management SaaS)
**Live URL:** https://wodo-ally-production.up.railway.app
**Credentials:** accounts@wodo.digital / WodoAlly@2026
**Audit Standard:** Fintech-grade - suitable for investor presentation

---

## Table of Contents

1. [Audit Team Structure](#1-audit-team-structure)
2. [Phase Overview and Dependency Map](#2-phase-overview-and-dependency-map)
3. [Phase 1: Authentication and Access Control](#phase-1-authentication-and-access-control)
4. [Phase 2: Source Code Static Analysis](#phase-2-source-code-static-analysis)
5. [Phase 3: Core Data CRUD and Integrity](#phase-3-core-data-crud-and-integrity)
6. [Phase 4: Financial Logic and Calculations](#phase-4-financial-logic-and-calculations)
7. [Phase 5: Invoice Engine Deep Dive](#phase-5-invoice-engine-deep-dive)
8. [Phase 6: Payment and Multi-Currency Audit](#phase-6-payment-and-multi-currency-audit)
9. [Phase 7: Expense Management and Bank Statement Parsing](#phase-7-expense-management-and-bank-statement-parsing)
10. [Phase 8: Cross-Module Data Flow and Interlinking](#phase-8-cross-module-data-flow-and-interlinking)
11. [Phase 9: Analytics and Reporting Accuracy](#phase-9-analytics-and-reporting-accuracy)
12. [Phase 10: PDF Generation Audit](#phase-10-pdf-generation-audit)
13. [Phase 11: Email System and Templates](#phase-11-email-system-and-templates)
14. [Phase 12: UX, Accessibility, and Responsiveness](#phase-12-ux-accessibility-and-responsiveness)
15. [Phase 13: Error Handling and Edge Cases](#phase-13-error-handling-and-edge-cases)
16. [Phase 14: Investor Readiness Assessment](#phase-14-investor-readiness-assessment)
17. [Execution Schedule](#execution-schedule)
18. [Final Deliverable Structure](#final-deliverable-structure)

---

## 1. Audit Team Structure

| Agent Role | Skill / Mode | Responsibility |
|---|---|---|
| **Lead Auditor** | Task Orchestrator | Coordinates all phases, aggregates findings, produces final report |
| **Code Analyst** | `sparc:analyzer` | Static code analysis, calculation verification, data flow tracing |
| **Functional Tester** | `sparc:tester` + Playwright | End-to-end browser testing against the live site |
| **Security Reviewer** | `sparc:security-review` | Auth, RLS policies, input sanitization, secrets exposure |
| **UX Reviewer** | `sparc:reviewer` | UI consistency, accessibility, responsiveness, flow clarity |
| **Financial Auditor** | `sparc:analyzer` | Tax logic, currency conversion, P&L accuracy, invoice math |
| **Debugger** | `sparc:debug` | Investigates failures found by other agents |

---

## 2. Phase Overview and Dependency Map

```
Phase 1: Auth & Access --------+
Phase 2: Static Analysis ------+---> Phase 3: Core CRUD ---> Phase 8: Cross-Module Flow
                               |         |
                               |         +--> Phase 4: Financial Logic
                               |         +--> Phase 5: Invoice Engine
                               |         +--> Phase 6: Payments
                               |         +--> Phase 7: Expenses
                               |
                               +---> Phase 12: UX/Responsiveness (independent)
                               +---> Phase 11: Email System (independent)

Phase 4+5+6+7 ---> Phase 9: Analytics & Reporting
Phase 5 ---------> Phase 10: PDF Generation
Phase 9 ---------> Phase 14: Investor Readiness

Phase 13: Error Handling (runs in parallel with Phases 3-10)
```

**Parallelizable groups:**
- Group A (independent): Phase 1 + Phase 2 + Phase 12 + Phase 11
- Group B (after Phase 1): Phases 3, 4, 5, 6, 7 (partially parallel - all need auth)
- Group C (after Group B): Phase 8, Phase 9, Phase 10
- Group D (after Group C): Phase 14
- Phase 13 runs continuously alongside all other phases

---

## Phase 1: Authentication and Access Control

**Agent:** Security Reviewer + Functional Tester
**Dependencies:** None (starting phase)
**Estimated duration:** 30 minutes

### Test Cases

| ID | Test | Method | Pass Criteria |
|---|---|---|---|
| 1.1 | Login with valid credentials | Playwright: navigate to /login, enter accounts@wodo.digital / WodoAlly@2026, submit | Redirects to /dashboard, session cookie set |
| 1.2 | Login with invalid password | Playwright: attempt login with wrong password | Error message shown, no redirect |
| 1.3 | Login with empty fields | Playwright: submit empty form | Validation messages shown |
| 1.4 | Access /dashboard without auth | Playwright: clear cookies, navigate to /dashboard | Redirects to /login |
| 1.5 | Access all protected routes without auth | Playwright: iterate all 25+ dashboard routes without session | All redirect to /login |
| 1.6 | Session persistence | Playwright: login, close browser, reopen, navigate to /dashboard | Session maintained or graceful re-auth |
| 1.7 | Middleware inspection | Code review: src/middleware.ts | Verify all dashboard routes are protected, no route bypasses |
| 1.8 | RLS policy review | Code review: supabase/migrations/*.sql | All tables have RLS enabled, policies enforce auth.uid() checks |
| 1.9 | API route protection | Code review: src/app/api/**/route.ts | All API routes check authentication before processing |
| 1.10 | Role-based access (if implemented) | Code review: profiles.role usage across codebase | Verify admin/manager/accountant/viewer roles are enforced or note as gap |

### Deliverable
- Auth security assessment document
- List of any unprotected routes or missing RLS policies

---

## Phase 2: Source Code Static Analysis

**Agent:** Code Analyst
**Dependencies:** None (runs parallel with Phase 1)
**Estimated duration:** 45 minutes

### Test Cases

| ID | Check | Files to Inspect | Pass Criteria |
|---|---|---|---|
| 2.1 | TypeScript strict mode compliance | tsconfig.json, all .ts/.tsx files | No `any` type usage except where documented (Supabase views workaround) |
| 2.2 | Floating point arithmetic in financial code | use-analytics.ts, use-invoices.ts, use-kpi.ts, format.ts | All currency math uses proper rounding (toFixed(2) or equivalent) |
| 2.3 | Division by zero guards | All hooks with percentage/ratio calculations | Every division has a zero-check guard |
| 2.4 | Null/undefined safety | All hooks and page components | No unguarded .property access on potentially null data |
| 2.5 | Console statement audit | Entire src/ | Only intentional error logging in error boundaries and catch blocks |
| 2.6 | Hardcoded values scan | Entire src/ | No hardcoded API URLs, secrets, credentials, or magic numbers without constants |
| 2.7 | Environment variable usage | .env.example, all process.env references | All env vars documented, no secrets in client-side code (NEXT_PUBLIC_ only) |
| 2.8 | Error boundary coverage | src/app/error.tsx, global-error.tsx | Error boundaries exist and display user-friendly messages |
| 2.9 | Supabase client usage | src/lib/supabase/*.ts | Proper server vs client distinction, no admin client on client side |
| 2.10 | Em dash check | Entire src/ | Zero em dashes per project rule |
| 2.11 | Dead code scan | All files | No unreachable code, unused imports, or commented-out blocks |
| 2.12 | Dependency audit | package.json | No known vulnerabilities (npm audit), no unused packages remaining |

### Deliverable
- Code quality scorecard
- List of all issues with severity (Critical / High / Medium / Low)
- Specific file:line references for each finding

---

## Phase 3: Core Data CRUD and Integrity

**Agent:** Functional Tester (Playwright)
**Dependencies:** Phase 1 (need authenticated session)
**Estimated duration:** 90 minutes

### 3A: Clients Module

| ID | Test | Steps | Pass Criteria |
|---|---|---|---|
| 3A.1 | List clients | Navigate to /clients | Existing 8 clients displayed with correct names, status badges |
| 3A.2 | Search clients | Type partial name in search box | Results filter in real time |
| 3A.3 | Filter by status | Select each status filter option | Only matching clients shown |
| 3A.4 | Create new client (Indian GST) | Click new, fill all fields including GSTIN, submit | Client appears in list, toast shown |
| 3A.5 | Create new client (International) | Fill form with USD currency, US region, tax number | Client saved with correct currency/region |
| 3A.6 | View client detail | Click a client row | Detail page loads with 4 tabs (Overview, Projects, Invoices, Payments) |
| 3A.7 | Edit client | Navigate to /clients/[id]/edit, change fields, save | Changes persisted, toast shown |
| 3A.8 | Client detail tabs | Click each tab on client detail page | Each tab loads relevant data without errors |
| 3A.9 | Health score display | Check client detail | Health score renders 0-100 with visual indicator |
| 3A.10 | Close/Reactivate client | Use close action, verify status changes, reactivate | Status toggles correctly |
| 3A.11 | Client validation | Submit form with missing required fields | Validation errors shown for company_name, client_type, region |

### 3B: Projects Module

| ID | Test | Steps | Pass Criteria |
|---|---|---|---|
| 3B.1 | List projects | Navigate to /projects | Projects displayed with client association |
| 3B.2 | Create project | Use add project modal, link to client, set engagement type | Project saved, linked to correct client |
| 3B.3 | Project detail (if exists) | Click project row | Detail view shows phases, invoices, expenses linked |
| 3B.4 | Retainer project setup | Create project with retainer engagement type | Retainer amount and billing day fields available and saved |
| 3B.5 | Project search and filter | Use search bar and engagement type filter | Correct filtering behavior |
| 3B.6 | Project-client linkage | Create project under specific client, check client detail Projects tab | Project appears in client's project list |

### 3C: Services Catalogue

| ID | Test | Steps | Pass Criteria |
|---|---|---|---|
| 3C.1 | List services | Check services section (likely in settings or as standalone) | Services with HSN codes displayed |
| 3C.2 | Create service | Add new service with name, rate, HSN code | Service saved, available in invoice line items |
| 3C.3 | Edit service | Modify existing service | Changes reflected in service list |
| 3C.4 | Service in invoice | Create new invoice, check line item service dropdown | Services from catalogue appear as options |

### 3D: Contracts Module

| ID | Test | Steps | Pass Criteria |
|---|---|---|---|
| 3D.1 | List contracts | Navigate to /contracts | Contract cards displayed with status badges |
| 3D.2 | Create contract | Fill template-based form, link to client/project | Contract saved with "draft" status |
| 3D.3 | Status lifecycle | Move contract through draft -> sent -> signed -> active | Each transition works, status badge updates |
| 3D.4 | Search and filter | Use search and status filter | Correct results shown |
| 3D.5 | Delete contract | Delete a draft contract using destructive dialog | Contract removed, confirmation dialog shown first |

### 3E: TDS Certificates

| ID | Test | Steps | Pass Criteria |
|---|---|---|---|
| 3E.1 | List TDS certificates | Navigate to /tds | Certificates displayed with FY context |
| 3E.2 | Create TDS certificate | Fill form with client, amount, FY, upload file | Certificate saved |
| 3E.3 | FY filter | Switch financial year filter | Only certificates for selected FY shown |
| 3E.4 | KPI cards | Check summary stats on TDS page | Values match filtered data |

### 3F: Financial Targets

| ID | Test | Steps | Pass Criteria |
|---|---|---|---|
| 3F.1 | List targets | Navigate to /targets | Target cards with progress bars displayed |
| 3F.2 | Create target | Use inline form to add new target | Target saved with 0% progress |
| 3F.3 | Progress calculation | Check if target progress auto-calculates from real data | Progress bar reflects actual vs target |
| 3F.4 | Delete target | Delete a target with confirmation | Target removed |
| 3F.5 | FY boundary logic | Verify targets use Apr-Mar Indian FY | Date range calculations are correct |

### 3G: Settings Module

| ID | Test | Steps | Pass Criteria |
|---|---|---|---|
| 3G.1 | Company tab | Navigate to /settings, Company tab | Company details editable and saved |
| 3G.2 | Bank Details tab | Switch to Bank Details tab | Bank account info displayed/editable |
| 3G.3 | Invoice Settings tab | Switch to Invoice Settings tab | Invoice numbering prefix, terms, notes configurable |
| 3G.4 | Users tab | Switch to Users tab | User list displayed with roles |
| 3G.5 | Notifications tab | Switch to Notifications tab | Notification preferences shown |

### 3H: Onboarding Module

| ID | Test | Steps | Pass Criteria |
|---|---|---|---|
| 3H.1 | Onboarding wizard | Navigate to /onboard | Wizard steps render without errors |
| 3H.2 | Step progression | Complete each wizard step | Can advance through all steps |
| 3H.3 | Data persistence | Complete onboarding, verify data saved | Client/project created from wizard data |

### Deliverable
- CRUD test results matrix (pass/fail per test case)
- Data integrity issues found
- Screenshots of any failures

---

## Phase 4: Financial Logic and Calculations

**Agent:** Financial Auditor (Code Analyst)
**Dependencies:** Phase 2 (need static analysis context)
**Estimated duration:** 60 minutes

### Test Cases

| ID | Check | Files | Pass Criteria |
|---|---|---|---|
| 4.1 | Invoice line item calculation | use-invoices.ts, invoice form components | quantity * rate = line total; sum of lines = subtotal |
| 4.2 | GST calculation (CGST + SGST) | Invoice creation for indian_gst clients | 9% CGST + 9% SGST = 18% total on each line item |
| 4.3 | IGST calculation | Invoice for indian_gst client in different state | 18% IGST applied instead of CGST+SGST |
| 4.4 | International invoice (no tax) | Invoice for international client | Zero tax, amount in client's currency |
| 4.5 | Non-GST invoice | Invoice for indian_non_gst client | No GST fields, clean total |
| 4.6 | Pro Forma invoice | Pro Forma type creation | Does NOT count toward revenue/outstanding totals |
| 4.7 | TDS deduction logic | Payment recording with TDS | TDS amount deducted, net amount = gross - TDS, invoice balance updated correctly |
| 4.8 | Multi-currency handling | Payment in USD/AED/GBP | Currency symbol, formatting, no INR conversion errors |
| 4.9 | Partial payment balance | Record partial payment on invoice | Balance = invoice_total - sum(payments); status changes to "partially_paid" |
| 4.10 | Overpayment handling | Record payment exceeding balance | Either blocked with validation or handled gracefully (no negative balance) |
| 4.11 | Revenue calculation | use-analytics.ts, use-kpi.ts | Revenue = sum of paid invoices only (not pending/cancelled/pro-forma) |
| 4.12 | Outstanding calculation | use-kpi.ts | Outstanding = sum of pending + overdue invoices |
| 4.13 | MRR calculation | use-kpi.ts | Monthly Recurring Revenue from retainer projects only |
| 4.14 | Profit margin | use-analytics.ts | ((Revenue - Expenses) / Revenue) * 100, guarded for zero revenue |
| 4.15 | Expense totals by category | use-transactions.ts | Category sums match individual transaction amounts |
| 4.16 | Indian Financial Year boundaries | use-targets.ts (Apr 1 - Mar 31) | FY 2025-26 = Apr 1 2025 to Mar 31 2026 |
| 4.17 | Currency formatting | format.ts | INR shows Rs symbol with Indian numbering (lakhs/crores); USD/GBP/AED show correct symbols |
| 4.18 | Rounding consistency | All calculation hooks | Two decimal places for currency, no floating point artifacts like 10.0000000001 |

### Deliverable
- Calculation audit matrix with formulas verified
- Any incorrect calculations with expected vs actual values
- Risk assessment for each financial logic issue

---

## Phase 5: Invoice Engine Deep Dive

**Agent:** Functional Tester + Financial Auditor
**Dependencies:** Phase 3A (need clients to exist)
**Estimated duration:** 75 minutes

### Test Cases

| ID | Test | Method | Pass Criteria |
|---|---|---|---|
| 5.1 | Create GST invoice | Playwright: /invoices new, select indian_gst client, add line items | Invoice created with CGST+SGST, correct total |
| 5.2 | Create International invoice | Playwright: select international client, add line items | Invoice in client's currency, no tax |
| 5.3 | Create Non-GST invoice | Playwright: select indian_non_gst client | No GST breakdown |
| 5.4 | Create Pro Forma invoice | Playwright: select Pro Forma type | Invoice saved with pro_forma type, not in outstanding |
| 5.5 | Invoice number auto-generation | Code review: number-generator.ts + Playwright test | Sequential numbering (WD/2025-26/001 format), no duplicates |
| 5.6 | Invoice number for different types | Create invoices of each type | Different prefixes or series per type |
| 5.7 | Line item add/remove | Playwright: add 3 items, remove middle one | Totals recalculate correctly |
| 5.8 | Line item with service from catalogue | Playwright: select service, verify rate auto-fills | Service rate and HSN code populate |
| 5.9 | Invoice status transitions | Playwright: draft -> finalized -> sent -> paid | Each status change persists, badges update |
| 5.10 | Invoice finalization locks editing | Playwright: finalize invoice, attempt edit | Edit restricted or changes limited post-finalization |
| 5.11 | Invoice detail page | Playwright: navigate to /invoices/[id] | All fields display correctly, payment history sidebar works |
| 5.12 | Invoice edit page | Playwright: navigate to /invoices/[id]/edit | Form pre-populated with all existing data |
| 5.13 | Retainer auto-draft | Code review: use-invoices.ts retainer logic | Invoices auto-generated for retainer clients on billing_day |
| 5.14 | Invoice list filters | Playwright: test status tabs, search, type filter, date filter | Each filter works independently and in combination |
| 5.15 | CSV export | Playwright: click Download CSV on invoice list | CSV file downloads with correct data including TDS column |
| 5.16 | Invoice archiving | Playwright: archive an invoice | Status changes to "archived", removed from active lists |
| 5.17 | Duplicate invoice detection | Create two invoices with same client/amount/date | No hard block needed, but no duplicate numbers generated |

### Deliverable
- Invoice engine test results
- Invoice number sequence verification
- Tax calculation verification for all 4 invoice types

---

## Phase 6: Payment and Multi-Currency Audit

**Agent:** Functional Tester + Financial Auditor
**Dependencies:** Phase 5 (need invoices to exist)
**Estimated duration:** 60 minutes

### Test Cases

| ID | Test | Method | Pass Criteria |
|---|---|---|---|
| 6.1 | Record payment (full) | Playwright: select invoice, record payment for full amount | Invoice status -> "paid", balance = 0 |
| 6.2 | Record payment (partial) | Playwright: record payment less than balance | Invoice status -> "partially_paid", balance decremented |
| 6.3 | Record multiple partial payments | Playwright: record 3 partial payments on one invoice | Running balance correct after each |
| 6.4 | Payment with TDS deduction | Playwright: record payment with TDS percentage/amount | Net received = gross - TDS; TDS amount tracked separately |
| 6.5 | Payment in INR | Playwright: payment on INR invoice | Rs symbol, Indian formatting |
| 6.6 | Payment in USD | Playwright: payment on USD invoice | $ symbol, standard formatting |
| 6.7 | Payment in AED | Playwright: payment on AED invoice | AED symbol/prefix |
| 6.8 | Payment in GBP | Playwright: payment on GBP invoice | Pound symbol |
| 6.9 | Skydo integration indicator | Code review + Playwright | Skydo payment method/flag available for international payments |
| 6.10 | Payment list page | Playwright: navigate to /payments | All payments listed with correct amounts, dates, client names |
| 6.11 | Payment date validation | Playwright: try future date, try date before invoice date | Appropriate validation or acceptance |
| 6.12 | Payment method tracking | Playwright: check if payment method field exists (bank transfer, UPI, wire, etc.) | Method stored and displayed |
| 6.13 | Payment-Invoice reconciliation | Playwright: check payment links back to invoice | Payment row links to correct invoice |
| 6.14 | Delete payment | Playwright: delete a recorded payment | Invoice balance recalculated, status reverts if needed |
| 6.15 | Overdue detection | Code review: how overdue status is determined | Invoices past due_date with balance > 0 marked overdue |
| 6.16 | Payment stats on /payments | Playwright: verify stat cards | Total collected, this month, overdue amount - all match data |

### Deliverable
- Payment flow test results
- Multi-currency handling assessment
- TDS calculation verification
- Reconciliation accuracy report

---

## Phase 7: Expense Management and Bank Statement Parsing

**Agent:** Functional Tester + Code Analyst
**Dependencies:** Phase 1 (need auth)
**Estimated duration:** 60 minutes

### Test Cases

| ID | Test | Method | Pass Criteria |
|---|---|---|---|
| 7.1 | Expense list page | Playwright: navigate to /expenses | Category breakdown charts and transaction list render |
| 7.2 | Manual expense entry | Playwright: add expense manually (if supported) | Expense saved with amount, category, date |
| 7.3 | Bank statement upload | Playwright: navigate to /expenses/upload, upload idfc-statement.xlsx | File parsed, transactions displayed for review |
| 7.4 | IDFC statement parsing accuracy | Code review: bank-statement.ts | Column mapping correct for IDFC format (date, description, debit, credit, balance) |
| 7.5 | Auto-categorization | Code review: auto-categorize.ts | Rules match common descriptions to categories (rent, salaries, software, etc.) |
| 7.6 | Category assignment UI | Playwright: check categorization on parsed transactions | Categories auto-assigned, manual override available |
| 7.7 | Transaction approval/import | Playwright: approve parsed transactions | Transactions move from upload staging to expense records |
| 7.8 | Category breakdown chart | Playwright: verify pie/bar chart on /expenses | Chart data matches sum of transactions per category |
| 7.9 | Expense transactions page | Playwright: navigate to /expenses/transactions | All imported transactions listed with filters |
| 7.10 | Date range filtering | Playwright: apply date filters on expenses | Only transactions in range shown, totals recalculate |
| 7.11 | Duplicate upload detection | Playwright: upload same statement twice | Duplicates detected or user warned |
| 7.12 | Custom categorization rules | Code review: rule creation flow | User can create rules (if description contains X, assign category Y) |
| 7.13 | Non-IDFC statement handling | Playwright: upload a non-IDFC XLSX | Graceful error or format detection message |
| 7.14 | Large file handling | Code review: any file size limits or pagination | Upload does not crash on large statements |

### Deliverable
- Bank statement parsing accuracy report
- Auto-categorization rule coverage assessment
- Expense tracking completeness evaluation

---

## Phase 8: Cross-Module Data Flow and Interlinking

**Agent:** Code Analyst + Functional Tester
**Dependencies:** Phases 3, 5, 6, 7
**Estimated duration:** 60 minutes

### Test Cases

| ID | Test | Method | Pass Criteria |
|---|---|---|---|
| 8.1 | Client -> Projects linkage | Playwright: client detail Projects tab | Shows all projects for this client |
| 8.2 | Client -> Invoices linkage | Playwright: client detail Invoices tab | Shows all invoices for this client |
| 8.3 | Client -> Payments linkage | Playwright: client detail Payments tab | Shows all payments from this client |
| 8.4 | Project -> Invoices linkage | Playwright: project detail (if exists) | Shows invoices linked to project |
| 8.5 | Invoice -> Payment recording | Playwright: from invoice detail, record payment | Payment creates, invoice balance updates |
| 8.6 | Invoice -> Client back-link | Playwright: invoice detail shows client name as link | Clicking client name navigates to client detail |
| 8.7 | Dashboard KPIs reflect data | Playwright: create new invoice, check dashboard | Revenue/outstanding KPIs update |
| 8.8 | Pipeline scheduled invoices | Playwright: /pipeline shows upcoming invoices | Retainer invoices scheduled based on billing_day |
| 8.9 | Pipeline collections | Playwright: /pipeline collections tab | Overdue and due-soon invoices listed correctly |
| 8.10 | Deleting client with projects/invoices | Playwright: attempt to delete client with linked data | Either blocked with explanation or cascade handled |
| 8.11 | Expense -> Analytics P&L | Playwright: add expense, check /analytics/pl | P&L expense total includes new expense |
| 8.12 | Service -> Invoice line item | Playwright: create invoice using catalogue service | HSN code and rate carry through to invoice and PDF |
| 8.13 | Contract -> Client linkage | Playwright: contract linked to client, check client detail | Contract visible in client context |
| 8.14 | Target -> Revenue tracking | Playwright: set revenue target, verify progress from actual revenue | Progress percentage = actual_revenue / target * 100 |
| 8.15 | Orphan detection | Code review: foreign key constraints in migrations | All FK relationships have appropriate ON DELETE behavior |

### Deliverable
- Module interlinking matrix (which modules connect to which)
- Data flow diagram with any broken links identified
- Orphan risk assessment

---

## Phase 9: Analytics and Reporting Accuracy

**Agent:** Financial Auditor + Functional Tester
**Dependencies:** Phases 4, 5, 6, 7
**Estimated duration:** 75 minutes

### 9A: Analytics Pages

| ID | Test | Method | Pass Criteria |
|---|---|---|---|
| 9A.1 | Analytics overview | Playwright: /analytics | Main dashboard renders with charts and KPIs |
| 9A.2 | Invoice analytics | Playwright: /analytics/invoices | Invoice breakdown by status, type, month - matches raw data |
| 9A.3 | Expense analytics | Playwright: /analytics/expenses | Category breakdown matches expense records |
| 9A.4 | Client analytics | Playwright: /analytics/clients | Client health, revenue per client, payment behavior |
| 9A.5 | Project analytics | Playwright: /analytics/projects | Project-level revenue and expense breakdown |
| 9A.6 | P&L statement | Playwright: /analytics/pl | Revenue minus expenses = correct net profit per month |
| 9A.7 | Balance sheet | Playwright: /analytics/balance | Assets, liabilities, equity columns render; dynamic fields correct |
| 9A.8 | Chart data verification | Playwright: compare chart values with raw table data | No discrepancies between charts and data tables |
| 9A.9 | Date range filtering on analytics | Playwright: change date range on analytics pages | Charts and numbers update correctly |
| 9A.10 | Empty state analytics | Consider: what shows if no data for selected period | Meaningful empty states, not broken charts |
| 9A.11 | MoM comparison accuracy | Code review: use-analytics.ts MoM calculations | Current month vs previous month delta correct in both value and direction |

### 9B: Investor Reports

| ID | Test | Method | Pass Criteria |
|---|---|---|---|
| 9B.1 | Reports list page | Playwright: /reports | List of generated/available reports |
| 9B.2 | Generate monthly report | Playwright: click generate for a month | Report data collected, PDF generation triggered |
| 9B.3 | Report data accuracy | Code review: use-reports.ts data collection | Report pulls correct month's revenue, expenses, clients, projects |
| 9B.4 | Report PDF content | Review generated PDF (Phase 10 overlap) | All sections populated: revenue, expenses, P&L, client breakdown |
| 9B.5 | Report email flow (template only) | Code review: email template for report distribution | Template renders with correct data placeholders |
| 9B.6 | Historical reports | Playwright: check if past months' reports are accessible | Reports list shows history |
| 9B.7 | Report type support | Code review: migration 008_investor_report_type | Type field used correctly |

### 9C: SQL View Verification

| ID | Check | Method | Pass Criteria |
|---|---|---|---|
| 9C.1 | monthly_pl_view accuracy | Code review: migration 004_analytics.sql | Revenue from paid invoices, expenses from expense_transactions, grouped by month |
| 9C.2 | All 9 SQL views verified | Code review: all view definitions | Each view's SELECT logic produces correct aggregations |
| 9C.3 | View usage in hooks | Code review: use-analytics.ts | Hooks query views correctly, no client-side re-aggregation errors |

### Deliverable
- Analytics accuracy report (per page, per metric)
- P&L verification with sample manual calculation
- SQL view audit results
- Investor report completeness assessment

---

## Phase 10: PDF Generation Audit

**Agent:** Functional Tester + Code Analyst
**Dependencies:** Phase 5 (invoices), Phase 3D (contracts), Phase 9B (reports)
**Estimated duration:** 45 minutes

### Test Cases

| ID | Test | Method | Pass Criteria |
|---|---|---|---|
| 10.1 | GST Invoice PDF | Playwright: generate PDF for GST invoice | PDF downloads, contains: company header, client details, line items, CGST/SGST breakdown, total, bank details |
| 10.2 | International Invoice PDF | Playwright: generate for international invoice | PDF in client's currency, no GST section, correct currency symbol |
| 10.3 | Non-GST Invoice PDF | Playwright: generate for non-GST invoice | No GST fields, clean layout |
| 10.4 | Pro Forma Invoice PDF | Playwright: generate for pro forma | Clearly marked as Pro Forma, not "Tax Invoice" |
| 10.5 | Invoice PDF with many line items | Create invoice with 10+ line items, generate PDF | Pagination works, all items visible, totals on last page |
| 10.6 | Contract PDF | Playwright: generate contract PDF | Template content rendered, client/project details filled, terms included |
| 10.7 | Investor Report PDF | Playwright: generate report PDF | All sections: revenue summary, P&L, expense breakdown, client overview |
| 10.8 | PDF NaN/null safety | Code review: invoice-pdf.tsx, contract-pdf.tsx, report-pdf.tsx | All numeric fields have fallback values, no NaN/undefined in output |
| 10.9 | PDF formatting | Visual review of generated PDFs | Professional appearance, aligned columns, readable fonts, WODO branding |
| 10.10 | PDF preview modal | Playwright: open PDF preview before download | Modal renders PDF correctly |
| 10.11 | Currency formatting in PDFs | Check all 4 currency PDFs | Correct symbols and number formatting per currency |

### Deliverable
- PDF sample collection (one per type)
- Visual quality assessment
- Data accuracy in PDFs vs database records

---

## Phase 11: Email System and Templates

**Agent:** Code Analyst
**Dependencies:** None (code review only - SMTP not configured)
**Estimated duration:** 30 minutes

### Test Cases

| ID | Check | Method | Pass Criteria |
|---|---|---|---|
| 11.1 | Email client configuration | Code review: src/lib/email/client.ts | Nodemailer configured for Microsoft 365 SMTP (smtp.office365.com:587) |
| 11.2 | Invoice email template | Code review: src/lib/email/templates.ts | Professional HTML template with invoice details, amount, due date |
| 11.3 | Report distribution template | Code review: templates.ts | Investor report email template with month/year, summary metrics |
| 11.4 | Email send API route | Code review: src/app/api/email/send/route.ts | Auth check, input validation, error handling, rate limiting |
| 11.5 | Invoice email send flow | Code review: src/app/api/invoices/[id]/send-email/route.ts | Attaches PDF, sends to client billing_emails, records activity |
| 11.6 | Email activity tracking | Code review: src/app/api/invoices/[id]/email-activity/route.ts + use-email-activity.ts | Sent/opened/failed status tracked per invoice |
| 11.7 | Send Invoice UI component | Code review: send-invoice-dropdown.tsx, send-invoice-email-modal.tsx | Modal shows recipient, subject, preview; handles SMTP-not-configured gracefully |
| 11.8 | Template HTML validity | Review template HTML | No broken tags, responsive email layout, inline CSS |
| 11.9 | Template variable injection | Code review | All {{variable}} placeholders map to actual data fields |
| 11.10 | Error handling when SMTP not configured | Code review | Graceful error message to user, not a crash |

### Deliverable
- Email system readiness assessment
- Template quality review
- List of issues to fix before SMTP activation

---

## Phase 12: UX, Accessibility, and Responsiveness

**Agent:** UX Reviewer (Playwright + Visual)
**Dependencies:** Phase 1 (need auth)
**Estimated duration:** 90 minutes

### 12A: Desktop UX Review (per page)

For EACH of the following pages, verify:

**Pages to review:** /dashboard, /clients, /clients/[id], /invoices, /invoices/[id], /payments, /expenses, /expenses/upload, /expenses/transactions, /projects, /pipeline, /contracts, /targets, /settings, /onboard, /reports, /analytics (+ 6 sub-pages), /tds

| ID | Check | Pass Criteria |
|---|---|---|
| 12A.1 | Visual consistency | Glass-card styling used consistently, accent color (#fd7e14) only on CTAs |
| 12A.2 | Loading states | Skeleton loaders shown while data fetches, not blank screens |
| 12A.3 | Empty states | Meaningful empty state illustrations/messages when no data |
| 12A.4 | Toast notifications | Success/error toasts (sonner) shown on all CRUD operations |
| 12A.5 | Navigation clarity | TopNavV2 highlights current page, breadcrumbs present where needed |
| 12A.6 | Button clarity | No redundant buttons, clear labels, destructive actions use red/warning style |
| 12A.7 | Form UX | Labels clear, placeholder text helpful, error messages adjacent to fields |
| 12A.8 | Modal UX | Modals closable via X, Escape, and backdrop click; content scrollable if long |
| 12A.9 | Table UX | Sortable columns indicated, clickable rows have hover state, actions accessible |
| 12A.10 | Page titles | Browser tab shows meaningful title per page |

### 12B: Mobile Responsiveness (375px viewport)

Test each major page at 375px width:

| ID | Check | Pass Criteria |
|---|---|---|
| 12B.1 | Navigation | TopNavV2 collapses to hamburger or scrollable pills |
| 12B.2 | KPI cards | Stack vertically, no horizontal overflow |
| 12B.3 | Data tables | Horizontally scrollable or card layout, no text truncation that loses meaning |
| 12B.4 | Forms | Full-width inputs, no horizontal scroll on form pages |
| 12B.5 | Charts | Readable at mobile width, legends don't overlap |
| 12B.6 | Modals | Full-screen or near-full on mobile, inputs usable |
| 12B.7 | FAB (Floating Action Button) | Positioned correctly, doesn't overlap content |
| 12B.8 | PDF preview | Usable at mobile width (scroll/zoom available) |
| 12B.9 | Touch targets | Buttons and links at least 44x44px touch area |
| 12B.10 | Text readability | No text smaller than 14px on mobile |

### 12C: Accessibility

| ID | Check | Method | Pass Criteria |
|---|---|---|---|
| 12C.1 | Color contrast | Playwright: check text-on-glass-card contrast ratios | Minimum 4.5:1 for body text, 3:1 for large text |
| 12C.2 | Keyboard navigation | Playwright: tab through pages | All interactive elements focusable and operable |
| 12C.3 | Form labels | Code review | All inputs have associated labels or aria-label |
| 12C.4 | Alt text on images | Code review | All img tags have meaningful alt text |
| 12C.5 | Focus indicators | Playwright: tab through elements | Visible focus ring on all focusable elements |
| 12C.6 | Screen reader landmarks | Code review | Proper use of main, nav, section, header, footer |
| 12C.7 | Error announcements | Code review | Form errors use aria-live or role="alert" |

### Deliverable
- Per-page UX scorecard (10-point scale)
- Mobile responsiveness test results with screenshots
- Accessibility compliance summary
- Prioritized UX improvement recommendations

---

## Phase 13: Error Handling and Edge Cases

**Agent:** Functional Tester + Debugger
**Dependencies:** Phase 1 (runs alongside other phases)
**Estimated duration:** 60 minutes (distributed)

### Test Cases

| ID | Test | Method | Pass Criteria |
|---|---|---|---|
| 13.1 | Empty database state | Playwright: consider all pages with zero records | No crashes, meaningful empty states |
| 13.2 | Single record state | Playwright: one client, one invoice, one payment | Averages and percentages still render correctly |
| 13.3 | Invalid URL parameters | Playwright: navigate to /clients/invalid-uuid | 404 page or error message, not crash |
| 13.4 | Network error simulation | Playwright: test offline behavior or slow connections | Loading states persist, error messages shown on failure |
| 13.5 | Form double-submit | Playwright: click submit rapidly twice | No duplicate records created |
| 13.6 | Browser back/forward | Playwright: navigate through pages, use back button | Pages render correctly, no stale state |
| 13.7 | Concurrent tab editing | Open same record in two tabs, edit in both | Last write wins or conflict detection |
| 13.8 | Very long text inputs | Playwright: enter 5000-char company name | Handled gracefully (truncation or validation) |
| 13.9 | Special characters | Playwright: use &, <, >, ", ' in all text fields | No XSS, no rendering issues, data preserved |
| 13.10 | Negative numbers | Playwright: enter negative amounts in financial fields | Blocked by validation or handled correctly |
| 13.11 | Zero amount invoice | Playwright: create invoice with 0 amount | Either blocked or handled (no division errors) |
| 13.12 | Date edge cases | Playwright: try Feb 29, Dec 31, Jan 1 | Dates handled correctly |
| 13.13 | Console errors | Playwright: check browser console on every page | Zero errors (warnings acceptable if from third-party) |
| 13.14 | 404 page | Playwright: navigate to /nonexistent-page | Branded 404 page renders (not-found.tsx) |
| 13.15 | Large dataset performance | Playwright: measure page load times | All pages load in under 3 seconds |
| 13.16 | Broken FK references | Code review: what happens if referenced client is deleted | No broken UI, graceful handling |

### Deliverable
- Edge case test matrix (pass/fail)
- Console error log
- Performance timing report

---

## Phase 14: Investor Readiness Assessment

**Agent:** Lead Auditor (synthesis)
**Dependencies:** All prior phases
**Estimated duration:** 45 minutes

### Assessment Criteria

| ID | Criterion | Source Phases | Assessment |
|---|---|---|---|
| 14.1 | Data accuracy | Phases 4, 6, 9 | Are financial numbers trustworthy for investor presentation? |
| 14.2 | Report quality | Phase 9B, 10 | Are investor reports comprehensive, professional, and accurate? |
| 14.3 | P&L reliability | Phase 9A.6 | Does P&L correctly calculate from revenue and expenses? |
| 14.4 | Revenue recognition correctness | Phase 4.11 | Is revenue recognized only on payment, not on invoice creation? |
| 14.5 | Multi-currency integrity | Phase 6 | Are foreign currency amounts handled without conversion errors? |
| 14.6 | Historical data auditability | Phase 9 | Can past months' data be reviewed and verified? |
| 14.7 | Professional appearance | Phase 10, 12 | Do PDFs and UI look polished enough for investor eyes? |
| 14.8 | Data completeness | Phase 8 | Are all modules connected - no orphaned data or missing relationships? |
| 14.9 | Error resilience | Phase 13 | Will the system crash during a demo or presentation? |
| 14.10 | Reporting cadence | Phase 9B | Can monthly reports be generated reliably and consistently? |
| 14.11 | Audit trail | Code review | Are important actions (invoice creation, payment recording, status changes) timestamped? |
| 14.12 | Security posture | Phase 1 | Is data protected from unauthorized access? |

### Deliverable
- Investor readiness score (1-10 scale with justification)
- Critical blockers that MUST be fixed before investor presentation
- Recommended improvements prioritized by impact

---

## Execution Schedule

### Round 1 (Parallel - no dependencies)
| Phase | Agent | Est. Time |
|---|---|---|
| Phase 1: Auth & Access | Security Reviewer | 30 min |
| Phase 2: Static Analysis | Code Analyst | 45 min |
| Phase 11: Email System | Code Analyst | 30 min |
| Phase 12: UX/Responsiveness | UX Reviewer | 90 min |

### Round 2 (After Phase 1 completes - partially parallel)
| Phase | Agent | Est. Time |
|---|---|---|
| Phase 3: Core CRUD | Functional Tester | 90 min |
| Phase 4: Financial Logic | Financial Auditor | 60 min |
| Phase 7: Expenses | Functional Tester | 60 min |
| Phase 13: Edge Cases | Debugger | 60 min (distributed) |

### Round 3 (After Phase 3 completes)
| Phase | Agent | Est. Time |
|---|---|---|
| Phase 5: Invoice Engine | Functional Tester | 75 min |

### Round 4 (After Phase 5 completes)
| Phase | Agent | Est. Time |
|---|---|---|
| Phase 6: Payments | Functional Tester | 60 min |
| Phase 10: PDF Generation | Functional Tester | 45 min |

### Round 5 (After Phases 4-7 complete)
| Phase | Agent | Est. Time |
|---|---|---|
| Phase 8: Cross-Module Flow | Code Analyst | 60 min |
| Phase 9: Analytics & Reporting | Financial Auditor | 75 min |

### Round 6 (Final synthesis)
| Phase | Agent | Est. Time |
|---|---|---|
| Phase 14: Investor Readiness | Lead Auditor | 45 min |

**Total estimated audit time:** ~13 hours of agent work
**With parallelization:** ~6-7 hours wall clock

---

## Final Deliverable Structure

The completed audit will produce a single comprehensive report with the following structure:

```
WODO_ALLY_AUDIT_REPORT.md
===========================

1. Executive Summary
   - Overall health score (1-100)
   - Critical findings count
   - Investor readiness rating (1-10)
   - Top 5 most urgent fixes

2. Module-by-Module Findings
   For each of the 16 modules:
   - Test cases executed and results (pass/fail/partial)
   - Issues found with severity (Critical/High/Medium/Low)
   - Screenshots of failures
   - Recommended fixes

3. Financial Integrity Report
   - Calculation accuracy matrix
   - Tax logic verification
   - Multi-currency handling assessment
   - P&L accuracy verification

4. Cross-Module Integration Report
   - Data flow diagram
   - Broken linkages
   - Orphan risks

5. UX and Accessibility Report
   - Per-page scorecard
   - Mobile responsiveness results
   - Accessibility compliance summary
   - Prioritized improvement list

6. Security Assessment
   - Authentication audit
   - RLS policy coverage
   - Input sanitization review
   - Secrets exposure check

7. PDF and Email Quality
   - PDF samples per type
   - Template quality assessment
   - Email system readiness

8. Performance Baseline
   - Page load times
   - Console error inventory

9. Investor Readiness Assessment
   - Readiness score with justification
   - Critical blockers
   - Recommended improvements by priority

10. Appendix
    - Full test case matrix (all ~170 test cases)
    - Raw console logs
    - Screenshot gallery
```

---

## Execution Notes for Agents

### Playwright Test Setup
```javascript
// Base configuration for all Playwright tests
const BASE_URL = 'https://wodo-ally-production.up.railway.app';
const CREDENTIALS = {
  email: 'accounts@wodo.digital',
  password: 'WodoAlly@2026'
};

// Login helper - run before every test session
async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', CREDENTIALS.email);
  await page.fill('input[type="password"]', CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}
```

### Source Code References
- **Hooks (business logic):** /Users/shyam/Desktop/Claude Dev Projects/WODO Ally/src/lib/hooks/
- **PDF generators:** /Users/shyam/Desktop/Claude Dev Projects/WODO Ally/src/lib/pdf/
- **Formatting utilities:** /Users/shyam/Desktop/Claude Dev Projects/WODO Ally/src/lib/utils/format.ts
- **Database types:** /Users/shyam/Desktop/Claude Dev Projects/WODO Ally/src/types/database.ts
- **Migrations:** /Users/shyam/Desktop/Claude Dev Projects/WODO Ally/supabase/migrations/
- **Email system:** /Users/shyam/Desktop/Claude Dev Projects/WODO Ally/src/lib/email/
- **Page components:** /Users/shyam/Desktop/Claude Dev Projects/WODO Ally/src/app/(dashboard)/

### Severity Definitions
- **Critical:** Financial calculation errors, data loss risks, security vulnerabilities, features that crash
- **High:** Incorrect data display, broken cross-module links, missing validation on financial inputs
- **Medium:** UX issues affecting workflow, missing loading/empty states, minor formatting errors
- **Low:** Visual polish, accessibility improvements, non-blocking UX suggestions

### Rules for All Agents
1. Never use em dashes - use hyphens
2. Use absolute file paths in all references
3. Screenshot every failure
4. Record exact steps to reproduce each issue
5. Note both the problem AND the specific file/line to fix
6. Distinguish between "bug" (broken behavior) and "gap" (missing feature)
7. If unsure whether something is intended behavior, flag it as "Needs Clarification"
