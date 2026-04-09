# WODO Ally - Clients Module Documentation

Complete reference guide for all client-related features, components, and actions in the WODO Ally application.

---

## Database Models

### Tables

#### `clients` - Main Client Table
**Columns:**
- `id` (UUID) - Primary key
- `company_name` (TEXT) - Required, unique identifier
- `display_name` (TEXT) - Optional alternate display name
- `client_type` (TEXT) - Required: `indian_gst` | `indian_non_gst` | `international`
- `region` (TEXT) - Required: `india` | `usa` | `uae` | `uk` | `other`
- `currency` (TEXT) - Default: `INR`, options: `INR` | `USD` | `AED` | `GBP` | `EUR`
- `address` (TEXT) - Street address
- `city` (TEXT) - City
- `state` (TEXT) - State/Province
- `country` (TEXT) - Default: `India`
- `pincode` (TEXT) - ZIP/Postal code
- `gstin` (TEXT) - GST number (required for indian_gst type)
- `tax_number` (TEXT) - For international clients
- `tax_number_label` (TEXT) - Label for tax number (e.g., "ABN", "ABF")
- `signing_authority` (TEXT) - Legal signatory name
- `designation` (TEXT) - Signatory designation
- `billing_emails` (TEXT[]) - Array of billing contact emails
- `phone` (TEXT) - Phone number
- `website` (TEXT) - Company website
- `notes` (TEXT) - Internal notes
- `health_score` (INTEGER) - 0-100 health metric (default: 50)
- `billing_day` (INTEGER) - Day of month for retainer billing (null = one-time)
- `status` (TEXT) - `active` | `inactive` | `churned` | `closed`
- `created_at` (TIMESTAMPTZ) - Timestamp
- `updated_at` (TIMESTAMPTZ) - Timestamp
- `created_by` (UUID) - References profiles table

**Indexes:**
- `idx_clients_status` - Status filtering
- `idx_clients_type` - Type filtering

**RLS Policies:**
- Authenticated users can view clients
- Admin/Manager can manage clients

#### `client_contacts` - Client Team Members
**Columns:**
- `id` (UUID) - Primary key
- `client_id` (UUID) - Foreign key to clients (ON DELETE CASCADE)
- `name` (TEXT) - Contact name
- `email` (TEXT) - Email address
- `phone` (TEXT) - Phone number
- `designation` (TEXT) - Job title
- `is_primary` (BOOLEAN) - Primary contact flag
- `is_billing_contact` (BOOLEAN) - Billing contact flag
- `created_at` (TIMESTAMPTZ) - Timestamp

**Usage:** Store multiple contacts per client (sorted by is_primary DESC)

#### `tds_certificates` - TDS Certificate Management
**Columns:**
- `id` (UUID) - Primary key
- `client_id` (UUID) - Foreign key to clients
- `financial_year` (TEXT) - e.g., "2025-26"
- `quarter` (INTEGER) - 1-4
- `certificate_received` (BOOLEAN) - Whether certificate is received
- `received_date` (DATE) - When certificate was received
- `amount` (NUMERIC) - TDS amount in INR
- `file_url` (TEXT) - URL to certificate file in Supabase storage
- `notes` (TEXT) - Additional notes
- `created_at` (TIMESTAMPTZ) - Timestamp

**Storage:** Files stored in `documents` bucket at path: `tds/{clientId}/{fy}-Q{quarter}-{timestamp}.{ext}`

### Views

#### `revenue_by_client_view` - Client Revenue Analytics
**Returns:**
- `client_id` (UUID)
- `client_name` (TEXT)
- `invoice_count` (INTEGER) - Total invoices sent (excludes drafts)
- `total_invoiced` (NUMERIC) - Sum of all invoice amounts
- `total_collected` (NUMERIC) - Sum of received payments (in INR)
- `avg_days_to_payment` (NUMERIC) - Average days to payment for paid invoices

**Query:** Revenue from invoices + payments (paid invoices only)

#### `client_health_scores` - Client Health & Payment Behavior
**Returns:**
- `client_id` (UUID)
- `client_name` (TEXT)
- `paid_count` (INTEGER) - Total paid invoices
- `on_time_count` (INTEGER) - Paid on or before due date
- `overdue_count` (INTEGER) - Overdue invoices
- `avg_payment_days` (NUMERIC) - Average days to payment
- `total_collected` (NUMERIC) - Total amount collected
- `on_time_pct` (NUMERIC) - On-time payment percentage
- `health_score` (NUMERIC) - Calculated health score (0-100)

**Health Score Calculation:**
```
Formula: (on_time_pct + (100 - avg_payment_days/payment_terms) + collection_rate) / 3
Categories:
- >= 80: Premium (Excellent)
- >= 60: Growth (Good)
- >= 40: Standard (Fair)
- < 40: At Risk
```

---

## Core Hooks

### File: `src/lib/hooks/use-clients.ts`

#### 1. **useClients()**
Fetch all clients, ordered by most recent first.
```typescript
// Usage
const { data: clients, isLoading, error } = useClients();

// Returns: Client[]
// Ordered by created_at DESC
```
- Type: Query (TanStack)
- Caching: Invalidated on create/update/delete

#### 2. **useClient(id)**
Fetch single client with all contacts.
```typescript
// Usage
const { data: client } = useClient("client-id");

// Returns: ClientWithContacts
// {
//   ...clientData,
//   client_contacts: ClientContact[]
// }
```
- Refetch on mount: Always (fresh data)
- Enabled: Only if id is truthy

#### 3. **useClientStats(id)**
Calculate financial stats for a specific client.
```typescript
// Usage
const { data: stats } = useClientStats("client-id");

// Returns: ClientStats
// {
//   total_invoiced: 50000,
//   total_received: 35000,
//   outstanding: 15000
// }
```

**Calculation Logic:**
```typescript
// All invoices (excluding cancelled)
total_invoiced = SUM(invoice.total_amount)
total_received = SUM(invoice.total_received)
outstanding = SUM(invoice.balance_due)
```

#### 4. **useCreateClient()**
Create a new client with optional contacts.
```typescript
// Usage
const createClient = useCreateClient();

await createClient.mutateAsync({
  client: {
    company_name: "ABC Corp",
    display_name: "ABC",
    client_type: "indian_gst",
    region: "india",
    currency: "INR",
    gstin: "27AAFCD5055K1Z5",
    city: "Bangalore",
    country: "India",
    billing_emails: ["bill@abc.com"],
    status: "active"
  },
  contacts: [
    {
      name: "John Doe",
      email: "john@abc.com",
      phone: "+91-80-1234-5678",
      designation: "Manager",
      is_primary: true,
      is_billing_contact: true
    }
  ]
});
```

**Validation (Zod Schema):**
- `company_name` - Required, minimum 1 char
- `region` - Required, enum: india | usa | uae | uk | other
- `currency` - Required, enum: INR | USD | AED | GBP
- `client_type` - Required, enum: indian_gst | indian_non_gst | international
- `gstin` - Required only if client_type === indian_gst
- `billing_email` - Optional, must be valid email

#### 5. **useUpdateClient()**
Update existing client details.
```typescript
// Usage
const updateClient = useUpdateClient();

await updateClient.mutateAsync({
  id: "client-id",
  data: {
    company_name: "ABC Corp Updated",
    phone: "+91-80-9876-5432",
    billing_day: 15  // For retainer billing
  }
});
```

- Invalidates both `["clients"]` and `["clients", id]` caches
- Auto-toast on success/error

#### 6. **useCloseClient(id)**
Close a client (mark as closed).
```typescript
// Usage
const closeClient = useCloseClient("client-id");

await closeClient.mutateAsync();

// Sets status: "closed"
```

- Irreversible action (use reactivateClient to undo)
- Requires confirmation modal

#### 7. **useReactivateClient(id)**
Reactivate a closed or inactive client.
```typescript
// Usage
const reactivateClient = useReactivateClient("client-id");

await reactivateClient.mutateAsync();

// Sets status: "active"
```

#### 8. **useDeleteClient(id)**
Permanently delete a client.
```typescript
// Usage
const deleteClient = useDeleteClient("client-id");

await deleteClient.mutateAsync("client-id");
```

- Hard delete (not reversible)
- Cascades to client_contacts
- Only use for test/cleanup data

---

## Pages

### `/clients` - Client Grid/List
**File:** `src/app/(dashboard)/clients/page.tsx`

**Features:**
- Client grid sorted by newest first
- Search functionality (searches company_name, display_name)
- Filter by invoice type:
  - All | GST Invoice | Non-GST | International
- Filter by status:
  - All Status | Active | Inactive | Closed | Churned
- Client card displays:
  - Company name + display name
  - Invoice type badge (GST | Non-GST | Intl.)
  - Region flag (IN | US | AE | UK | --)
  - Health score (circular progress 0-100)
  - Health label (Excellent | Good | Fair | At Risk)
  - On-time payment % + label
  - Total revenue collected
  - "Since" date (created_at)
  - Contract status pills (if any)
- Actions per card:
  - View client details
  - Create invoice button (modal)
  - Analytics
- Add Client button → opens AddClientModal

**Helper Functions:**
```typescript
// Health score labeling
healthLabel(score: number): { label, color }
// Returns: Excellent (green) | Good (blue) | Fair (amber) | At Risk (red)

// Payment behavior
payBehaviorLabel(days: number, pct: number): { text, color }
// days = average days to payment
// pct = on-time percentage

// Ordinal numbers
getOrdinal(n: number): string
// 1 → "1st", 2 → "2nd", 3 → "3rd", 11 → "11th"
```

**Modal: AddClientModal**
- Form with React Hook Form + Zod
- Fields:
  - Company name (required)
  - Display name (optional)
  - Region (required, default: india)
  - Currency (required, default: INR)
  - Client type (required, default: indian_gst)
  - GSTIN (required if GST, auto-cleared if not GST)
  - City (optional)
  - Country (optional, default: India)
  - Billing email (optional, email validation)
- On submit → calls useCreateClient → closes modal on success

### `/clients/[id]` - Client Detail View
**File:** `src/app/(dashboard)/clients/[id]/page.tsx`

**Sections:**

1. **Header**
   - Company name + display name
   - Client type badge (GST | Non-GST | Intl.)
   - Status badge
   - Action buttons:
     - Edit (redirects to edit page)
     - Close/Reactivate (toggle based on status)
     - More menu (if needed)

2. **Overview Tab** (default)
   - **Client Info Card**
     - Company address (address, city, state, country, pincode)
     - GSTIN (if GST)
     - Tax number (if international)
     - Signing authority + designation
     - Phone, website, region

   - **Contact Persons**
     - Table of client_contacts ordered by is_primary DESC
     - Columns: Name, Email, Phone, Designation, Primary/Billing flags

   - **Financials Summary**
     - KPI cards: Total Invoiced | Collected | Outstanding
     - Uses useClientStats hook

   - **Recent Invoices**
     - Last 5 invoices (sent/paid)
     - Columns: Invoice # | Date | Amount | Status
     - Link to view each invoice

   - **Invoices & Payments Tab** (merged)
     - List all invoices for this client
     - Sortable table
     - Columns: Invoice # | Date | Amount | Status | Actions
     - Create Invoice button
     - Link to create proforma with client pre-selected

   - **Projects Tab** (if any)
     - List of projects for this client
     - Columns: Project name | Status | Type | Retainer amount
     - Add Project button (opens AddProjectModal with preselectedClientId)

   - **Contracts Tab** (if any)
     - List of contracts
     - Status badges (Contract Shared | Contract Signed)

   - **TDS Certificates Tab**
     - Table: FY | Quarter | Amount | Date Received | File
     - Upload button → TdsUploadModal
     - Download certificate files

3. **Modals**
   - **TdsUploadModal**
     - Fields:
       - Title/Description (optional)
       - Financial Year (required, dropdown: current FY ± 2 years)
       - Quarter (required, 1-4)
       - TDS Amount (optional, numeric)
       - Certificate File (optional, PDF/JPG/PNG)
       - Notes (optional)
     - Upload to Supabase storage: `documents/tds/{clientId}/{fy}-Q{quarter}-{timestamp}.{ext}`
     - Save button → inserts tds_certificates row

   - **CloseClientModal**
     - Confirmation dialog
     - Message warns about consequences
     - Confirm/Cancel buttons

   - **NewInvoiceModal**
     - Pre-selects this client
     - Creates invoice for client

**Key Data Fetching:**
```typescript
useClient(id)              // Client details + contacts
useClientStats(id)         // Financial summary
useProjects({ clientId })  // Projects for client
useContracts({ clientId }) // Contracts for client
useInvoices({ clientId })  // Invoices for client
```

### `/clients/[id]/edit` - Edit Client
**File:** `src/app/(dashboard)/clients/[id]/edit/page.tsx`

**Sections:**

1. **Company Info Card**
   - Company name (required)
   - Display name (optional)
   - Client type selector (indian_gst | indian_non_gst | international)
   - GSTIN field (required if GST, auto-hidden if not)
   - Region selector (india | usa | uae | uk | other)
   - Currency selector (INR | USD | AED | GBP)

2. **Address Card**
   - Address (optional)
   - City (optional)
   - State (optional)
   - Country (optional, default: India)
   - Pincode (optional)

3. **Contact & Legal Card**
   - Phone (optional, phoneOnly filter: removes non-numeric except +, space, dash)
   - Website (optional, URL)
   - Signing authority (optional)
   - Designation (optional)

4. **Billing Card**
   - Billing emails (optional, email validation)
   - Engagement type selector:
     - One-time (clears billing_day)
     - Retainer (shows billing_day selector, 1-31)

**Form Handling:**
- Manual form validation (no HTML5 validation due to e.preventDefault())
- Phone filtering via phoneOnly() helper
- Conditional GSTIN requirement based on client_type
- Conditional billing_day based on engagement type
- Save button redirects to client detail page
- Cancel link returns to client detail page

**Data Loading:**
- useClient(id) with refetchOnMount: "always"
- Auto-populates form on load
- Shows skeletons while loading

### `/analytics/clients` - Client Analytics Dashboard
**File:** `src/app/(dashboard)/analytics/clients/page.tsx`

**Features:**

1. **Summary Stats**
   - Total clients count
   - Premium clients (health_score >= 80)
   - Growth clients (health_score >= 60 && < 80)
   - Average collection days
   - Best client (highest health_score)

2. **Health Score Radar Chart**
   - Top 10 clients by health score
   - Radar plot: Multiple dimensions
   - Color coded by health tier

3. **Revenue by Client Bar Chart**
   - Top 6 clients by revenue collected
   - Sortable, color-coded bars
   - Shows total_collected amount

4. **Client Status Breakdown**
   - Distribution of: Premium | Growth | Standard | At Risk
   - Pie/donut chart

5. **Date Filter**
   - By period (all/last 30 days/last 90 days/this FY/custom)
   - Filters charts based on selection

**Color Scheme:**
```typescript
healthColor(score: number):
  score >= 80: #22c55e (green)
  score >= 60: #f59e0b (amber)
  default: #ef4444 (red)

CLIENT_COLORS palette: 8 distinct colors for bar chart
```

**Data Fetching:**
```typescript
useClientHealthScores()  // Health metrics per client
useRevenueByClient()     // Revenue per client
```

---

## Components & Utilities

### Client Types
**File:** `src/types/index.ts`
```typescript
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientContact = Database["public"]["Tables"]["client_contacts"]["Row"];
export type ClientWithContacts = Client & {
  client_contacts: ClientContact[];
};
export type ClientStatus = Client["status"];
export type ClientType = Client["client_type"];
```

### Form Validation
**Location:** `src/app/(dashboard)/clients/page.tsx`

**Zod Schema:**
```typescript
const clientSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  display_name: z.string().optional(),
  region: z.enum(["india", "usa", "uae", "uk", "other"]),
  currency: z.enum(["INR", "USD", "AED", "GBP"]),
  gstin: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  billing_email: z.string()
    .optional()
    .refine(
      (val) => !val?.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      { message: "Enter a valid email" }
    ),
  client_type: z.enum(["indian_gst", "indian_non_gst", "international"]),
});
```

### Helper Functions

#### Health Label
```typescript
function healthLabel(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "Excellent", color: "#16a34a" };
  if (score >= 70) return { label: "Good", color: "#3b82f6" };
  if (score >= 55) return { label: "Fair", color: "#f59e0b" };
  return { label: "At Risk", color: "#ef4444" };
}
```

#### Payment Behavior Label
```typescript
function payBehaviorLabel(days: number, pct: number): { text: string; color: string } {
  if (days <= 10 && pct >= 90) return { text: "Prompt payer", color: "#16a34a" };
  if (days <= 20 && pct >= 75) return { text: "Usually on time", color: "#3b82f6" };
  if (days <= 30 && pct >= 60) return { text: "Occasional delays", color: "#f59e0b" };
  return { text: "Slow payer", color: "#ef4444" };
}
```

#### Phone Filter
```typescript
function phoneOnly(value: string): string {
  return value.replace(/[^\d+\s\-()]/g, "");
}
// Usage: When user types in phone field, only allows digits, +, space, dash, parentheses
```

#### Ordinal Numbers
```typescript
function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
// Usage: 1 → "1st", 2 → "2nd", 21 → "21st", 11 → "11th"
```

### Shared Components Used
- **GlassCard** - Container styling
- **DarkSection / DarkCard** - Dark theme cards
- **StatusBadge** - Status display
- **CurrencyDisplay** - Format amounts
- **EmptyState** - No data state
- **Skeleton** - Loading state
- **NewInvoiceModal** - Create invoice (pre-selects client)
- **AddProjectModal** - Create project (pre-selects client)
- **PdfPreviewModal** - PDF viewing

---

## Analytics Hooks

**File:** `src/lib/hooks/use-analytics.ts`

### `useRevenueByClient()`
```typescript
// Returns: RevenueByClientRow[]
interface RevenueByClientRow {
  client_id: string;
  client_name: string;
  invoice_count: number;
  total_invoiced: number;
  total_collected: number;
  avg_days_to_payment: number | null;
}

// Query: revenue_by_client_view
// Shows: Total invoiced vs collected per client
```

### `useClientHealthScores()`
```typescript
// Returns: ClientHealthScoreRow[]
interface ClientHealthScoreRow {
  client_id: string;
  client_name: string;
  paid_count: number;
  on_time_count: number;
  overdue_count: number;
  avg_payment_days: number | null;
  total_collected: number | null;
  on_time_pct: number;
  health_score: number;
}

// Query: client_health_scores view
// Calculates: Payment behavior, health metrics
```

---

## Key Features Summary

✅ **Client Types** - GST, Non-GST, International
✅ **Multi-region Support** - India, USA, UAE, UK, Other
✅ **Multi-currency** - INR, USD, AED, GBP, EUR
✅ **Client Contacts** - Store team members with roles
✅ **Financial Tracking** - Total invoiced, collected, outstanding
✅ **Health Scoring** - Auto-calculated based on payment behavior
✅ **Payment Analytics** - On-time %, average days to payment
✅ **Status Management** - Active, Inactive, Churned, Closed
✅ **Retainer Billing** - Optional billing_day for recurring invoices
✅ **TDS Certificates** - Upload & store per FY/Quarter
✅ **Contract Tracking** - Integration with contracts module
✅ **Project Association** - Link clients to projects
✅ **Invoice Integration** - Full invoice history per client
✅ **Smart Filtering** - By type, status, region, currency
✅ **Circular Health Visualization** - Progress circle with color coding

---

## Calculation Functions

### Client Health Score Calculation
```sql
-- Query: client_health_scores view
health_score = (on_time_pct + (100 - avg_payment_days/30) + collection_rate) / 3
```

### Payment Behavior Classification
```typescript
// days = avg_days_to_payment, pct = on_time_pct
if (days <= 10 && pct >= 90) → "Prompt payer" (green)
if (days <= 20 && pct >= 75) → "Usually on time" (blue)
if (days <= 30 && pct >= 60) → "Occasional delays" (amber)
else → "Slow payer" (red)
```

### Health Label Classification
```typescript
score >= 85 → "Excellent" (green)
score >= 70 → "Good" (blue)
score >= 55 → "Fair" (amber)
< 55 → "At Risk" (red)
```

---

## Integration Points

- **Invoices:** Client selector when creating invoices, invoice history on detail page
- **Projects:** Add projects to clients, project selector uses client pre-filter
- **Contracts:** Contract status displayed on client card, contract tab on detail page
- **Payments:** Record payments for client invoices
- **Analytics:** Client revenue & health charts in analytics dashboard
- **Dashboard:** Client health cards in main dashboard
- **FloatingFAB:** "Onboard Client" quick action (opens onboard page with empty form)

---

## Status Workflow

```
active → inactive / closed / churned
inactive → active
churned → active / inactive
closed → active (reactivate)
```

---

## Migration History

- **001_schema.sql** - Initial clients, client_contacts tables
- **002_schema_additions.sql** - Additional fields
- **004_analytics.sql** - Views: revenue_by_client_view, client_health_scores
- **007_tds_certificates.sql** - TDS certificate table
- **009_add_closed_status.sql** - Added "closed" to status enum

---

**Last Updated:** 2026-03-04
**Status:** Phase 5 Complete (Polish + Deploy)
