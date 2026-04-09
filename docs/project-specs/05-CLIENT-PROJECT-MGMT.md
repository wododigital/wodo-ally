# 05 - Client & Project Management

## Client Onboarding Flow

### Client List Page (`/clients`)

- Glass card grid/table view with search and filters
- Filters: client_type, region, status, health_score range
- Each card shows: company name, type badge, active project count, total revenue, health score indicator
- "Add Client" button (accent) opens form

### Client Form (`/clients/new` and `/clients/[id]`)

Tabbed form inside glass card:

**Tab 1: Company Info**
- Company Name (required)
- Display Name (short name)
- Client Type: dropdown (Indian GST / Indian Non-GST / International)
- Region: dropdown (India / USA / UAE / UK / Other)
- Currency: auto-set based on region (INR/USD/AED/GBP), editable
- Address, City, State, Country, Pincode
- GSTIN (show only if Indian GST)
- Tax Number + Tax Number Label (show only if International, e.g., "EIN" for USA, "TRN" for UAE)

**Tab 2: Contacts**
- Dynamic list of contacts (add/remove)
- Each: Name, Email, Phone, Designation
- Checkboxes: Is Primary, Is Billing Contact
- At least one billing contact required

**Tab 3: Notes & Settings**
- Free text notes
- Status toggle (Active/Inactive)

### Client Detail Page (`/clients/[id]`)

Layout: Client header card + tabbed content below

Header: Company name, type badge, region flag, health score donut, status

Tabs:
- **Overview**: Key stats (total invoiced, total received, outstanding, projects count), recent activity timeline
- **Projects**: List of all projects with status pills
- **Invoices**: Filtered invoice list for this client
- **Payments**: Payment history with deduction breakdowns
- **TDS Certificates**: Quarter-wise tracking grid (FY selector, Q1-Q4 received/pending)
- **Contracts**: All contracts with this client

## Project Management

### Project Form

When creating a project, the form adapts based on `engagement_type`:

**For One-Time Projects:**
- Project name, description, project_type dropdown
- Total value (in client's currency)
- Payment split: Predefined options or custom
  - 50-50, 50-30-20, 100% upfront, Custom (user enters percentages)
- Timeline in working days
- Projected completion date (auto-calculated from start + timeline days)

**For Retainer Projects:**
- Project name, description, project_type dropdown
- Monthly retainer amount
- Billing cycle (Monthly / Quarterly / Annual)
- Contract start date, minimum contract months
- Auto-calculate contract end date

### Project Status Lifecycle

**One-Time Projects:**
```
Onboarding -> Design Phase -> Development Phase -> Deployment & QA -> Maintenance -> Completed
```

**Retainer Projects:**
```
Onboarding -> Setup & Strategy -> Active Execution -> (loops monthly) -> Completed/Churned
```

Status changes are manual via dropdown but validated (can't skip phases, can always go to on_hold or cancelled).

### Project Detail Page (`/projects/[id]`)

- Project header with status, client link, dates, value
- Phase timeline (visual progress bar showing current phase)
- Linked invoices section
- Notes section
- For retainers: Show contract term remaining, next invoice date
- Analytics: Time to completion vs projected, payment on-time rate

## Client Health Score Calculation

Auto-calculated periodically (or on payment events). Score 0-100:

- Payment timeliness: 40% weight
  - Paid before due: +40
  - Paid within 7 days of due: +30
  - Paid within 30 days: +15
  - 30+ days overdue: 0
- Volume/Retention: 30% weight
  - Active retainer: +30
  - Multiple projects: +25
  - Single completed project: +15
  - No active projects: +5
- Communication: 30% weight
  - Responsive to invoices (viewed within 3 days): +30
  - Moderate response: +15
  - No response tracking: +15 (neutral)

Display as: Excellent (80+), Good (60-79), Average (40-59), At Risk (20-39), Poor (0-19)

Color code: green/accent/yellow/orange/red
