# WODO Ally - TDS Module Documentation (Tax Deducted at Source)

Complete reference guide for TDS certificate management and tax compliance tracking in WODO Ally.

---

## Database Models

### Tables
- **`tds_certificates`** - TDS certificate records with file storage
- **`clients`** - Client-level TDS tracking (FK: client_id)
- **`invoice_payments`** - TDS amounts tracked per payment (tds_amount, tds_section)

### TDS Sections (India)
- `194C` - Payments to contractors (construction, professional services)
- `194J` - Payments to professionals (fees, commissions)
- `194H` - Commission on insurance
- `194O` - E-commerce payments
- `194-O` - Cash withdrawal from banks
- `other` - Other TDS sections

### Financial Year Tracking
- **FY Format**: "FY2025-26" (Apr 2025 - Mar 2026)
- **Quarters**: Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)
- Cumulative tracking across quarters in FY

---

## Core Hooks

### File: `src/lib/hooks/use-tds.ts`

#### 1. **useTds(clientId?, period?)**
Fetch TDS certificates filtered by client and/or period.
```typescript
// Usage
const { data } = useTds("client-123", "FY2025-26");

// Returns: TdsCertificate[]
// [
//   { id, client_id, fy, quarter, amount, certificate_url, notes, created_at }
// ]
```
- Filters: `clientId`, `period` (optional)
- Ordering: `fy` DESC, then `quarter`
- Type: Query (TanStack)

#### 2. **useTds(id)**
Fetch single TDS certificate.
```typescript
// Usage
const { data: certificate } = useTds("tds-123");

// Returns: TdsCertificate with full details
```
- Type: Query (TanStack)

#### 3. **useCreateTds()**
Create new TDS certificate record.
```typescript
// Usage
const createTds = useCreateTds();

await createTds.mutateAsync({
  client_id: "client-123",
  fy: "FY2025-26",
  quarter: "Q1",
  amount: 45000,
  tds_section: "194C",
  certificate_date: "2026-06-15",
  notes: "Q1 TDS certificate for contractor payments"
});
```
- Auto-toast on success/error
- Invalidates TDS queries

#### 4. **useUpdateTds()**
Update TDS certificate details (before file upload).
```typescript
// Usage
const updateTds = useUpdateTds();

await updateTds.mutateAsync({
  id: "tds-123",
  data: {
    amount: 50000,
    notes: "Updated amount"
  }
});
```
- Invalidates queries
- Auto-toast

#### 5. **useDeleteTds()**
Delete TDS certificate.
```typescript
// Usage
const deleteTds = useDeleteTds();

await deleteTds.mutateAsync("tds-123");
```
- Soft delete (or hard delete if preferred)
- Auto-toast

#### 6. **useUploadTdsFile(certificateId)**
Upload TDS certificate PDF/image file.
```typescript
// Usage
const uploadFile = useUploadTdsFile("tds-123");

const file = document.querySelector('input[type="file"]').files[0];
await uploadFile.mutateAsync(file);

// Uploads to: supabase/tds/{clientId}/{timestamp}-{filename}
// Returns: certificate_url (signed URL)
```
- Destination: `supabase/documents/tds/{clientId}/`
- File types: PDF, PNG, JPG, GIF
- Max size: 10 MB
- Returns signed URL for secure download

#### 7. **useTdsByFy(fy)**
Fetch all TDS certificates for specific financial year.
```typescript
// Usage
const { data } = useTdsByFy("FY2025-26");

// Returns: TdsCertificate[] (all 4 quarters)
```
- Type: Query (TanStack)

#### 8. **useTdsByQuarter(fy, quarter)**
Fetch TDS certificates for specific quarter.
```typescript
// Usage
const { data } = useTdsByQuarter("FY2025-26", "Q1");

// Returns: TdsCertificate[] (Q1 only)
```
- Type: Query (TanStack)

#### 9. **useTdsStatsByClient()**
Fetch TDS statistics aggregated by client.
```typescript
// Usage
const { data: stats } = useTdsStatsByClient();

// Returns: Array<{ client_id, client_name, total_tds, certificates_count }>
```
- Aggregates TDS amounts by client
- Shows certificate count
- Used for client detail pages

---

## TDS Features

### Certificate Management
- **Creation**: Manual entry of certificate details (date, amount, section)
- **File Upload**: Upload actual certificate (PDF/Image) to Supabase storage
- **Tracking**: Stores file URL for download/viewing
- **History**: All quarters tracked per FY

### Period Organization
- **Quarters**: Q1-Q4 following Indian FY
  - Q1: Apr, May, Jun
  - Q2: Jul, Aug, Sep
  - Q3: Oct, Nov, Dec
  - Q4: Jan, Feb, Mar
- **Multiple Years**: FY2024-25, FY2025-26, FY2026-27, etc.

### Client-Level Aggregation
- TDS tracked per client
- Useful for: identifying top vendors requiring TDS, compliance reporting
- TDS certificate count per client
- Total TDS amount per client (for a FY)

### TDS Sections
Different payment types have different TDS sections:
- **194C**: Contractor payments (Rents, professional fees)
- **194J**: Professional services (Legal, accounting, consulting)
- **194H**: Insurance commissions
- **194O**: E-commerce seller payments
- **Other**: Miscellaneous TDS types

### File Storage & Access
- Files stored in Supabase storage at: `documents/tds/{clientId}/{fileName}`
- Signed URLs with 1-hour expiry for security
- Download, view, and share options
- Backup & audit trail for compliance

---

## Pages

### File: `src/app/(dashboard)/clients/[id]/page.tsx` (TDS Section)

**Features (in Client Detail):**
- TDS Certificates section (collapsible)
- List of certificates by FY & Quarter
- Display: Amount, Section, Certificate Date, File Status
- Upload Certificate button (file input)
- Download/View button (opens signed URL)
- Delete button (with confirmation)
- Add New Certificate button
- TDS Summary card (Total TDS this FY)

**Hooks Used:**
- `useTdsByClient(clientId)` - Fetch list
- `useCreateTds()` - Add new
- `useUploadTdsFile()` - Upload file
- `useDeleteTds()` - Delete
- `useTdsStatsByClient()` - Summary stats

### File: `src/app/(dashboard)/tds/page.tsx` (Standalone TDS Page)

**Features:**
- TDS certificates list (all clients)
- Filters: Client, FY, Quarter
- Search by client name
- Columns: Client, Amount, Section, Quarter, File Status, Actions
- Sortable by amount, date
- Add Certificate button
- Upload File button (batch upload)
- FY Selector (dropdown)
- Quarter tabs (Q1-Q4)
- Statistics: Total TDS this FY, Certificate Count, Clients with TDS
- Export CSV (list)
- Chart: TDS by client (bar chart)

**Hooks Used:**
- `useTds(filters)` - Fetch with pagination
- `useCreateTds()` - Create new
- `useUploadTdsFile()` - Upload
- `useDeleteTds()` - Delete
- `useTdsByFy()` - FY totals
- `useTdsStatsByClient()` - Statistics

---

## Form Fields

### Create TDS Certificate Form
- `client_id` (required, dropdown) - Select client
- `fy` (required, dropdown) - Financial year (FY2025-26, FY2026-27, etc.)
- `quarter` (required, dropdown) - Q1, Q2, Q3, Q4
- `amount` (required, number) - TDS amount in INR
- `tds_section` (required, dropdown) - 194C, 194J, 194H, 194O, Other
- `certificate_date` (required, date picker) - Date of certificate
- `notes` (optional, textarea) - Internal notes

### File Upload Form
- `file` (required, file input) - PDF or image
- `file_type` (auto-detected) - PDF, PNG, JPG, etc.
- `confirm_upload` (checkbox) - Confirm before uploading

### Validation Rules
- `client_id` must be valid UUID
- `amount` required, > 0
- `fy` format: "FYXXXX-XX"
- `quarter` must be Q1-Q4
- `tds_section` must be valid enum
- `certificate_date` must be valid date
- File size < 10 MB
- File type: PDF, PNG, JPG, GIF only

---

## Special Features

### Compliance Tracking
- Required for Indian tax compliance (TDS Act)
- Client-wise TDS aggregation for tax return filing
- Quarterly breakdown for advance tax planning
- Certificate file storage for audit trail

### Multi-Year Support
- Track TDS across multiple financial years
- Quick filtering by FY
- Historical TDS data preserved
- Compare TDS trends year-over-year

### Client Detail Integration
- TDS certificates visible in client detail page
- Quick upload and view from client context
- TDS summary for client (this FY)
- Helps with client-specific compliance

### Audit Trail
- Creation timestamp recorded
- File upload timestamp tracked
- Modification history available
- Supports compliance audits

---

## Integrations

### Linked Entities
- **Clients** (FK: client_id) - TDS tracked per vendor/client
- **Invoice Payments** - TDS amount recorded per payment
- **Analytics** - Tax summary in financial reports
- **Reports** - TDS details in investor reports
- **Payments Module** - TDS section visible in payment records

### External References
- **Google Drive** - Optional: Share certificates via integration
- **Email** - Send certificates to finance team for processing
- **Bank Integration** - Import TDS from bank statements (future)

---

## Type Definitions

```typescript
// Database
type TdsCertificate = Database["public"]["Tables"]["tds_certificates"]["Row"];

// TDS section enum
type TdsSection = "194C" | "194J" | "194H" | "194O" | "other";

// With client enrichment
type TdsCertificateWithClient = TdsCertificate & {
  client: { company_name: string };
};

// Statistics
interface TdsStats {
  client_id: string;
  client_name: string;
  total_tds: number;
  certificates_count: number;
  latest_quarter: string;
}
```

---

## API Routes (Planned)

- `GET /api/tds` - List with filters & pagination
- `GET /api/tds/[id]` - Fetch single
- `POST /api/tds` - Create new certificate
- `PATCH /api/tds/[id]` - Update details
- `DELETE /api/tds/[id]` - Delete
- `POST /api/tds/[id]/upload` - Upload file
- `GET /api/tds/by-client/[clientId]` - Certificates for client
- `GET /api/tds/by-fy/[fy]` - Certificates for FY
- `GET /api/tds/by-quarter/[fy]/[quarter]` - Certificates for quarter
- `GET /api/tds/stats` - Client aggregation statistics

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Total Hooks | 9 |
| Pages | 2 (Client detail + Standalone) |
| TDS Sections | 6+ |
| Storage Location | Supabase (documents/tds/) |
| File Size Limit | 10 MB |
| Supported Formats | PDF, PNG, JPG, GIF |

---

## Last Updated

**Date:** 2026-03-05
**Status:** Phase 5 Complete
**Build:** 0 TypeScript errors

---

## Related Documentation
- `clients-module.md` - Client tax tracking
- `payments-module.md` - TDS in payments
- `invoicing-module.md` - TDS in invoices
- `reports-module.md` - Tax summaries in reports
