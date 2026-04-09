# 12 - Email & Notifications

## Email Provider: Nodemailer with Microsoft 365 SMTP

Use Nodemailer to send transactional emails via Microsoft 365 business email.
Sender: accounts@wodo.digital (or whichever Microsoft business email the user provides).

### SMTP Configuration

Create `src/lib/email/transporter.ts`:

```typescript
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.office365.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  },
});

export const EMAIL_FROM = `"${process.env.SMTP_FROM_NAME || "WODO Digital"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`;
```

### Sending an Email (helper)

Create `src/lib/email/send-email.ts`:

```typescript
import { transporter, EMAIL_FROM } from "./transporter";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
  const recipients = Array.isArray(to) ? to.join(", ") : to;

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to: recipients,
    subject,
    html,
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType || "application/pdf",
    })),
  });

  return { messageId: info.messageId, accepted: info.accepted };
}
```

### ASK THE USER FOR:
1. Microsoft business email address (e.g., accounts@wodo.digital)
2. App Password (if MFA is enabled, generate from Microsoft 365 Admin > Security > App Passwords)
   - If MFA is NOT enabled, the regular account password works
3. Confirm SMTP host is smtp.office365.com and port 587
4. Note: Microsoft 365 has a sending limit of 10,000 emails/day and 30 messages/minute which is more than enough for this use case

## Email Templates

### 1. Invoice Sent
Subject: "Invoice {invoice_number} from WODO Digital"
Content: Professional email with invoice summary (amount, due date), PDF attached, payment instructions with bank details, contact info for questions.

### 2. Payment Reminder (Due in 3 days)
Subject: "Reminder: Invoice {invoice_number} due on {due_date}"
Content: Friendly reminder with invoice summary and payment link/details.

### 3. Payment Reminder (Overdue)
Subject: "Overdue: Invoice {invoice_number} - Payment pending"
Content: Firm but professional reminder noting the overdue status, original amount, days overdue.

### 4. Payment Receipt
Subject: "Payment received - Invoice {invoice_number}"
Content: Thank you note confirming payment received, amount, any balance remaining.

### 5. Pro Forma Invoice
Subject: "Pro Forma Invoice from WODO Digital - {project_name}"
Content: Pro forma with PDF attached, requesting payment to proceed.

### 6. Contract Sent
Subject: "Project Contract - {project_name} | WODO Digital"
Content: Contract PDF attached, requesting review, sign, and return.

### 7. Investor Report
Subject: "WODO Digital - Monthly Report: {Month Year}"
Content: Brief summary of key metrics, PDF report attached.

## Email Sending Flow

All emails go through a single API route: `POST /api/emails/send`

```typescript
// Request body
{
  template: 'invoice_sent' | 'payment_reminder' | 'payment_receipt' | ...,
  to: string[], // email addresses
  data: {
    // Template-specific data
    invoiceNumber: string,
    clientName: string,
    amount: string,
    currency: string,
    dueDate: string,
    // ...
  },
  attachments?: [{ filename: string, content: string }] // base64 PDF content
}
```

The API route renders the HTML template with the data, then calls `sendEmail()` from `src/lib/email/send-email.ts`. All emails are sent from the Microsoft 365 business account so they appear professional and land in inbox (not spam) since they come from an authenticated business domain.

### Email HTML Templates

Store templates as functions in `src/lib/email/templates/`. Each returns an HTML string. Use inline CSS for email client compatibility. Keep the WODO branding (orange accent, clean layout). Do NOT use React components for email HTML - use plain template literal strings for maximum compatibility.

## In-App Notification System

Instead of a full notification microservice, use a simple approach:

### Dashboard Attention Cards

On the main dashboard, show action-needed items:

**Due Soon (Yellow cards)**
- Invoices due within 3 days
- Action: "Send Reminder" button

**Overdue (Red cards)**
- Invoices past due date
- Action: "Send Reminder" button
- Shows days overdue

**Drafts Pending (Blue cards)**
- Draft invoices awaiting finalization
- Retainer invoices auto-generated but not sent
- Action: "Review & Send"

**Approvals (Orange cards)**
- Uncategorized expenses needing review
- New bank statement uploaded, pending categorization

These are computed queries, not stored notifications. They pull live from the database each time the dashboard loads.

## Email Preview

Before sending any email, show a preview modal with:
- Rendered email content
- Attachment list
- Recipient list
- "Send" and "Cancel" buttons

This ensures no accidental sends.
