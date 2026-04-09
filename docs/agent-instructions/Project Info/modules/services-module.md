# WODO Ally - Services Module Documentation

Complete reference guide for service cataloguing and line item management in WODO Ally.

---

## Database Models

### Tables
- **`services`** - Service catalogue with pricing and tax
- **`invoice_line_items`** - References services in invoices (FK: service_id, optional)
- **`projects`** - Services linked to project types
- **`contracts`** - Services referenced in contract terms

### Service Properties
- `name` - Service name (e.g., "Website Development")
- `description` - Service description
- `price` - Base price per unit
- `currency` - Price currency (INR, USD, AED, GBP, EUR)
- `tax_rate` - GST/Tax rate (0-100%)
- `unit` - Unit of measurement (hour, day, project, monthly, etc.)
- `is_active` - Service is available for invoicing
- `created_at`, `updated_at` - Timestamps

---

## Core Hooks

### File: `src/lib/hooks/use-services.ts`

#### 1. **useServices()**
Fetch all services (active only by default).
```typescript
// Usage
const { data: services } = useServices();

// Returns: Service[]
// [
//   { id, name, description, price, currency, tax_rate, unit, is_active }
// ]
```
- Type: Query (TanStack, cached)
- Default: Filter to `is_active = true`

#### 2. **useService(id)**
Fetch single service.
```typescript
// Usage
const { data: service } = useService("service-123");

// Returns: Service
```
- Type: Query (TanStack)

#### 3. **useCreateService()**
Create new service in catalogue.
```typescript
// Usage
const createService = useCreateService();

await createService.mutateAsync({
  name: "Website Development",
  description: "Custom website design & development",
  price: 500,
  currency: "INR",
  tax_rate: 18,
  unit: "hour",
  is_active: true
});
```
- Auto-toast on success/error
- Invalidates service list cache

#### 4. **useUpdateService()**
Update service details.
```typescript
// Usage
const updateService = useUpdateService();

await updateService.mutateAsync({
  id: "service-123",
  data: {
    price: 600,
    tax_rate: 18
  }
});
```
- Invalidates queries
- Auto-toast on success/error

#### 5. **useDeleteService()**
Delete service (soft delete recommended).
```typescript
// Usage
const deleteService = useDeleteService();

await deleteService.mutateAsync("service-123");
```
- Prevents deletion if linked to active invoices
- Sets `is_active = false` (soft delete)
- Auto-toast

#### 6. **useServicesByProject(projectId)**
Fetch services linked to specific project.
```typescript
// Usage
const { data } = useServicesByProject("project-123");

// Returns: Service[] (filtered to project)
```
- Type: Query (TanStack)
- Optional filtering

---

## Service Features

### Pricing & Tax
- **Base Price**: per unit (hour, day, project, monthly)
- **Currency**: Multi-currency support (INR, USD, AED, GBP, EUR)
- **Tax Rate**: GST/VAT percentage (stored, calculated in invoices)
- **Tax Calculation**: `tax_amount = price × quantity × (tax_rate / 100)`
- **Total with Tax**: `total = (price × quantity) + tax_amount`

### Service Units
- `hour` - Hourly billing
- `day` - Daily rate
- `project` - Fixed project price
- `monthly` - Monthly retainer
- `quarterly` - Quarterly billing
- `annual` - Annual fee
- `unit` - Per item/unit
- `percentage` - Percentage-based billing

### Active/Inactive Status
- **Active**: Available for selection in invoice line items
- **Inactive**: Archived, hidden from dropdowns, preserved in historical invoices
- Soft delete: Mark `is_active = false` instead of hard delete
- Ensures historical invoice line items remain valid

### Service Catalogue Organization
- Services grouped by category (optional)
- Search by name/description
- Filter by active status
- Quick pricing reference
- Used across all projects

---

## Pages (Integrated)

### Service Management (Settings Tab)
**Location:** `src/app/(dashboard)/settings/page.tsx` (Services Tab)

**Features:**
- Service list with name, price, currency, tax rate
- Search & filter by active status
- Add Service button (form modal)
- Edit service (inline or modal)
- Delete/Archive button (with confirmation)
- Bulk upload services (CSV)
- Import from previous period
- Price history tracking

**Hooks Used:**
- `useServices()` - Fetch list
- `useCreateService()` - Add new
- `useUpdateService()` - Edit
- `useDeleteService()` - Archive

### Service Selection in Invoices
**Location:** `src/app/(dashboard)/invoices/new/page.tsx` (Line Items)

**Features:**
- Service dropdown (autocomplete)
- Shows price, currency, tax rate
- Quantity input
- Total price calculation (with tax)
- Remove line item button
- Add another service button
- Services grouped by project (if project selected)

**Hooks Used:**
- `useServices()` - Dropdown list
- `useServicesByProject(projectId)` - Filtered list (if project selected)

---

## Form Fields

### Create/Edit Service Form
- `name` (required, text) - Service name (max 255 chars)
- `description` (optional, textarea) - Service description
- `price` (required, number) - Base price per unit
- `currency` (required, dropdown) - INR, USD, AED, GBP, EUR
- `tax_rate` (required, number) - Tax % (0-100, default 18 for GST)
- `unit` (required, dropdown) - Hour, Day, Project, Monthly, etc.
- `is_active` (checkbox, default true) - Available for invoicing

### Validation Rules
- `name` required, unique, max 255 chars
- `price` required, >= 0
- `currency` must be valid ISO code
- `tax_rate` 0-100, numeric
- `unit` must be valid enum value
- `description` optional, max 1000 chars

---

## Special Features

### Multi-Currency Support
- Price stored in specific currency
- Invoice line items inherit client's currency
- Conversion (if needed) handled in invoice totals
- Tax calculation consistent across currencies

### Tax Rate Handling
- Default: 18% GST (India)
- Variable per service (e.g., 5% for books, 0% for exports)
- Applied at line item level
- Can be overridden per invoice line

### Service-to-Project Mapping
- Services can be associated with specific project types
- When project is selected in invoice, filter services to that project
- Improves UX: less selection overhead
- Optional: services shown globally if no project specified

### Service Pricing Strategies
- **Fixed**: Fixed price per unit
- **Hourly**: Rate × hours
- **Retainer**: Monthly/Quarterly/Annual fixed
- **Usage-based**: Per transaction, per user, per GB, etc.
- **Tiered**: Different rates for different volumes

---

## Integrations

### Linked Entities
- **Invoices** - Line items reference services
- **Projects** - Services associated with project types
- **Clients** - Client-specific pricing (future enhancement)
- **Financial Analytics** - Revenue by service tracked
- **Reports** - Service revenue breakdowns in investor reports

### Bulk Operations
- Import services from CSV
- Clone services from previous period
- Archive/activate multiple services
- Price updates across all active invoices (future)

---

## Type Definitions

```typescript
// Database
type Service = Database["public"]["Tables"]["services"]["Row"];

// With enrichment
type ServiceWithDetails = Service & {
  total_price_with_tax?: number;
  quantity?: number;
};

// Invoice line item (references service)
interface InvoiceLineItem {
  id: string;
  service_id: string;
  quantity: number;
  description: string;
  amount: number;
  service?: Service;
}
```

---

## API Routes (Planned)

- `GET /api/services` - List all (active only by default)
- `GET /api/services/[id]` - Fetch single
- `POST /api/services` - Create new
- `PATCH /api/services/[id]` - Update
- `DELETE /api/services/[id]` - Delete/Archive
- `GET /api/services/by-project/[projectId]` - Filtered by project
- `POST /api/services/bulk-import` - CSV import

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Total Hooks | 6 |
| Supported Currencies | 5 |
| Tax Rate Range | 0-100% |
| Service Units | 8+ |
| Typical Service Count | 10-50 per company |

---

## Database Views & Queries

```sql
-- Revenue by service (for analytics)
SELECT
  s.name,
  s.currency,
  SUM(ili.amount) as total_revenue,
  COUNT(DISTINCT ili.invoice_id) as invoice_count,
  COUNT(DISTINCT i.client_id) as client_count
FROM services s
LEFT JOIN invoice_line_items ili ON s.id = ili.service_id
LEFT JOIN invoices i ON ili.invoice_id = i.id
GROUP BY s.id, s.name, s.currency;
```

---

## Last Updated

**Date:** 2026-03-05
**Status:** Phase 5 Complete
**Build:** 0 TypeScript errors

---

## Related Documentation
- `invoicing-module.md` - Services in line items
- `projects-module.md` - Project-service mapping
- `analytics-module.md` - Service revenue analytics
- `clients-module.md` - Client-specific pricing
