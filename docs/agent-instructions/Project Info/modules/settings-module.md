# WODO Ally - Settings Module Documentation

Complete reference guide for configuration, preferences, team management, and system settings in WODO Ally.

---

## Database Models

### Tables Used
- **`profiles`** - User profile with company preferences
- **`company_settings`** - Company-wide configuration
- **`bank_accounts`** - Bank details for payments
- **`services`** - Service catalogue (management)
- **`auth.users`** (Supabase) - Team member accounts

---

## Core Hooks

### File: `src/lib/hooks/use-auth.ts`, custom hooks

#### 1. **useCompanySettings()**
Fetch company configuration.
```typescript
// Usage
const { data: settings } = useCompanySettings();

// Returns: CompanySettings
// {
//   company_name, logo_url, industry, country,
//   invoice_prefix, invoice_start_number, gst_rate,
//   currency, timezone, language, invoice_footer_text,
//   payment_terms, email_notifications_enabled
// }
```

#### 2. **useUpdateCompanySettings()**
Update company configuration.

#### 3. **useBankAccounts()**
Fetch all saved bank accounts.

#### 4. **useCreateBankAccount()**
Add new bank account.

#### 5. **useUpdateBankAccount()**
Update bank account details.

#### 6. **useDeleteBankAccount()**
Delete bank account (soft delete).

#### 7. **useServices()**
Fetch service catalogue for management (see services-module).

#### 8. **useTeamMembers()**
Fetch team members (see auth-module).

#### 9. **useNotificationSettings()**
Fetch notification preferences.

#### 10. **useUpdateNotificationSettings()**
Update notification preferences.

---

## Settings Tabs

### File: `src/app/(dashboard)/settings/page.tsx`

**Tab Navigation:**
- Company Info
- Bank Details
- Invoice Settings
- Team & Permissions
- Notifications

---

## Tab 1: Company Information

**Fields:**
- Company Name (required, text)
- GST Number (optional, text)
- Logo Upload (optional, file input)
- Industry Type (required, dropdown)
- Country (required, dropdown)
- Currency (required, dropdown)
- Timezone (required, dropdown)
- Language (required, dropdown: English, Hindi, etc.)
- Website (optional, URL)
- Phone (optional, phone input)
- Email (optional, email input)
- Address (required, textarea)
- City, State, Pincode (required, text)

**Validation:**
- Company name: 2-255 chars
- GSTIN: 15-digit format
- Logo: JPG, PNG, max 5MB
- Currency: Valid ISO 4217 code
- Timezone: Valid IANA timezone

**Hooks Used:**
- `useCompanySettings()` - Fetch current
- `useUpdateCompanySettings()` - Save changes
- Logo upload to Supabase storage (company-logos/ folder)

**Save Button:**
- Validates all required fields
- Shows loading spinner
- Toast: "Company information updated"
- Invalidates company settings cache

---

## Tab 2: Bank Details

**Features:**
- List of all saved bank accounts
- Account number (masked, last 4 digits visible)
- Bank name, IFSC code
- Account holder name
- Account type (Current, Savings)
- Primary account indicator (star icon)
- Edit and Delete buttons

**Add Bank Account Modal:**
- Bank Name (required, dropdown or text)
- Account Number (required, number)
- Confirm Account Number (required)
- Account Holder Name (required)
- Account Type (required, dropdown: Current/Savings)
- IFSC Code (required, 11-char format)
- Swift Code (optional, international)
- Currency (optional, defaults to INR)
- Set as Primary (checkbox)

**Validation:**
- Account number: 9-18 digits
- IFSC: 11 characters
- Bank name: Valid from list
- All fields required except Swift, Currency

**Hooks Used:**
- `useBankAccounts()` - Fetch list
- `useCreateBankAccount()` - Add new
- `useUpdateBankAccount()` - Edit
- `useDeleteBankAccount()` - Delete with confirmation

**Security:**
- Account number encrypted at rest
- Only last 4 digits shown in list
- Full number shown only in edit modal (for verification)
- Delete shows confirmation: "This action cannot be undone"

---

## Tab 3: Invoice Settings

**Section A: Invoice Generation**
- Invoice Number Prefix (text, e.g., "INV" or "WDO")
- Starting Invoice Number (number, e.g., 1001)
- Auto-increment: Next invoice number preview
- Next Invoice Number (read-only display)

**Section B: Tax & Pricing**
- Default GST Rate (number, default 18)
- Default Currency (dropdown: INR, USD, AED, GBP, EUR)
- Rounding Preference (dropdown: Round to nearest rupee, etc.)

**Section C: Invoice Display**
- Invoice Due Days (number, default 30)
- Show GST on Invoice (checkbox)
- Invoice Footer Text (textarea, for terms/notes)
- Payment Instructions (textarea, bank details for payment)
- Show Company Logo (checkbox)
- Show QR Code (checkbox, for UPI payment)

**Validation:**
- Prefix: Alphanumeric, max 10 chars
- Starting number: >= 1
- Tax rate: 0-100%
- Due days: 0-365
- Footer text: Max 500 chars

**Hooks Used:**
- `useCompanySettings()` - Fetch
- `useUpdateCompanySettings()` - Save

**Preview:**
- Live preview of invoice with settings applied
- Shows how prefix + number will appear
- Shows tax calculation example

---

## Tab 4: Team & Permissions

**Features:**
- List of all team members
- Columns: Name, Email, Role, Status, Last Login, Actions
- Roles color-coded: Admin (purple), Manager (blue), Accountant (green), Viewer (gray)
- Last login timestamp (e.g., "2 hours ago")
- Online/Offline indicator (if available)

**Add Team Member:**
- Email (required, email input)
- Name (required, text)
- Role (required, dropdown: Admin, Manager, Accountant, Viewer)
- Send Invitation (checkbox, auto-checked)

**Action Buttons:**
- Edit Role (dropdown, change role)
- Remove Member (button with confirmation)
- Resend Invitation (if pending)

**Permission Matrix** (Optional Display):
- Grid showing which roles have which permissions
- Read-only reference
- Help text: "Contact admin for permission requests"

**Validation:**
- Email: Valid format
- Name: 2-100 chars
- Role: Valid enum

**Hooks Used:**
- `useTeamMembers()` - Fetch list
- `useAddTeamMember()` - Invite new
- `useUpdateMemberRole()` - Change role
- `useRemoveTeamMember()` - Remove with confirmation

**Confirmation Dialogs:**
- Remove member: "This user will lose access to WODOAlly. This action can be undone by re-inviting."
- Change role: "This user's access will be updated immediately."

---

## Tab 5: Notifications

**Email Notifications:**
- Invoice Sent (checkbox) - When invoice sent to client
- Payment Received (checkbox) - When payment recorded
- Overdue Invoice Alert (checkbox) - When invoice overdue
- Low Balance Alert (checkbox) - When cash balance low
- Contract Expiry (checkbox) - Days before contract end
- New Team Member (checkbox) - When new user invited
- Daily Digest (checkbox) - Daily summary email
- Weekly Report (checkbox) - Weekly financial summary

**Notification Recipients:**
- Notify Me (checkbox) - Send to current user
- Notify All Admins (checkbox) - Send to all admin users
- Additional Emails (text, comma-separated) - Custom recipients

**Notification Schedule:**
- Digest Frequency (dropdown: Immediately, Daily, Weekly)
- Digest Time (time picker, e.g., 9:00 AM)
- Digest Days (for weekly: checkboxes for Mon-Sun)

**In-App Notifications:**
- Toast notifications (always on)
- Notification bell icon with count
- Notification center dropdown

**Validation:**
- Email addresses: Valid format
- Time: Valid time format
- At least 1 recipient selected

**Hooks Used:**
- `useNotificationSettings()` - Fetch preferences
- `useUpdateNotificationSettings()` - Save changes

**Test Notification:**
- Button: "Send Test Email"
- Sends sample email to all configured recipients
- Toast: "Test email sent successfully"

---

## Layout & Design

**Overall Layout:**
- Page heading: "Settings"
- Tab navigation (horizontal, sticky on scroll)
- Active tab highlighted with accent color
- Content area: Form fields in sections
- Save buttons: At bottom of each tab
- Loading: Spinner while saving
- Success: Toast notification

**Mobile Responsive:**
- Tabs: Horizontal scrolling tabs (swipe on mobile)
- Forms: Full width, single column
- Sections: Collapse optional sections
- Buttons: Full width on mobile

**Desktop:**
- Tabs: All visible in horizontal bar
- Forms: Max-width 800px, centered
- Sections: All expanded by default
- Side-by-side layouts where possible

---

## Data Persistence

**Auto-Save (Optional):**
- Debounced save on field change (3-second delay)
- Shows "Unsaved changes" indicator
- User must click Save to confirm
- Or: Traditional "Save" button only

**Validation on Save:**
- Client-side validation before API call
- Toast errors for validation failures
- Server-side validation on API
- Toast errors for server failures

**Undo Functionality:**
- "Undo" button available after save
- Reverts to previous saved state
- 5-minute undo window
- Toast: "Settings restored to previous version"

---

## Type Definitions

```typescript
// Company settings
interface CompanySettings {
  id: string;
  company_name: string;
  logo_url?: string;
  industry?: string;
  country: string;
  currency: string;
  timezone: string;
  language: string;
  gst_number?: string;
  website?: string;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

// Bank account
interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string; // masked
  account_holder_name: string;
  account_type: "current" | "savings";
  ifsc_code: string;
  swift_code?: string;
  is_primary: boolean;
}

// Invoice settings
interface InvoiceSettings {
  invoice_prefix: string;
  invoice_start_number: number;
  default_gst_rate: number;
  default_currency: string;
  invoice_due_days: number;
  invoice_footer_text?: string;
  payment_instructions?: string;
}

// Notification settings
interface NotificationSettings {
  invoice_sent: boolean;
  payment_received: boolean;
  overdue_alert: boolean;
  digest_frequency: "immediate" | "daily" | "weekly";
  digest_time?: string;
  digest_recipients: string[];
}

// Team member
interface TeamMember extends Profile {
  role: UserRole;
  last_login?: string;
  is_online?: boolean;
}
```

---

## Last Updated

**Date:** 2026-03-05
**Status:** Phase 5 Complete
**Build:** 0 TypeScript errors

---

## Related Documentation
- `auth-module.md` - Team management
- `invoicing-module.md` - Invoice settings impact
- `services-module.md` - Service catalogue
- `clients-module.md` - Company information
