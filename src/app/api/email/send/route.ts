import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import {
  invoiceSentTemplate,
  paymentReminderTemplate,
  paymentReceiptTemplate,
  investorReportTemplate,
} from "@/lib/email/templates";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EmailTemplate = "invoice" | "reminder" | "followup";

// Maps the email `type` field to a canonical email_template value for activity logging
const TYPE_TO_TEMPLATE: Record<string, EmailTemplate> = {
  invoice_sent: "invoice",
  payment_reminder: "reminder",
  payment_receipt: "followup",
};

// ---------------------------------------------------------------------------
// POST /api/email/send
// Body: {
//   type: string,          // email template type
//   to: string | string[], // primary recipients
//   cc?: string[],         // optional CC recipients
//   invoiceId?: string,    // if present, activity is logged against this invoice
//   ...template-specific data
// }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Auth check
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract common fields - cc and invoiceId are optional
  const { type, to, cc, invoiceId, ...data } = body;

  if (!type || typeof type !== "string") {
    return NextResponse.json({ error: "Missing email type" }, { status: 400 });
  }

  if (!to) {
    return NextResponse.json({ error: "Missing recipient(s)" }, { status: 400 });
  }

  const recipients = Array.isArray(to) ? (to as string[]) : [String(to)];

  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients specified" }, { status: 400 });
  }

  // Validate CC if provided
  const ccList: string[] = Array.isArray(cc)
    ? (cc as string[]).filter((addr) => typeof addr === "string" && addr.length > 0)
    : [];

  // 3. Build subject + html based on type
  let subject: string;
  let html: string;

  try {
    switch (type) {
      case "invoice_sent": {
        const d = data as {
          clientName: string;
          invoiceNumber: string;
          amount: string;
          dueDate: string;
          currency: string;
          subject?: string;
          body?: string;
        };
        // Allow caller to override default subject/body
        subject = d.subject ?? `Invoice ${d.invoiceNumber} from WODO Digital`;
        html = d.body ?? invoiceSentTemplate(d);
        break;
      }

      case "payment_reminder": {
        const d = data as {
          clientName: string;
          invoiceNumber: string;
          amount: string;
          dueDate: string;
          daysOverdue: number;
          subject?: string;
          body?: string;
        };
        const overdue = Number(d.daysOverdue ?? 0);
        subject = d.subject ?? (
          overdue > 0
            ? `Overdue: Invoice ${d.invoiceNumber} - Payment pending (${overdue} day${overdue !== 1 ? "s" : ""} overdue)`
            : `Reminder: Invoice ${d.invoiceNumber} due on ${d.dueDate}`
        );
        html = d.body ?? paymentReminderTemplate({ ...d, daysOverdue: overdue });
        break;
      }

      case "payment_receipt": {
        const d = data as {
          clientName: string;
          invoiceNumber: string;
          amountReceived: string;
          paymentDate: string;
          subject?: string;
          body?: string;
        };
        subject = d.subject ?? `Payment received - Invoice ${d.invoiceNumber}`;
        html = d.body ?? paymentReceiptTemplate(d);
        break;
      }

      case "investor_report": {
        const d = data as {
          month: string;
          year: number;
          revenue: string;
          netProfit: string;
          subject?: string;
          body?: string;
        };
        subject = d.subject ?? `WODO Digital - Monthly Report: ${d.month} ${d.year}`;
        html = d.body ?? investorReportTemplate(d);
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Template error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // 4. Send email (pass CC if provided)
  try {
    await sendEmail({
      to: recipients,
      cc: ccList.length > 0 ? ccList : undefined,
      subject,
      html,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[email/send] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // 5. Persist email activity for invoice-related emails (fire-and-forget, non-blocking)
  //    We do not fail the request if activity logging fails.
  const emailTemplate: EmailTemplate | undefined = TYPE_TO_TEMPLATE[type];

  if (
    invoiceId &&
    typeof invoiceId === "string" &&
    emailTemplate !== undefined
  ) {
    const allRecipients = [...recipients, ...ccList];

    const activityRows = allRecipients.map((addr) => ({
      invoice_id: invoiceId,
      action_type: "sent" as const,
      email_recipient: addr.toLowerCase().trim(),
      email_template: emailTemplate,
      created_by: user.id,
    }));

    // eslint-disable-next-line
    const db = supabase as any;
    const { error: activityErr } = await db
      .from("invoice_email_activity")
      .insert(activityRows);

    if (activityErr) {
      // Log but do not surface to caller - the email was already sent successfully
      console.error(
        "[email/send] Failed to log email activity:",
        activityErr.message
      );
    }
  }

  return NextResponse.json({ success: true });
}
