# 09 - Expense Management

## Bank Statement Format (IDFC FIRST Bank)

The XLSX file has this structure:
- Sheet name: "Account Statement"
- Rows 1-13: Header info (customer name, account number, period, balances)
- Row 14: Summary row (Opening Balance, Total Debit, Total Credit, Closing Balance)
- Row 15: Column headers
- Row 16+: Transaction data

### Column Mapping (Row 15 headers, 0-indexed):
```
A: Transaction Date (DD-MMM-YYYY format, e.g., "01-Feb-2026")
B: Value Date
C: Particulars (transaction description - THIS IS THE KEY FIELD for categorization)
D: Cheque No.
E: Debit (expense)
F: Credit (income)
G: Balance
```

### Metadata Extraction (Rows 1-14):
```
Row 3: Account Number (cell B)
Row 4: Statement Period (cell B, format "01-Feb-2026 TO 28-Feb-2026")
Row 5: Customer Name (cell B)
Row 14: Opening Balance (A), Total Debit (B), Total Credit (C), Closing Balance (D)
```

## Upload Flow (`/expenses/upload`)

### Step 1: Upload
- Drag-and-drop or file picker for .xlsx file
- Parse immediately on upload using SheetJS (xlsx library)
- Extract metadata (account, period, balances)
- Duplicate detection: Check if a bank_statement record exists for the same period. If yes, warn user.

### Step 2: Parse & Preview
- Show extracted summary: Period, Opening Balance, Closing Balance, Transaction Count
- Show first 10 transactions as preview table
- "Process Statement" button

### Step 3: Auto-Categorize
- For each transaction, run through expense_rules in priority order
- Match the "Particulars" field against patterns
- If match found: assign category, mark is_auto_categorized = true
- If no match: leave as "uncategorized"
- Determine transaction_type based on debit/credit:
  - Debit = expense (or transfer, loan - based on category)
  - Credit = income (or transfer)

### Step 4: Review & Approve
- Show all transactions in a table with:
  - Date, Particulars, Debit, Credit, Category (dropdown), Type, Auto/Manual badge
- Uncategorized items highlighted in yellow
- User can:
  - Change category via dropdown
  - Mark as reviewed
  - Add notes
  - Create new rule from a transaction ("Always categorize '{pattern}' as {category}")
- "Approve All" button marks all as reviewed
- "Save Rules" button persists any new patterns created

## Default Expense Categories

```typescript
const DEFAULT_CATEGORIES = [
  { name: 'Salaries', color: '#3b82f6', patterns: ['Salary', 'sal ', 'SAL'] },
  { name: 'Software/SaaS', color: '#8b5cf6', patterns: [
    'CLAUDE.AI', 'ANTHROPIC', 'Google Workspace', 'HOSTINGER', 'OPENAI',
    'CURSOR', 'DESCRIPT', 'SPARKTRAFFIC', 'HELLOLEADS', 'MICROSBUSEVE',
    'GMBBRIEFCASE', 'UTILITY PP FSS'
  ]},
  { name: 'Rent', color: '#f59e0b', patterns: ['Rent', 'rent'] },
  { name: 'Loan/EMI', color: '#ef4444', patterns: ['SBD FINANCE', 'Lint', 'EMI', 'Loan'] },
  { name: 'Professional Fees', color: '#10b981', patterns: [
    'Consultation', 'DSCCreation', 'RAO AND ASSOCIATES', 'Accounting'
  ]},
  { name: 'Commissions', color: '#f97316', patterns: ['Comission', 'Commission'] },
  { name: 'Freelancer/Vendor Payments', color: '#06b6d4', patterns: [
    'Webdevworks', 'Wikipageupdates', 'GodavariBranding', 'VendorTo'
  ]},
  { name: 'GST Payments', color: '#dc2626', patterns: ['OPT/GST'] },
  { name: 'Office Expenses', color: '#84cc16', patterns: [
    'Officereimbursement', 'ROpurifierAMC', 'Wifipayment', 'Maidsalary'
  ]},
  { name: 'Marketing', color: '#d946ef', patterns: ['Marketing', 'Ads', 'campaign'] },
  { name: 'Travel', color: '#0ea5e9', patterns: ['Travel', 'flight', 'hotel', 'cab'] },
  { name: 'Director Salary', color: '#6366f1', patterns: [] },
  { name: 'Client Payments (Income)', color: '#22c55e', patterns: [
    'SKYDO TECHNOLOGIES', 'NANDHINI', 'HCL FOUNDATION', 'QUINTPROS',
    'DENTIQUE', 'SEA WONDERS', 'HASIRU FARMS'
  ]},
  { name: 'Miscellaneous', color: '#94a3b8', patterns: [] },
];
```

## Rule Matching Engine

```typescript
function categorizeTransaction(particulars: string, rules: ExpenseRule[]): CategoryMatch | null {
  // Sort rules by priority (highest first)
  const sorted = rules.sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    if (!rule.is_active) continue;

    let matched = false;
    switch (rule.match_type) {
      case 'contains':
        matched = particulars.toLowerCase().includes(rule.pattern.toLowerCase());
        break;
      case 'starts_with':
        matched = particulars.toLowerCase().startsWith(rule.pattern.toLowerCase());
        break;
      case 'regex':
        matched = new RegExp(rule.pattern, 'i').test(particulars);
        break;
      case 'exact':
        matched = particulars.toLowerCase() === rule.pattern.toLowerCase();
        break;
    }

    if (matched) return { category_id: rule.category_id, rule_id: rule.id };
  }
  return null;
}
```

## Expense Dashboard (`/expenses`)

### Overview Cards
- Total Expenses (current month)
- Top Category (by amount)
- Uncategorized Count (needs attention)
- Month-over-month change

### Category Breakdown Chart
- Donut/pie chart showing expense distribution by category
- Horizontal bar chart alternative for detailed view
- Filter by month/quarter/FY

### Transaction Table
- Full searchable, sortable, filterable table of all transactions
- Filters: Month, Category, Type (expense/income), Amount range, Reviewed status
- Inline category editing (dropdown in table cell)
- "Create Rule" action on each row

### Monthly Expense Trend
- Line/area chart showing monthly expense totals over time
- Stacked by category

## Income Detection

Credit transactions are treated as income. Auto-link to invoices where possible:
- Match client payment amounts to outstanding invoice amounts
- Match Skydo NEFT entries to international invoice payments
- Suggest links for manual confirmation

## Settings: Manage Rules (`/settings` -> Expense Rules tab)

- Table of all rules with: Pattern, Match Type, Category, Priority, Active toggle
- Add new rule form
- Edit inline
- Test a pattern against sample data
- Import/export rules as JSON
