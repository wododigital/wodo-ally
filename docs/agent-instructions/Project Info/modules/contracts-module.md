# WODO Ally - Contracts Module Documentation

Complete reference guide for all contract-related features, components, and actions in the WODO Ally application.

---

## Database Models

### Tables
- **`contracts`** - Main contract table with status & lifecycle management
- **`clients`** - Associated client information (FK: client_id)
- **`projects`** - Linked project (FK: project_id, optional)

### Contract Statuses (Lifecycle)
- `draft` - Contract created, not yet sent to client
- `sent` - Contract sent to client for signing
- `signed` - Contract signed by client (signed_date auto-set)
- `active` - Contract is active/in effect
- `completed` - Contract work completed
- `terminated` - Contract terminated early

### Contract Types
- `service_agreement` - Service delivery contract
- `nda` - Non-Disclosure Agreement
- `msа` - Master Service Agreement
- `statement_of_work` - Statement of Work
- `retainer_agreement` - Retainer agreement
- `other` - Other contract types

---

## Core Hooks

### File: `src/lib/hooks/use-contracts.ts`

#### 1. **useContracts(filters?)**
Fetch all contracts with optional filtering by status and/or client.
```typescript
// Usage
const { data, isLoading } = useContracts({
  status: "signed",
  clientId: "client-123"
});

// Returns: ContractWithDetails[]
// {
//   ...contractData,
//   client: { company_name, currency },
//   project: { name } | null
// }
```
- Filters: `status` (optional), `clientId` (optional)
- Ordering: `created_at` DESC
- Type: Query (TanStack)
- Enriches with client name, currency, and project name

#### 2. **useContract(id)**
Fetch single contract with full details including client and project.
```typescript
// Usage
const { data: contract } = useContract("contract-123");

// Returns: ContractWithDetails with all details
```
- Type: Query (TanStack)
- Query Key: `["contracts", id]`

#### 3. **useCreateContract()**
Create a new contract (starts in `draft` status).
```typescript
// Usage
const createContract = useCreateContract();

await createContract.mutateAsync({
  client_id: "client-123",
  project_id: "project-123",
  contract_type: "service_agreement",
  title: "Website Development Contract",
  description: "Website development and deployment",
  value: 50000,
  currency: "INR",
  start_date: "2026-03-01",
  end_date: "2026-06-01",
  renewal_terms: "Auto-renew unless terminated",
  key_terms: "30-day notice for termination",
  status: "draft",
  // ... other fields
});
```
- Auto-toast on success/error
- Invalidates `["contracts"]` query cache

#### 4. **useUpdateContract()**
Update contract fields (available in all statuses).
```typescript
// Usage
const updateContract = useUpdateContract();

await updateContract.mutateAsync({
  id: "contract-123",
  data: {
    title: "Updated Title",
    value: 55000,
    // ... other fields
  }
});
```
- Invalidates `["contracts"]` and single contract queries
- Auto-toast on success/error

#### 5. **useDeleteContract()**
Delete contract (only available for `draft` status).
```typescript
// Usage
const deleteContract = useDeleteContract();

await deleteContract.mutateAsync("contract-123");
```
- Type: Mutation
- Checks status is "draft" before allowing delete
- Invalidates `["contracts"]` cache
- Auto-toast on success/error

#### 6. **useUpdateContractStatus()**
Update contract status (with special handling for signed_date).
```typescript
// Usage
const updateStatus = useUpdateContractStatus();

await updateStatus.mutateAsync({
  id: "contract-123",
  status: "signed"
  // Auto-sets signed_date to current date when status = "signed"
});
```
- Type: Mutation
- Auto-sets `signed_date` when status changes to "signed"
- Invalidates all contract queries
- Auto-toast on success/error

#### 7. **useClientContractSummaries()**
Lightweight hook for client cards showing best contract status per client.
```typescript
// Usage
const summaries = useClientContractSummaries();

// Returns: Record<clientId, ContractStatus>
// Scoring: terminated=0, draft=1, sent=2, signed=3, active=4, completed=5
// Shows "best" status (highest score) for each client
```
- Type: Query (TanStack)
- Used for client card status display
- Lightweight: only fetches id, client_id, status

---

## Contract Features

### Contract Lifecycle
```
Draft → Sent → Signed → Active → (Completed or Terminated)
```

**Transitions:**
- Draft: Fully editable, can be deleted, can be sent
- Sent: Waiting for signature, can be edited, can move to signed or back to draft
- Signed: Legally binding, `signed_date` recorded, can move to active
- Active: In effect, contract work ongoing
- Completed: Work finished successfully
- Terminated: Contract ended early

### Key Dates
- `start_date` - Contract effective start date
- `end_date` - Contract expiration/completion date
- `signed_date` - Auto-set when status becomes "signed"
- `created_at` - Contract creation timestamp
- `updated_at` - Last modification timestamp

### Contract Value & Terms
- `value` - Contract monetary value
- `currency` - Contract currency (INR, USD, AED, GBP, EUR)
- `renewal_terms` - Auto-renewal conditions
- `key_terms` - Important terms & conditions
- `termination_clause` - How contract can be terminated

### PDF Generation
- Contract generates PDF from contract-pdf.tsx component
- PDF includes: client details, contract terms, dates, value, signature blocks
- PDF can be downloaded or emailed to client

---

## Pages

### File: `src/app/(dashboard)/contracts/page.tsx`

**Features:**
- Contract list with search by title/client
- Status filter dropdown (Draft, Sent, Signed, Active, Completed, Terminated)
- Contract cards with:
  - Title and client name
  - Contract type badge
  - Status badge (color-coded)
  - Value with currency
  - Date range (start → end)
  - Days remaining counter
  - Last updated date
- Add Contract button (opens modal)
- Action buttons per contract:
  - View details
  - Edit (draft only)
  - Delete (draft only)
  - View PDF
  - Send email
  - Update status

**Hooks Used:**
- `useContracts(filters)` - Fetch list with filters
- `useUpdateContractStatus()` - Status updates from UI
- `useDeleteContract()` - Delete draft contracts
- `useClientContractSummaries()` - Client health indicators

**Components:**
- `GlassCard` - Container styling
- `StatusBadge` - Status display
- `StatusDropdown` - Filter dropdown
- `EmptyState` - When no contracts exist
- `Skeleton` - Loading state
- `ConfirmDialog` - Confirmation for delete/termination

**Responsive:**
- Mobile: Single column, hide details
- Desktop: Multi-column grid with full details

---

## Form Fields

### Create/Edit Contract Form
- `client_id` (required, FK) - Select client
- `project_id` (optional, FK) - Link to project
- `contract_type` (required, dropdown) - Type selection
- `title` (required, text) - Contract title
- `description` (optional, textarea) - Contract details
- `value` (optional, number) - Contract value
- `currency` (required, dropdown) - Contract currency
- `start_date` (required, date picker) - Start date
- `end_date` (required, date picker) - End date
- `renewal_terms` (optional, textarea) - Renewal conditions
- `key_terms` (optional, textarea) - Important terms
- `termination_clause` (optional, textarea) - Termination details
- `notes` (optional, textarea) - Internal notes

### Validation Rules
- `client_id` must be valid client UUID
- `title` required, max 255 chars
- `contract_type` must be valid enum value
- `start_date` required, must be before `end_date`
- `end_date` required, must be after `start_date`
- `value` optional, but if provided must be > 0
- `currency` required, must be valid ISO 4217 code
- `status` for status-only updates must be valid enum value

---

## Special Features

### Status Transitions & Validations
- **Draft → Sent**: No restrictions, can send for signature
- **Sent → Signed**: Must have signed_date auto-set
- **Signed → Active**: Contract is now in effect
- **Any Status → Completed**: Work is finished
- **Any Status → Terminated**: Contract terminated early
- **Draft → Delete**: Only draft contracts can be deleted

### Contract-Project Relationship
- Optional one-to-one relationship with projects
- A project can have multiple contracts (versions, amendments)
- Contract value should match project value (if linked)
- Contract status lifecycle separate from project status

### Client Contract Scoring
Used to show "best" contract status on client cards:
- Terminated: 0
- Draft: 1
- Sent: 2
- Signed: 3
- Active: 4
- Completed: 5

Highest score = "best" status for client

### PDF Generation & Email
- Generate contract PDF on-demand
- Send PDF via email with subject/recipient
- Track email sent timestamp
- Store PDF in Supabase storage if needed

---

## Integrations

### Linked Entities
- **Clients** (FK: client_id) - Contract for client
- **Projects** (FK: project_id, optional) - Associated project (if any)
- **Invoices** - Payment invoices issued under contract
- **Analytics** - Contract status contributes to client health score

---

## Type Definitions

```typescript
// From Database
type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];
type ContractStatus = ContractRow["status"];

// With enrichment
type ContractWithDetails = ContractRow & {
  client: {
    company_name: string;
    currency: string;
  };
  project: { name: string } | null;
};

// Filtering interface
interface ContractFilters {
  status?: ContractStatus;
  clientId?: string;
}
```

---

## API Routes (Planned)

- `GET /api/contracts` - List with pagination & filters
- `GET /api/contracts/[id]` - Fetch single
- `POST /api/contracts` - Create new
- `PATCH /api/contracts/[id]` - Update contract
- `PATCH /api/contracts/[id]/status` - Update status
- `DELETE /api/contracts/[id]` - Delete (draft only)
- `GET /api/contracts/summary/by-client` - Summaries per client
- `POST /api/contracts/[id]/generate-pdf` - Trigger PDF generation
- `POST /api/contracts/[id]/send-email` - Send contract via email

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Total Hooks | 7 |
| Pages | 1 |
| Database Tables | 1 primary (contracts) + 2 linked |
| Contract Types | 6 |
| Statuses | 6 |
| Supported Currencies | 5 (INR, USD, AED, GBP, EUR) |

---

## Last Updated

**Date:** 2026-03-05
**Status:** Phase 5 Complete
**Build:** 0 TypeScript errors

---

## Related Documentation
- `projects-module.md` - Associated projects
- `clients-module.md` - Client details
- `invoicing-module.md` - Invoices under contract
- `analytics-module.md` - Client health scoring
