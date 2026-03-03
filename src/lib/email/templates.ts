// ─── Email HTML Templates ──────────────────────────────────────────────────────
//
// All templates use inline CSS for maximum email client compatibility.
// Design: dark background #0f0f1a, orange accent #fd7e14, white text.
//

const BASE_STYLES = `
  margin: 0; padding: 0; box-sizing: border-box;
`;

const BODY_STYLE = `
  background-color: #f4f4f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
`;

const CONTAINER_STYLE = `
  max-width: 600px;
  margin: 32px auto;
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
`;

const HEADER_STYLE = `
  background-color: #0f0f1a;
  padding: 28px 32px;
  text-align: left;
`;

const HEADER_TAGLINE_STYLE = `
  color: #fd7e14;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0 0 8px 0;
`;

const HEADER_COMPANY_STYLE = `
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
`;

const CONTENT_STYLE = `
  padding: 32px;
`;

const GREETING_STYLE = `
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
`;

const BODY_TEXT_STYLE = `
  font-size: 14px;
  color: #555555;
  line-height: 1.6;
  margin: 0 0 24px 0;
`;

const INFO_BOX_STYLE = `
  background-color: #f8f8fc;
  border-left: 3px solid #fd7e14;
  border-radius: 6px;
  padding: 16px 20px;
  margin: 0 0 24px 0;
`;

const INFO_ROW_STYLE = `
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const INFO_LABEL_STYLE = `
  font-size: 12px;
  color: #888888;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const INFO_VALUE_STYLE = `
  font-size: 13px;
  color: #1a1a1a;
  font-weight: 600;
`;

const AMOUNT_HIGHLIGHT_STYLE = `
  font-size: 22px;
  font-weight: 700;
  color: #fd7e14;
  margin: 0 0 4px 0;
`;

const ALERT_BOX_STYLE = `
  background-color: #fff3e0;
  border: 1px solid #fd7e14;
  border-radius: 6px;
  padding: 16px 20px;
  margin: 0 0 24px 0;
`;

const ALERT_TEXT_STYLE = `
  font-size: 13px;
  color: #7c4210;
  font-weight: 500;
  margin: 0;
`;

const SUCCESS_BOX_STYLE = `
  background-color: #f0fdf4;
  border: 1px solid #16a34a;
  border-radius: 6px;
  padding: 16px 20px;
  margin: 0 0 24px 0;
`;

const SUCCESS_TEXT_STYLE = `
  font-size: 13px;
  color: #15803d;
  font-weight: 500;
  margin: 0;
`;

const FOOTER_STYLE = `
  background-color: #0f0f1a;
  padding: 20px 32px;
  text-align: center;
`;

const FOOTER_TEXT_STYLE = `
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  margin: 0 0 4px 0;
  line-height: 1.5;
`;

const FOOTER_ORANGE_STYLE = `
  font-size: 11px;
  color: #fd7e14;
  margin: 0;
  font-weight: 600;
`;

function wrapTemplate(headerContent: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${BASE_STYLES}</style>
</head>
<body style="${BODY_STYLE}">
  <div style="${CONTAINER_STYLE}">
    <div style="${HEADER_STYLE}">
      <p style="${HEADER_TAGLINE_STYLE}">DESIGN | DEVELOPMENT | DIGITAL GROWTH</p>
      <p style="${HEADER_COMPANY_STYLE}">${headerContent}</p>
    </div>
    <div style="${CONTENT_STYLE}">
      ${bodyContent}
    </div>
    <div style="${FOOTER_STYLE}">
      <p style="${FOOTER_TEXT_STYLE}">WODO Digital Private Limited</p>
      <p style="${FOOTER_TEXT_STYLE}">#1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore - 560091</p>
      <p style="${FOOTER_TEXT_STYLE}">GSTIN: 29AADCW8591N1ZA | CIN: U72900KA2021PTC153659</p>
      <p style="${FOOTER_ORANGE_STYLE}">accounts@wodo.digital | +91 63621 80633</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Template 1: Invoice Sent ─────────────────────────────────────────────────

export function invoiceSentTemplate(data: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  currency: string;
}): string {
  const { clientName, invoiceNumber, amount, dueDate } = data;

  const body = `
    <h2 style="${GREETING_STYLE}">Dear ${clientName},</h2>
    <p style="${BODY_TEXT_STYLE}">
      Please find attached invoice <strong>${invoiceNumber}</strong> from WODO Digital Private Limited.
      Kindly review the invoice and process payment by the due date mentioned below.
    </p>
    <div style="${INFO_BOX_STYLE}">
      <div style="margin-bottom: 12px;">
        <p style="font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Invoice Amount</p>
        <p style="${AMOUNT_HIGHLIGHT_STYLE}">${amount}</p>
      </div>
      <div style="${INFO_ROW_STYLE}">
        <span style="${INFO_LABEL_STYLE}">Invoice No.</span>
        <span style="${INFO_VALUE_STYLE}">${invoiceNumber}</span>
      </div>
      <div style="${INFO_ROW_STYLE}">
        <span style="${INFO_LABEL_STYLE}">Due Date</span>
        <span style="${INFO_VALUE_STYLE}">${dueDate}</span>
      </div>
    </div>
    <p style="${BODY_TEXT_STYLE}">
      For payment, please use the bank details provided in the attached invoice PDF.
      If you have any questions, reply to this email or contact us at <strong>accounts@wodo.digital</strong>.
    </p>
    <p style="${BODY_TEXT_STYLE}">Thank you for your continued business.</p>
    <p style="${BODY_TEXT_STYLE}">
      Warm regards,<br/>
      <strong>Shyam Singh Bhati</strong><br/>
      CEO, WODO Digital Private Limited
    </p>
  `;

  return wrapTemplate(`Invoice ${invoiceNumber}`, body);
}

// ─── Template 2: Payment Reminder ────────────────────────────────────────────

export function paymentReminderTemplate(data: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  daysOverdue: number;
}): string {
  const { clientName, invoiceNumber, amount, dueDate, daysOverdue } = data;

  const isOverdue = daysOverdue > 0;
  const subject = isOverdue
    ? `Payment overdue by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}`
    : `Payment due in ${Math.abs(daysOverdue)} day${Math.abs(daysOverdue) !== 1 ? "s" : ""}`;

  const body = `
    <h2 style="${GREETING_STYLE}">Dear ${clientName},</h2>
    <p style="${BODY_TEXT_STYLE}">
      This is a ${isOverdue ? "gentle but important" : "friendly"} reminder regarding
      invoice <strong>${invoiceNumber}</strong> which ${isOverdue ? `was due on ${dueDate}` : `is due on ${dueDate}`}.
    </p>
    ${
      isOverdue
        ? `<div style="${ALERT_BOX_STYLE}">
            <p style="${ALERT_TEXT_STYLE}">
              Payment is <strong>${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue</strong>.
              Please process payment at your earliest convenience to avoid any service disruptions.
            </p>
          </div>`
        : ""
    }
    <div style="${INFO_BOX_STYLE}">
      <div style="margin-bottom: 12px;">
        <p style="font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Amount Due</p>
        <p style="${AMOUNT_HIGHLIGHT_STYLE}">${amount}</p>
      </div>
      <div style="${INFO_ROW_STYLE}">
        <span style="${INFO_LABEL_STYLE}">Invoice No.</span>
        <span style="${INFO_VALUE_STYLE}">${invoiceNumber}</span>
      </div>
      <div style="${INFO_ROW_STYLE}">
        <span style="${INFO_LABEL_STYLE}">Due Date</span>
        <span style="${INFO_VALUE_STYLE}">${dueDate}</span>
      </div>
    </div>
    <p style="${BODY_TEXT_STYLE}">
      To make payment, please use the bank details provided in the original invoice.
      Once payment is made, kindly share the transaction reference to <strong>accounts@wodo.digital</strong>.
    </p>
    <p style="${BODY_TEXT_STYLE}">
      Warm regards,<br/>
      <strong>Shyam Singh Bhati</strong><br/>
      CEO, WODO Digital Private Limited
    </p>
  `;

  return wrapTemplate(`${subject} - Invoice ${invoiceNumber}`, body);
}

// ─── Template 3: Payment Receipt ─────────────────────────────────────────────

export function paymentReceiptTemplate(data: {
  clientName: string;
  invoiceNumber: string;
  amountReceived: string;
  paymentDate: string;
}): string {
  const { clientName, invoiceNumber, amountReceived, paymentDate } = data;

  const body = `
    <h2 style="${GREETING_STYLE}">Dear ${clientName},</h2>
    <p style="${BODY_TEXT_STYLE}">
      We have successfully received your payment for invoice <strong>${invoiceNumber}</strong>.
      Thank you for your prompt payment!
    </p>
    <div style="${SUCCESS_BOX_STYLE}">
      <p style="${SUCCESS_TEXT_STYLE}">Payment received and recorded successfully.</p>
    </div>
    <div style="${INFO_BOX_STYLE}">
      <div style="margin-bottom: 12px;">
        <p style="font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Amount Received</p>
        <p style="${AMOUNT_HIGHLIGHT_STYLE}">${amountReceived}</p>
      </div>
      <div style="${INFO_ROW_STYLE}">
        <span style="${INFO_LABEL_STYLE}">Invoice No.</span>
        <span style="${INFO_VALUE_STYLE}">${invoiceNumber}</span>
      </div>
      <div style="${INFO_ROW_STYLE}">
        <span style="${INFO_LABEL_STYLE}">Payment Date</span>
        <span style="${INFO_VALUE_STYLE}">${paymentDate}</span>
      </div>
    </div>
    <p style="${BODY_TEXT_STYLE}">
      We appreciate your trust in WODO Digital. Our team will continue to deliver exceptional results for your business.
      If you have any questions, please reach out to <strong>accounts@wodo.digital</strong>.
    </p>
    <p style="${BODY_TEXT_STYLE}">
      Warm regards,<br/>
      <strong>Shyam Singh Bhati</strong><br/>
      CEO, WODO Digital Private Limited
    </p>
  `;

  return wrapTemplate("Payment Received", body);
}

// ─── Template 4: Investor Report ─────────────────────────────────────────────

export function investorReportTemplate(data: {
  month: string;
  year: number;
  revenue: string;
  netProfit: string;
}): string {
  const { month, year, revenue, netProfit } = data;
  const monthYear = `${month} ${year}`;

  const body = `
    <h2 style="${GREETING_STYLE}">Dear Investor,</h2>
    <p style="${BODY_TEXT_STYLE}">
      Please find attached the monthly performance report for <strong>${monthYear}</strong>.
      The full report with detailed metrics is included as a PDF attachment.
    </p>
    <div style="${INFO_BOX_STYLE}">
      <p style="font-size: 11px; color: #888888; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; font-weight: 600;">
        ${monthYear} Highlights
      </p>
      <div style="${INFO_ROW_STYLE}">
        <span style="${INFO_LABEL_STYLE}">Total Revenue</span>
        <span style="${INFO_VALUE_STYLE}" style="color: #16a34a;">${revenue}</span>
      </div>
      <div style="${INFO_ROW_STYLE}">
        <span style="${INFO_LABEL_STYLE}">Net Profit</span>
        <span style="${INFO_VALUE_STYLE}">${netProfit}</span>
      </div>
    </div>
    <p style="${BODY_TEXT_STYLE}">
      The attached PDF contains the complete breakdown including client summary,
      project metrics, expense analysis, outstanding receivables, and MRR trends.
    </p>
    <p style="${BODY_TEXT_STYLE}">
      This report is <strong>confidential</strong> and intended for internal and investor use only.
      Please do not forward or distribute without authorization.
    </p>
    <p style="${BODY_TEXT_STYLE}">
      Warm regards,<br/>
      <strong>Shyam Singh Bhati</strong><br/>
      CEO, WODO Digital Private Limited<br/>
      accounts@wodo.digital
    </p>
  `;

  return wrapTemplate(`Monthly Report: ${monthYear}`, body);
}
