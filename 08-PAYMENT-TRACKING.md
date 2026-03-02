# 08 - Payment Tracking & Reconciliation

## Payment Recording Flow

When a payment is received against an invoice:

### Step 1: Select Invoice
Navigate from invoice detail "Record Payment" button, or from Payments page "Add Payment"

### Step 2: Payment Form

```
Invoice: {invoice_number} - {client_name} - {total_amount}
Outstanding: {balance_due}

Payment Date: [date picker]
Amount Received: [number] {currency}
Amount Received (INR): [number] -- auto-filled for INR, manual for international
Payment Method: [dropdown: Bank Transfer, Skydo USD, Skydo AED, Skydo GBP, UPI, Other]
Reference Number: [text]

--- Deductions Section ---
TDS Deducted: [number]
TDS Section: [dropdown: 194J, 194C, 194H, Other]
Skydo FX Margin: [number] -- show only for Skydo payments
Skydo Processing Fee: [number] -- show only for Skydo payments
Bank Charges: [number]
Other Deductions: [number]
Deduction Notes: [text]
```

### Step 3: Auto-Calculate

```
Net Received = Amount Received - TDS - Skydo Fees - Bank Charges - Other
```

After saving, update the invoice:
- `total_received += amount_received_inr`
- `total_tds_deducted += tds_amount`
- `total_other_deductions += (skydo + bank + other)`
- `balance_due = total_amount_inr - total_received - total_tds_deducted - total_other_deductions`
- If balance_due <= 0: status = 'paid'
- If balance_due > 0 and total_received > 0: status = 'partially_paid'

## Multi-Currency Handling

All internal tracking is in INR. For international invoices:

1. Invoice is created in client's currency (USD, AED, GBP)
2. `total_amount_inr` is manually entered or calculated at time of payment receipt
3. When recording payment from Skydo, the amount lands in the IDFC bank account as INR
4. User enters the actual INR amount received
5. Difference between (invoice amount * exchange rate) and (INR received) = Skydo FX margin + fees

### Example Flow (USD Invoice for $1,350):

```
Invoice: G00106 | $1,350.00 | Dentique Dental Care
Skydo processes -> WODO receives INR in bank

Record Payment:
  Amount Received (original): $1,350.00
  Amount Received (INR): Rs. 117,994.60  (from bank statement)
  Skydo FX Margin: Rs. 0 (included in rate)
  Skydo Processing Fee: Rs. 0 (or whatever applies)
  
  At exchange rate ~87.4: Expected Rs. 117,990
  Actual received: Rs. 117,994.60
  Difference is minimal, tracked as FX variance
```

## Payments Dashboard (`/payments`)

### Overview Cards (top row)
- Total Invoiced (current month)
- Total Received (current month)
- Total Outstanding
- Overdue Amount

### Payment Timeline
- Chronological list of all payments received
- Each entry: Date, Invoice#, Client, Amount, Method, Deductions summary
- Filter by month, client, payment method

### Due/Overdue Section
- List of invoices approaching due date or overdue
- Sorted by urgency (most overdue first)
- Quick action: "Send Reminder" (prepares reminder notification, user clicks to send)
- Color coding: Yellow (due in 3 days), Red (overdue)

### Reconciliation View
- Table showing each invoice with: Invoiced Amount, Received, TDS, Other Deductions, Balance
- Highlight mismatches where balance != 0 but status is "paid"
- Totals row at bottom

## Payment Reminder Notifications

Instead of auto-sending emails, the system creates notification cards on the dashboard:

- 3 days before due: Yellow card "Invoice {#} for {client} due in 3 days"
- On due date: Orange card "Invoice {#} for {client} due today"
- 7 days overdue: Red card "Invoice {#} for {client} is 7 days overdue"

Each card has a "Send Reminder" button that opens an email compose with pre-filled content.

## TDS Certificate Tracking

On client detail page, TDS tab shows a grid:

```
FY 2025-26
         Q1 (Apr-Jun)  Q2 (Jul-Sep)  Q3 (Oct-Dec)  Q4 (Jan-Mar)
Status:  Received       Pending       Pending        N/A
Amount:  Rs. 11,700     -             -              -
Date:    15/07/2025     -             -              -
```

For each quarter, track: received (boolean), date, amount, uploaded certificate file.
Highlight pending quarters in yellow if the quarter has ended.
