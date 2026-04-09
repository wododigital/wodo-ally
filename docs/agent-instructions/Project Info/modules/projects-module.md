# WODO Ally - Projects Module Documentation

Complete reference guide for all project-related features, components, and actions in the WODO Ally application.

---

## Database Models

### Tables
- **`projects`** - Core project data with status, engagement type, and timeline tracking
- **`clients`** - Associated client information (FK: client_id)
- **`scheduled_invoices`** - Linked retainer invoice generation (FK: project_id)
- **`invoices`** - Multi-project linking via project_ids UUID array
- **`contracts`** - Project contracts (FK: project_id)
- **`transactions`** - Project expense tracking (FK: project_id)

### Project Types
- `branding` - Branding projects
- `ui_ux_design` - UI/UX Design projects
- `web_development` - Web Development projects
- `seo` - Search Engine Optimization
- `google_ads` - Google Ads management
- `social_media` - Social media management
- `gmb` - Google My Business
- `content_marketing` - Content marketing
- `full_service` - Full service engagements
- `other` - Other project types

### Engagement Types
- `one_time` - Single project, fixed value
- `retainer` - Ongoing monthly/quarterly/annual retainer

### Project Statuses
- `onboarding` - Initial setup phase
- `design_phase` - Design work in progress
- `development_phase` - Development in progress
- `deployment_qa` - Deployment and QA testing
- `setup_strategy` - Setup & strategy (for retainers)
- `active_execution` - Active project delivery
- `maintenance` - Post-delivery maintenance
- `completed` - Project finished
- `on_hold` - Paused
- `cancelled` - Project cancelled

### Billing Cycles (for retainers)
- `monthly` - Monthly billing
- `quarterly` - Quarterly billing
- `annual` - Annual billing

---

## Core Hooks

### File: `src/lib/hooks/use-projects.ts`

#### 1. **useProjects(clientId?)**
Fetch all projects with optional filtering by client.
```typescript
// Usage
const { data, isLoading, error } = useProjects("client-123");

// Returns: ProjectWithClient[] (includes client company_name)
// {
//   ...projectData,
//   clients: { company_name: string } | null
// }
```
- Filters: `clientId` (optional)
- Ordering: `created_at` DESC
- Type: Query (TanStack)
- Query Key: `["projects"]` or `["projects", { clientId }]`

#### 2. **useProject(id)**
Fetch single project by ID with full details.
```typescript
// Usage
const { data: project } = useProject("project-123");

// Returns: Project
// {
//   id, client_id, name, description, project_type, engagement_type,
//   total_value, payment_split, retainer_amount, retainer_currency,
//   billing_cycle, contract_start_date, contract_end_date, min_contract_months,
//   status, projected_completion_date, actual_completion_date, timeline_days,
//   notes, progress_pct, created_at, updated_at, created_by
// }
```
- Type: Query (TanStack)
- Query Key: `["projects", id]`

#### 3. **useCreateProject()**
Create a new project.
```typescript
// Usage
const createProject = useCreateProject();

await createProject.mutateAsync({
  client_id: "client-123",
  name: "Website Redesign",
  description: "Complete website redesign",
  project_type: "web_development",
  engagement_type: "one_time",
  total_value: 50000,
  status: "onboarding",
  progress_pct: 0,
  // ... other fields
});
```
- Auto-toast on success/error
- Invalidates `["projects"]` and `["projects", { clientId }]` cache

#### 4. **useUpdateProject()**
Update project fields (all types, all statuses).
```typescript
// Usage
const updateProject = useUpdateProject();

await updateProject.mutateAsync({
  id: "project-123",
  data: {
    name: "Updated Name",
    status: "active_execution",
    progress_pct: 25,
    // ... other fields to update
  }
});
```
- Invalidates `["projects"]`, `["projects", id]`, and client-filtered queries
- Auto-toast on success/error

#### 5. **useUpdateProjectStatus(id)**
Update only project status (with dedicated endpoint).
```typescript
// Usage
const updateStatus = useUpdateProjectStatus("project-123");

await updateStatus.mutateAsync("active_execution");
```
- Type: Mutation
- Accepts only the status value
- Invalidates all project queries
- Auto-toast on success/error

---

## Project Features

### Project Types & Engagement
- **One-Time Projects**: Fixed scope, total_value set, payment_split optional (for multi-phase billing)
- **Retainer Projects**: ongoing engagement, retainer_amount + billing_cycle, auto-generates invoices monthly/quarterly/annual

### Timeline Tracking
- `contract_start_date` - When project engagement begins
- `contract_end_date` - When project engagement ends
- `projected_completion_date` - Expected project completion
- `actual_completion_date` - When project actually completed
- `timeline_days` - Total days allocated (can be calculated from dates)

### Progress Tracking
- `progress_pct` (0-100) - Manual progress percentage
- **Trajectory Calculation**: Compares progress_pct vs time elapsed to determine if "On Track", "Delayed", or "Completed"
  - On Track: progress >= expected_pct ± 5%
  - Delayed: progress < expected_pct - 8%

### Payment Split (for one-time projects)
- `payment_split` JSONB field stores flexible billing phases:
  ```json
  {
    "phase_1": { "pct": 25, "due_date": "2026-04-01" },
    "phase_2": { "pct": 50, "due_date": "2026-05-01" },
    "phase_3": { "pct": 25, "due_date": "2026-06-01" }
  }
  ```

---

## Pages

### File: `src/app/(dashboard)/projects/page.tsx`

**Features:**
- Project list with grid/list view toggle
- Search by project name
- Engagement type filter (One-Time, Retainer)
- Status color-coded badges
- Trajectory indicators (On Track, Delayed, Completed, On Hold)
- Days remaining counter (if end_date set)
- Client company name display
- Add Project modal button (AddProjectModal component)
- Project cards with:
  - Project type icon/label
  - Client name
  - Engagement type (One-Time / Retainer with amount)
  - Status badge
  - Trajectory indicator + progress bar
  - Timeline: start → end dates or days remaining
  - Last updated date

**Hooks Used:**
- `useProjects()` - Fetch list
- `useUpdateProject()` - Direct status update from card
- `useAddProjectModal` context (for add button)

**Components:**
- `GlassCard` - Container styling
- `StatusBadge` - Status display
- `AddProjectModal` - Modal for creating projects
- `EmptyState` - When no projects exist
- `Skeleton` - Loading state
- `DarkSection` / `DarkCard` - Section container styling

**Responsive:**
- Mobile: Single column, hide some columns
- Desktop: Multi-column grid layout

---

## Key Calculations

### MRR (Monthly Recurring Revenue)
```
mrr = SUM(retainer_amount) for active retainer projects
with status in [setup_strategy, active_execution, maintenance]
```

### Project Value
- **One-Time**: `total_value` (fixed)
- **Retainer**: `retainer_amount × (12 / billing_cycle_months)`
  - Monthly: retainer_amount × 12
  - Quarterly: retainer_amount × 4
  - Annual: retainer_amount × 1

### Days Remaining
```
days_remaining = (contract_end_date - today).days
```

### Trajectory Status
```
if status == "completed": "Completed"
if status in ["on_hold", "cancelled"]: "On Hold"

else:
  if contract_start_date && contract_end_date:
    expected_progress = (days_elapsed / total_days) × 100
    delta = progress_pct - expected_progress

    if delta >= 5: "On Track" (ahead)
    if delta >= -8: "On Track" (on time)
    if delta < -8: "Delayed" (behind)
  else:
    if progress_pct >= 50: "On Track"
    else: "Delayed"
```

---

## Integrations

### Linked Entities
- **Clients** (FK: client_id) - Each project belongs to one client
- **Contracts** (FK: project_id) - Legal framework for project
- **Invoices** (project_ids: UUID[]) - Projects can be linked to multiple invoices
- **Scheduled Invoices** (FK: project_id) - Auto-generate retainer invoices
- **Transactions** (FK: project_id) - Expense tracking per project
- **Financial Targets** - MRR calculations from retainer projects
- **Reports** - Project revenue breakdown in investor reports

---

## Form Fields

### Create/Edit Project Form
- `client_id` (required, FK) - Select client
- `name` (required, text) - Project name
- `description` (optional, textarea) - Project description
- `project_type` (required, dropdown) - Type selection
- `engagement_type` (required, dropdown) - One-time or retainer
- `total_value` (optional, number) - For one-time projects
- `payment_split` (optional, JSON editor) - Billing phases for one-time
- `retainer_amount` (optional, number) - For retainer projects
- `retainer_currency` (optional, dropdown) - Default: INR
- `billing_cycle` (optional, dropdown) - Monthly/Quarterly/Annual
- `contract_start_date` (optional, date picker)
- `contract_end_date` (optional, date picker)
- `min_contract_months` (optional, number) - Minimum commitment
- `status` (optional, dropdown) - Project status
- `projected_completion_date` (optional, date picker)
- `timeline_days` (optional, number) - Total allocated days
- `progress_pct` (optional, slider 0-100) - Manual progress tracking
- `notes` (optional, textarea) - Internal notes

### Validation Rules
- `client_id` must be valid client UUID
- `name` required, max 255 chars
- `project_type` must be valid enum value
- `engagement_type` required: "one_time" or "retainer"
- If `engagement_type` is "one_time": `total_value` required
- If `engagement_type` is "retainer": `retainer_amount` and `billing_cycle` required
- `contract_end_date` must be after `contract_start_date` (if both set)
- `progress_pct` 0-100
- `status` must be valid enum value

---

## Special Features

### One-Time vs Retainer Workflow
**One-Time Projects:**
1. Create with total_value
2. Optional payment_split for phased billing
3. Generate invoices against project (via invoices.project_ids array)
4. Status moves through phases: onboarding → design → development → deployment_qa → maintenance → completed
5. Completion date tracked

**Retainer Projects:**
1. Create with retainer_amount, billing_cycle, dates
2. Scheduled invoices auto-generate at billing_cycle intervals
3. Status: setup_strategy → active_execution → maintenance → completed
4. Can be paused (on_hold) and reactivated
5. MRR calculated from active retainers

### Project Timeline Visualization
- Visual progress bar (0-100%)
- Trajectory indicator (On Track, Delayed, Completed, On Hold)
- Timeline: Contract Start → End dates
- Days remaining countdown
- Status color coding

### Client-Project Relationship
- Multiple projects per client
- Projects fetched with client company_name enrichment
- Quick access to client from project detail
- Client health score updated based on project payment patterns

---

## Type Definitions

```typescript
// From Database
type Project = Database["public"]["Tables"]["projects"]["Row"];

// With client enrichment
type ProjectWithClient = Project & {
  clients: { company_name: string } | null;
};

// Payload for status update
interface UpdateProjectStatusPayload {
  id: string;
  status: Project["status"];
}
```

---

## API Routes (Planned)

- `GET /api/projects` - List all projects with pagination
- `GET /api/projects/[id]` - Fetch single project
- `POST /api/projects` - Create new project
- `PATCH /api/projects/[id]` - Update project
- `PATCH /api/projects/[id]/status` - Update status only
- `DELETE /api/projects/[id]` - Delete project

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Total Hooks | 5 |
| Pages | 1 |
| Database Tables | 1 primary (projects) + 5 linked |
| Project Types | 10 |
| Statuses | 10 |
| Engagement Types | 2 |
| Billing Cycles | 3 |

---

## Last Updated

**Date:** 2026-03-05
**Status:** Phase 5 Complete
**Build:** 0 TypeScript errors

---

## Related Documentation
- `invoicing-module.md` - Invoices linked to projects
- `clients-module.md` - Client details
- `contracts-module.md` - Project contracts
- `analytics-module.md` - Project revenue analytics
