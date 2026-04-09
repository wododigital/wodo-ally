# WODO Ally - Onboard Module Documentation

Complete reference guide for the client onboarding wizard and multi-step setup flow in WODO Ally.

---

## Database Models Created

### Tables Affected
- **`clients`** - Client master data
- **`client_contacts`** - Client team members
- **`projects`** - Project setup
- **`contracts`** - Contract creation
- **`services`** - Link to engagement services

---

## Core Hooks

### File: `src/lib/hooks/use-clients.ts`, `use-projects.ts`, `use-contracts.ts`

#### 1. **useCreateClient()**
Create new client (step 1).

#### 2. **useCreateProject()**
Create project (step 3).

#### 3. **useCreateContract()**
Create contract (step 4).

#### Combined Flow:
All 3 hooks triggered in sequence from onboard page submission.

---

## Onboarding Flow

### Step 1: Client Basic Information
**Fields:**
- Company Name (required)
- GST Number (required for Indian GST type)
- Industry Type (dropdown)
- Country (required)
- Primary Contact Email (required)
- Phone Number (required)
- Billing Address (required)
- City, State, Pincode (required)

**Validation:**
- Company name: 2-255 chars
- Email: Valid format
- Phone: 10 digits (India) or country-specific
- GSTIN: Format XXXXXXXXXXXXXXXX (15 digits)
- Address: Min 5 chars

**Next Button:**
- Validates all required fields
- Shows inline error messages
- Auto-focus first error field

---

### Step 2: Points of Contact (POC)
**Section A: Signing Authority**
- Full Name (required)
- Designation (dropdown: CEO, CTO, Finance Manager, etc.)
- Email (required)
- Phone (required)

**Section B: Billing Contacts**
- Add multiple billing email addresses (min 1)
- Each email address can be a different person
- Useful for organizations with multiple billing contacts
- Buttons: + Add Another, Remove

**Section C: Engagement Details**
- Expected Services (checkboxes: Web Dev, SEO, Branding, etc.)
- Primary Contact Role (dropdown)

**Validation:**
- At least 1 signing authority
- At least 1 billing email
- All emails must be valid format
- Names 2-100 chars

---

### Step 3: Project Setup
**Fields:**
- Project Name (required)
- Project Description (optional, textarea)
- Project Type (required, dropdown)
  - Web Development, UI/UX, SEO, etc.
- Engagement Type (required, radio)
  - One-Time or Retainer
- If One-Time:
  - Total Project Value (required, number)
  - Payment Split (optional, phases)
  - Projected End Date (optional)
  - Timeline Days (optional)
- If Retainer:
  - Retainer Amount (required, number)
  - Billing Cycle (required, dropdown: Monthly, Quarterly, Annual)
  - Contract Start Date (required)
  - Contract End Date (required)
  - Minimum Contract Months (optional)

**Validation:**
- Project name: 2-255 chars
- Project type: Valid enum
- Value: > 0 if provided
- Dates: End date after start date
- If retainer: dates are required

---

### Step 4: Contract & Terms
**Fields:**
- Contract Type (required, dropdown)
  - Service Agreement, MSA, NDA, SOW, Retainer, Other
- Contract Title (required)
- Key Terms (required, textarea)
  - Payment schedule, deliverables, timeline
- Renewal Terms (optional, textarea)
  - Auto-renewal conditions
- Termination Clause (optional, textarea)
  - How contract can end

**Validation:**
- Title: 2-255 chars
- Key terms: Min 20 chars
- All dates calculated from project dates

---

## Pages

### File: `src/app/(dashboard)/onboard/page.tsx`

**Overall Layout:**
- Centered form (max-width: 600px on desktop)
- Step indicator at top (1/4, 2/4, 3/4, 4/4)
- Current step title
- Form fields for current step
- Previous / Next buttons (Previous disabled on step 1)
- Submit button on final step (labeled "Complete Onboarding")
- Progress indicator bar

**Visual Design:**
- Glass-card styling for form container
- Dark theme consistent with dashboard
- Accent color (#fd7e14) for CTA buttons
- Responsive: Full width on mobile, centered on desktop
- No page heading (step title is sufficient)
- Inline validation messages (red text below field)

**Mobile Behavior:**
- Full-screen form
- Large tap targets for inputs
- Previous/Next buttons full width at bottom
- No scrolling within step (keep step small enough)

---

## Form Validation

**Real-Time Validation:**
- Email: Valid format + domain check
- Phone: Valid for selected country
- GSTIN: 15-digit format check
- Dates: End date > start date
- Numbers: > 0 and valid currency

**On Submit:**
- All required fields must be filled
- All validation rules must pass
- Toast message: "Fixing errors before proceeding"
- Auto-focus first error field
- Highlight error fields in red

**Success:**
- Toast: "Client and project created successfully"
- Auto-redirect to /clients/[newClientId]
- Show: "Setup Complete" message with summary

---

## Error Handling

**Client Creation Error:**
- Toast: "Failed to create client: {error}"
- Stay on step 1
- Don't clear form (preserve user input)

**Project Creation Error:**
- Toast: "Failed to create project: {error}"
- Stay on step 3
- Don't clear form

**Contract Creation Error:**
- Toast: "Failed to create contract: {error}"
- Stay on step 4
- Don't clear form

**Network Error:**
- Toast: "Connection error. Please try again."
- Retry button available
- Form data preserved

---

## Integration

### Created Entities
1. **Client** (with country, billing address, contacts)
2. **Client Contacts** (Signing authority + Billing emails)
3. **Project** (with type, value, dates, status=onboarding)
4. **Contract** (with key terms, status=draft)

### Next Steps (After Onboarding)
- User redirected to new client detail page
- Project visible in /projects page
- Contract ready to be sent (download PDF)
- First invoice can be created for project
- Services can be added to project

### Data Ownership
- All created entities owned by authenticated user
- Company ID auto-set from user's company
- Created timestamps recorded
- User ID (created_by) stored in entities

---

## Responsive Behavior

**Desktop (1024px+):**
- Centered form, max-width 600px
- Full step title visible
- All fields visible
- Buttons at bottom

**Tablet (768px+):**
- Wider form padding
- Full width on smaller tablets
- All fields visible
- Touch-friendly spacing

**Mobile (375px+):**
- Full width (no padding)
- Larger input heights (48px+ for touch)
- Full-width buttons
- Larger text for readability
- No scrolling within step (keep steps compact)

---

## Type Definitions

```typescript
// Step 1: Client data
interface ClientOnboardStep {
  company_name: string;
  gstin?: string;
  industry?: string;
  country: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

// Step 2: POC data
interface PocOnboardStep {
  signing_authority: {
    name: string;
    designation: string;
    email: string;
    phone: string;
  };
  billing_emails: string[];
  primary_services?: string[];
}

// Step 3: Project data
interface ProjectOnboardStep {
  name: string;
  description?: string;
  project_type: string;
  engagement_type: "one_time" | "retainer";
  total_value?: number;
  retainer_amount?: number;
  billing_cycle?: string;
  contract_start_date?: string;
  contract_end_date?: string;
}

// Step 4: Contract data
interface ContractOnboardStep {
  contract_type: string;
  title: string;
  key_terms: string;
  renewal_terms?: string;
  termination_clause?: string;
}

// Complete onboard payload
interface OnboardPayload
  extends ClientOnboardStep,
    PocOnboardStep,
    ProjectOnboardStep,
    ContractOnboardStep {}
```

---

## Last Updated

**Date:** 2026-03-05
**Status:** Phase 5 Complete
**Build:** 0 TypeScript errors

---

## Related Documentation
- `clients-module.md` - Client data model
- `projects-module.md` - Project data model
- `contracts-module.md` - Contract data model
- `auth-module.md` - User/company context
