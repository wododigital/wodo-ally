# Phase 11: Email System Audit

## Summary
- Files reviewed: 12
- Issues found: 23 (Critical: 3, High: 6, Medium: 9, Low: 5)
- Email system readiness: 55% (significant gaps must be addressed before SMTP activation)

### Files Reviewed
1. `src/lib/email/client.ts` - Nodemailer transport configuration
2. `src/lib/email/templates.ts` - HTML email templates (4 templates)
3. `src/app/api/email/send/route.ts` - Central email send API
4. `src/app/api/invoices/[id]/send-email/route.ts` - Invoice-specific send endpoint
5. `src/app/api/invoices/[id]/email-activity/route.ts` - Email activity tracking API
6. `src/components/invoices/send-invoice-email-modal.tsx` - Email compose modal
7. `src/components/invoices/send-invoice-dropdown.tsx` - Send action dropdown
8. `src/lib/hooks/use-email-activity.ts` - Email activity React hook
9. `src/lib/hooks/use-reports.ts` - Investor report sending logic
10. `src/app/(dashboard)/invoices/[id]/page.tsx` - Invoice detail page (email integration)
11. `src/app/(dashboard)/settings/page.tsx` - Email template settings
12. `src/app/(dashboard)/reports/page.tsx` - Report sending UI

---

## 11.1 Email Client Configuration

### Findings

**Nodemailer Setup** (`src/lib/email/client.ts`, 42 lines)

The transport is configured for Microsoft 365 (Office 365) SMTP:
- Host: `smtp.office365.com` (correct)
- Port: 587 with STARTTLS (correct)
- Auth via `SMTP_USER` and `SMTP_PASS` / `SMTP_PASSWORD` env vars

**Issues Found:**

1. **[CRITICAL] Hardcoded fallback email address** (line 9): `SMTP_USER` falls back to `"accounts@wodo.digital"` via `??`. If env vars are missing, the transport will attempt to authenticate with an empty password and a hardcoded username. This will not crash the server but will produce a confusing SMTP auth error at send time rather than failing fast at startup.

2. **[HIGH] No connection pooling or reuse**: `createTransport()` is called fresh on every `sendEmail()` invocation (line 29). Nodemailer transports should be created once and reused. Creating a new transport per request means a new TCP+TLS handshake for every email, which is slow and may trigger Microsoft 365 rate limiting.

3. **[HIGH] No retry logic**: If the SMTP send fails (network timeout, temporary 4xx error), the email is simply lost. There is no retry mechanism, exponential backoff, or dead letter queue.

4. **[HIGH] No rate limiting**: No throttling is implemented. If a bulk operation sends many emails in rapid succession, Microsoft 365 will throttle or block the account (Office 365 limits: 30 messages/minute, 10,000/day).

5. **[MEDIUM] Insecure TLS configuration** (line 13): `tls: { ciphers: "SSLv3" }` is problematic. SSLv3 is a deprecated, insecure protocol. Modern Office 365 requires TLS 1.2+. This cipher setting may cause connection failures or security vulnerabilities. It should be removed or set to a modern cipher suite.

6. **[LOW] No connection verification**: There is no `transporter.verify()` call to test connectivity before attempting to send. A health-check endpoint would be useful for monitoring.

7. **[MEDIUM] No graceful degradation when SMTP is unconfigured**: The `sendEmail` function does not check whether SMTP credentials are actually present before attempting to send. It should detect missing credentials and return a clear error like "SMTP not configured" rather than letting Nodemailer throw an opaque authentication error.

---

## 11.2 Email Templates

### Findings

**Template Architecture** (`src/lib/email/templates.ts`, 381 lines)

Four HTML templates are implemented:
1. `invoiceSentTemplate` - Invoice delivery
2. `paymentReminderTemplate` - Payment reminder/overdue
3. `paymentReceiptTemplate` - Payment confirmation
4. `investorReportTemplate` - Monthly investor report

**Positive Observations:**
- All templates use inline CSS (correct for email clients)
- Professional design with WODO branding (dark header, orange accent #fd7e14)
- 600px max-width container (standard for email)
- Company details in footer (GSTIN, CIN, address, contact)
- Responsive meta viewport tag included
- Templates are well-structured with a shared `wrapTemplate()` wrapper

**Issues Found:**

8. **[CRITICAL] No HTML escaping/sanitization of template variables**: All template variables (`clientName`, `invoiceNumber`, `amount`, `dueDate`) are interpolated directly into HTML via template literals (e.g., line 193: `Dear ${clientName}`). If a client name contains HTML or script tags, this creates an XSS vector in the email. While email clients generally strip JavaScript, malicious HTML can still alter email rendering or inject phishing content. All variables should be HTML-entity-escaped.

9. **[MEDIUM] `display: flex` used in email HTML** (lines 78-79, `INFO_ROW_STYLE`): `display: flex` is not supported in Outlook (desktop), Yahoo Mail, or several other email clients. The info rows showing Invoice No. and Due Date will break in these clients. Use `<table>` layouts instead for email compatibility.

10. **[MEDIUM] `<style>` block in `<head>`** (line 159): The `BASE_STYLES` are placed in a `<style>` tag. Gmail strips `<style>` tags from `<head>`. The styles there (`margin: 0; padding: 0; box-sizing: border-box;`) will not apply in Gmail. All styles should be fully inline.

11. **[MEDIUM] No text-only fallback**: There is no `text` property set in `sendEmail()`. Email clients that cannot render HTML (or users who prefer plain text) will see nothing. Nodemailer supports a `text` option for plaintext fallback.

12. **[LOW] Duplicate inline style on investor report** (line 360): `<span style="${INFO_VALUE_STYLE}" style="color: #16a34a;">` has two `style` attributes. The second one will be ignored by most browsers/email clients. The green color for revenue will not render.

13. **[MEDIUM] `border-radius` and `box-shadow` in container** (lines 24-25): These CSS properties are not supported in Outlook desktop. The email will look boxy in Outlook but functional - not a blocker but worth noting.

14. **[LOW] `currency` parameter unused in `invoiceSentTemplate`**: The function signature accepts `currency` in the data object (line 187) but it is destructured and ignored (line 189). The amount is displayed as-is, meaning the caller must pre-format it with the currency symbol. This is fragile - if a caller passes a raw number, it will display without currency context.

15. **[MEDIUM] Settings email templates are disconnected from actual send templates**: The Settings page (`EmailTemplatesTab`) stores customized templates in `localStorage` under `wodo_email_templates`. However, the actual email sending flow (`/api/email/send`) uses hardcoded templates from `src/lib/email/templates.ts`. The Settings UI gives the illusion of customization but the customizations are never actually used when sending emails. This is a functional gap that will confuse users.

---

## 11.3 Invoice Email Flow

### Findings

**Two Competing Endpoints:**

There are two separate API routes for sending invoice emails, creating confusion:

1. `/api/invoices/[id]/send-email/route.ts` - **DOES NOT ACTUALLY SEND EMAIL** (line 50: `// TODO: Send email via nodemailer/email service`). It validates inputs and returns `{ success: true, message: "Email scheduled for sending" }` without sending anything. This is the endpoint the UI modal (`SendInvoiceEmailModal`) calls.

2. `/api/email/send/route.ts` - This is the route that actually integrates with Nodemailer and sends real emails. It is used by the investor report flow (`useSendReport`) but NOT by the invoice email modal.

16. **[CRITICAL] Invoice emails are never actually sent**: The `SendInvoiceEmailModal` component calls `/api/invoices/${invoiceId}/send-email` (line 100 of the modal), which is a stub that returns success without sending anything. The user sees "Email sent successfully" toast but no email is dispatched. This is the most significant finding in this audit.

17. **[HIGH] No PDF attachment in email flow**: Neither endpoint attaches the invoice PDF. The `sendEmail` function in `client.ts` supports attachments (lines 24-27), but neither the send-email route nor the `/api/email/send` route generates or attaches a PDF. For invoice emails, the PDF attachment is essential.

18. **[HIGH] Invoice status not updated to "sent" after email**: The `/api/invoices/[id]/send-email/route.ts` does not update the invoice status to "sent" or set `sent_at`. The invoice detail page handles this separately via the `StatusChangeDropdown`, but it is not tied to the actual email send action. The `onSent` callback in the detail page (line 387) records email activity but does not update the invoice status.

19. **[MEDIUM] No validation that client has an email**: When the modal opens, it pre-fills `clientEmail` from `invoice.client?.billing_emails?.[0]`. If the client has no billing emails, it defaults to an empty string and the user must manually enter one. There is no server-side validation that the email address actually belongs to the client or exists in the system.

20. **[LOW] Email activity double-recording potential**: The invoice detail page records email activity in the `onSent` callback (lines 387-392), and separately the `/api/email/send` route also logs activity (lines 170-201). If the flow were properly connected, activity could be recorded twice.

---

## 11.4 Email Activity Tracking

### Findings

**Activity API** (`/api/invoices/[id]/email-activity/route.ts`, 175 lines)

- POST endpoint records activity events (sent, bounced, opened)
- GET endpoint retrieves activity log ordered by `sent_at` descending
- Input validation for action_type, email_template, and email_recipient
- Email format validation via regex
- Invoice existence check before inserting activity
- Authenticated (requires user session)

**Activity Display** (invoice detail page, lines 644-732)

- Email activity timeline is displayed in the sidebar
- Shows sent, viewed, and payment events
- Shows email recipient and resent count
- "No emails sent yet" placeholder when no activity

**Positive Observations:**
- Clean separation of concerns with dedicated API and hook
- TanStack Query integration with 30-second stale time
- Query invalidation on new activity recording
- Proper authentication on both GET and POST

**Issues Found:**

21. **[MEDIUM] No open tracking (pixel tracking) implemented**: The activity API supports `action_type: "opened"` but there is no mechanism to trigger it. No tracking pixel is embedded in email templates. Open tracking would require a unique URL per email that, when loaded, records the open event.

22. **[LOW] No click tracking**: No link tracking is implemented. Links in emails go directly to their destinations without any tracking wrapper.

23. **[MEDIUM] Type mismatch between systems**: The email activity route defines `EmailTemplate` as `"invoice" | "reminder" | "followup"`, but `use-email-activity.ts` defines `EmailTemplate` as `"invoice_send" | "invoice_reminder" | "invoice_overdue" | "proforma_send" | "payment_receipt" | "custom"`. The invoice detail page passes `invoice_${sendEmailType}` (e.g., `"invoice_invoice"`, `"invoice_reminder"`) which matches neither. This would cause validation failures if the email activity POST endpoint enforces strict validation - and it does (line 79-84 of email-activity route).

---

## 11.5 SMTP-Not-Configured Handling

### Findings

**Current Behavior When SMTP Is Not Configured:**

- The UI allows users to click "Send Email" and compose an email
- The modal submits to `/api/invoices/[id]/send-email` which is a stub - it returns success without sending
- Users see a "Email sent successfully" toast message - misleading since nothing was sent
- If the flow were corrected to use `/api/email/send`, Nodemailer would throw an SMTP authentication error, which would be caught and returned as a 500 error with the SMTP error message (e.g., "Invalid login")
- There is no UI indication that SMTP is not configured
- There is no setup guide or configuration page for SMTP settings
- The Settings page has an "Email Templates" tab but no SMTP configuration section

**What Should Happen:**
- The API should detect missing SMTP credentials and return a specific error (e.g., `{ error: "SMTP not configured", code: "SMTP_NOT_CONFIGURED" }`)
- The UI should display a clear message like "Email sending is not configured. Please contact your administrator to set up SMTP."
- Optionally, a setup wizard in Settings for SMTP configuration

---

## 11.6 Security

### Findings

**Authentication:**
- Both email endpoints require Supabase authentication (user session) - good
- The central `/api/email/send` route checks `supabase.auth.getUser()` and returns 401 if unauthenticated
- The `/api/invoices/[id]/send-email` route also verifies authentication

**Email Validation:**
- Client-side: regex validation in the modal (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Server-side: the email-activity route validates email format; the send-email route does not validate email format
- The central `/api/email/send` route does NO email format validation on the `to` field

**Issues Found:**

- **[HIGH] No email address validation in `/api/email/send`**: The `to` field is cast to string and passed directly to Nodemailer without format validation. Malformed addresses will only fail at the SMTP level.

- **[LOW] Email header injection not explicitly prevented**: While Nodemailer handles header injection prevention internally, the application does not sanitize newline characters from subject lines or email addresses before passing them to Nodemailer. This is low risk because Nodemailer's `sendMail` function handles this, but defense-in-depth would be better.

- **Attachment validation**: The `sendEmail` function accepts arbitrary attachments (Buffer + contentType). No size limits or type restrictions are enforced. Currently no endpoint actually sends attachments, but when PDF attachment is added, size limits should be enforced.

- **`eslint-disable` for Supabase typing**: Both email-activity and email/send routes cast Supabase client to `any` (e.g., `const db = supabase as any`) to bypass type checking for the `invoice_email_activity` table. This table is not defined in `database.ts` types, confirming the table exists in the database but the TypeScript types are not synchronized.

---

## 11.7 Additional Findings

### Settings Email Templates Are Decorative
The Settings page has a full email template editor (`EmailTemplatesTab`) with:
- 4 default templates (Invoice Sent, Payment Reminder, Payment Received, Payment Overdue)
- Variable support (`{{client_name}}`, `{{invoice_number}}`, etc.)
- Rich text editor for body
- LocalStorage persistence

However, these templates are **completely disconnected** from the actual email send flow. The `/api/email/send` route uses hardcoded templates from `src/lib/email/templates.ts`. The Settings templates are never loaded or used anywhere in the send path. This is misleading to users who customize templates expecting them to be used.

### No Bulk Email Feature
There is no bulk email functionality. Each invoice must be sent individually.

### No Email Queue or Background Jobs
Emails are sent synchronously in the API request handler. There is no queue (e.g., BullMQ, Vercel Cron) for:
- Retrying failed sends
- Scheduling automatic reminders for overdue invoices
- Batch sending
- Rate limiting compliance

### No Email Preview Before Sending
The `SendInvoiceEmailModal` shows a plain text editor for subject/body, but does not show a preview of the actual HTML email template that will be sent. The user composes plain text, but the recipient would receive the styled HTML template - if the send flow were working.

### Investor Report Email Flow Is Functional
Unlike the invoice flow, the investor report email flow (`useSendReport` -> `/api/email/send` with type `"investor_report"`) is properly wired. It would actually send emails if SMTP were configured. It also updates the report status to "sent" and records `sent_to` recipients. This is the only email flow that is end-to-end complete (modulo the SMTP configuration).

### GSTIN Discrepancy
The email template footer shows GSTIN `29AADCW8591N1ZA` (line 173 of templates.ts), but `constants.ts` also shows `29AADCW8591N1ZA`. The Settings page defaults show `29AAECW2882M1ZW` (line 87 of settings page). These are different GSTINs - one may be for the company and one for a different entity, but this inconsistency in official communications is risky.

### `invoice_email_activity` Table Not in TypeScript Types
The `database.ts` types file does not include the `invoice_email_activity` table. This forces the use of `as any` casts and eliminates type safety for email activity operations.

---

## Recommendations Before SMTP Activation

### Priority 1 - Must Fix (Blockers)

1. **Wire the invoice email flow end-to-end**: The `SendInvoiceEmailModal` must call `/api/email/send` (with type `invoice_sent`) instead of the stub `/api/invoices/[id]/send-email`. Alternatively, implement the TODO in the send-email route to actually send via Nodemailer.

2. **Add PDF attachment to invoice emails**: Generate the invoice PDF server-side and attach it to the email. The attachment infrastructure exists in `sendEmail()` but is unused.

3. **HTML-escape all template variables**: Sanitize `clientName`, `invoiceNumber`, `amount`, `dueDate`, and all other interpolated values to prevent HTML injection in emails.

4. **Fix TLS configuration**: Remove `tls: { ciphers: "SSLv3" }` from the Nodemailer transport. Let Nodemailer negotiate the best available TLS version with Office 365.

### Priority 2 - Should Fix (Important)

5. **Add SMTP availability check**: Detect missing `SMTP_USER`/`SMTP_PASS` env vars and return a clear error code. Show a user-friendly message in the UI instead of a generic failure.

6. **Create transport singleton**: Initialize the Nodemailer transport once (module-level) and reuse it, rather than creating a new transport per email.

7. **Add retry logic**: Implement at least 2-3 retries with exponential backoff for transient SMTP failures.

8. **Fix email template compatibility**: Replace `display: flex` with `<table>` layouts in email templates for Outlook/Yahoo compatibility.

9. **Fix type mismatches in email activity**: Align `EmailTemplate` types across `email-activity/route.ts`, `use-email-activity.ts`, and the invoice detail page. Currently they use incompatible enum values.

10. **Update invoice status on email send**: Automatically set `status: "sent"` and `sent_at` on the invoice when the email is successfully sent.

11. **Connect Settings templates to send flow**: Either make the Settings email template editor actually control what is sent, or remove it to avoid user confusion.

12. **Add email format validation to `/api/email/send`**: Validate `to` addresses server-side before passing to Nodemailer.

### Priority 3 - Nice to Have

13. **Add text-only fallback** to all email templates.
14. **Add rate limiting** for email sends (respect Office 365 limits).
15. **Fix duplicate `style` attribute** on investor report template revenue span.
16. **Add `invoice_email_activity` to `database.ts`** types for type safety.
17. **Add email preview** in the send modal showing the actual HTML template.
18. **Implement open tracking** via tracking pixel if business requirements warrant it.
19. **Verify GSTIN consistency** across templates, constants, and settings defaults.
20. **Add a `transporter.verify()` health check** endpoint for SMTP monitoring.

---

## Architecture Diagram

```
Current Flow (BROKEN for invoices):

  UI Modal (SendInvoiceEmailModal)
       |
       v
  /api/invoices/[id]/send-email  <-- STUB, returns success without sending
       |
       v
  "Email sent successfully" toast  <-- LIE

Correct Flow (works for investor reports only):

  Reports Page (useSendReport)
       |
       v
  /api/email/send  <-- Actually calls Nodemailer
       |
       v
  src/lib/email/client.ts -> sendEmail() -> Nodemailer -> SMTP
       |
       v
  Email activity logged to Supabase
```

---

## Risk Assessment

| Risk | Severity | Likelihood | Impact |
|------|----------|------------|--------|
| Invoice emails silently not sent | Critical | Certain (current state) | Users believe emails are sent; clients never receive invoices |
| XSS in email templates | High | Low (requires malicious client name) | Phishing content in branded emails |
| SSLv3 TLS config | High | Medium | Connection failures or downgrade attacks |
| Wrong GSTIN in emails | Medium | Certain (if wrong value) | Legal/compliance issues |
| Outlook rendering broken | Medium | Certain (flex layout) | Unprofessional appearance to clients using Outlook |
| Settings templates misleading | Medium | Certain | User frustration; customizations silently ignored |
