# 06 - Invoicing Engine

## Invoice Types

| Type | Number Prefix | Tax | Currency | Bank Details |
|------|--------------|-----|----------|-------------|
| GST (Indian) | G##### | 18% GST | INR | IDFC FIRST |
| International (USA) | G##### | 0% (Export of services) | USD | Skydo US (ACH) |
| International (UAE) | G##### | 0% (VAT not applicable) | AED | Skydo UAE (IBAN) |
| International (UK) | G##### | 0% | GBP | Skydo UK |
| Non-GST | NG##### | 0% | INR | Personal/Other (ask user for details) |
| Pro Forma | PF-YYYYMMDD-XXX | Matches final type | Matches client | Same as final |

G and NG share the same schema but different number sequences. Pro forma invoices have NO sequential number - only an internal reference.

## Invoice Creation Flow

### Step 1: Select Client
- Dropdown with search
- Auto-fills: client_type, currency, tax_rate, billing emails

### Step 2: Invoice Details
- Invoice type: Auto-determined from client_type (editable)
- Invoice date: Default today
- Due date: Default +15 days (configurable per client)
- Billing period (for retainers): Month/quarter selector
- Link to projects: Multi-select from client's active projects

### Step 3: Line Items
- Dynamic line item editor
- Each row: Description (text), Amount (number), Quantity (default 1)
- Add row button, remove row button, drag to reorder
- For retainers: Auto-populate first line item from project retainer_amount
- "Add Additional Item" for ad-hoc charges
- Auto-calculate: Subtotal, Tax (if applicable), Grand Total

### Step 4: Review & Save
- Preview the invoice layout
- Save as Draft (no number assigned yet)
- Save as Pro Forma (generates PF reference, no G/NG number)
- Finalize (assigns G/NG number - only do this when ready to file)

## Invoice Number Assignment

- Draft invoices: No number
- Pro forma: Auto-generate `PF-{YYYYMMDD}-{3-digit counter for that day}` (e.g., PF-20260301-001)
- When pro forma is converted to final: Call `get_next_invoice_number('gst')` or `('non_gst')` to assign sequential number
- CRITICAL: Numbers are assigned at finalization, not creation. This prevents gaps from cancelled pro formas.
- The conversion action: "Convert to Tax Invoice" button on pro forma detail page

## Retainer Auto-Invoice Generation

For retainer projects, the system should:
1. On the 1st of each month (or via manual trigger), check all active retainer projects
2. For each, create a new invoice in DRAFT status with:
   - Line item: "{Project Name} - {Service} ({Month Year})"
   - Amount: project.retainer_amount
   - Tax: based on client type
   - Billing period: that month
3. Admin reviews drafts and either sends or adjusts before sending

Implement as: A "Generate Retainer Invoices" button on the Invoices page that creates drafts for the current month for all active retainers that don't already have an invoice for that period.

## PDF Template Layout

Use `@react-pdf/renderer` to generate PDFs matching the existing Canva design exactly.

### Invoice PDF Structure

Refer to the actual invoice PDFs uploaded. The layout is:

```
[Top tagline bar - centered, small caps, spaced letters]
"DESIGN | DEVELOPMENT | DIGITAL GROWTH"

[Left side]                              [Right side]
WODO logo                                INVOICE (or TAX INVOICE or PROFORMA INVOICE)
WODO Digital Private Limited             Invoice No: G00106
GSTIN: 29AADCW8591N1ZA

[Billing info]
To/Billed To,
{Client Company Name}                   Invoice Date: DD/MM/YYYY
{Address line 1}
{Address line 2}
{City, State, Pincode}
{GSTIN/EIN/TRN}: {number}

[Line items table]
Orange header bar: "Particulars" (left) | "Amount" (right)
- {description}                           {currency} {amount}
- {description}                           {currency} {amount}
                                         ---line---
                            Sub Total:    {currency} {subtotal}
                            GST(18%):     {currency} {tax}    [only for GST]
                            Grand Total:  {currency} {total}  [orange text, bold]

[Below - for international only]
(VAT not applicable - Export of services)

[Bank Details section]
BANK DETAILS
{bank details based on invoice type/currency}

[Stamp/Signature area]
Company stamp image (left)
"Shyam Singh Bhati" (below stamp)

[Footer]
Questions? Email us at accounts@wodo.digital or call us at +91 63621 80633
#1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore, India - 560091
```

### Design Specifications for PDF
- Header tagline: uppercase, letter-spacing 3px, small font
- "INVOICE" text: orange (#fd7e14), large, right-aligned
- Line items table header: orange background (#fd7e14), white text
- Grand Total: orange text, larger font weight
- All amounts: right-aligned
- Font: Use a clean sans-serif (Helvetica or similar available in @react-pdf)
- Company stamp: Position bottom-left above the signer name

### Bank Details Logic

```typescript
function getBankDetails(invoiceType: string, currency: string) {
  if (currency === 'USD') return USA_BANK_DETAILS;
  if (currency === 'AED') return UAE_BANK_DETAILS;
  if (currency === 'GBP') return UK_BANK_DETAILS; // ask user for UK details
  return INDIA_BANK_DETAILS; // INR - both GST and Non-GST
}
```

## Invoice List Page (`/invoices`)

- Tabbed filters: All Invoices | Draft | Sent | Paid | Overdue | Cancelled
- Table columns: Invoice #, Client, Type (badge), Amount, Status (badge), Date, Due Date, Actions
- Sort by date (default newest), amount, status
- Search by invoice number, client name
- Bulk actions: Send selected, Export for accountant
- "Create Invoice" button (accent)

## Invoice Actions

- **Edit**: Only for draft/proforma invoices
- **Preview**: Opens PDF preview in new tab
- **Download PDF**: Generates and downloads
- **Send**: Sends email with PDF attachment (marks as "sent")
- **Mark as Paid**: Opens payment recording form
- **Convert to Tax Invoice**: For proforma only - assigns number, changes type
- **Cancel**: Marks as cancelled with reason
- **Duplicate**: Creates a copy as new draft

## Accountant Monthly Export

"Export for Accountant" button:
- Generates a ZIP file containing:
  - All finalized invoice PDFs for the selected month
  - Summary Excel with: Invoice#, Date, Client, Amount, Tax, Total, Status, Payment Date, Amount Received
- Filter by month/FY
