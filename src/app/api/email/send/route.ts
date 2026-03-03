import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import {
  invoiceSentTemplate,
  paymentReminderTemplate,
  paymentReceiptTemplate,
  investorReportTemplate,
} from "@/lib/email/templates";

// POST /api/email/send
// Body: { type, to, ...template-specific data }
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

  const { type, to, ...data } = body;

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
        };
        subject = `Invoice ${d.invoiceNumber} from WODO Digital`;
        html = invoiceSentTemplate(d);
        break;
      }

      case "payment_reminder": {
        const d = data as {
          clientName: string;
          invoiceNumber: string;
          amount: string;
          dueDate: string;
          daysOverdue: number;
        };
        const overdue = Number(d.daysOverdue ?? 0);
        subject = overdue > 0
          ? `Overdue: Invoice ${d.invoiceNumber} - Payment pending (${overdue} day${overdue !== 1 ? "s" : ""} overdue)`
          : `Reminder: Invoice ${d.invoiceNumber} due on ${d.dueDate}`;
        html = paymentReminderTemplate({ ...d, daysOverdue: overdue });
        break;
      }

      case "payment_receipt": {
        const d = data as {
          clientName: string;
          invoiceNumber: string;
          amountReceived: string;
          paymentDate: string;
        };
        subject = `Payment received - Invoice ${d.invoiceNumber}`;
        html = paymentReceiptTemplate(d);
        break;
      }

      case "investor_report": {
        const d = data as {
          month: string;
          year: number;
          revenue: string;
          netProfit: string;
        };
        subject = `WODO Digital - Monthly Report: ${d.month} ${d.year}`;
        html = investorReportTemplate(d);
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

  // 4. Send email
  try {
    await sendEmail({ to: recipients, subject, html });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[email/send] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
