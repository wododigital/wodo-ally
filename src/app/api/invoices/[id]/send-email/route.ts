import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/client";
import { getUserRole, isRoleAllowed } from "@/lib/auth/check-role";
import {
  invoiceSentTemplate,
  paymentReminderTemplate,
} from "@/lib/email/templates";

type EmailType = "invoice" | "reminder" | "followup";

// Maps our local type to the email_template enum used by invoice_email_activity
const TYPE_TO_TEMPLATE: Record<EmailType, string> = {
  invoice: "invoice",
  reminder: "reminder",
  followup: "followup",
};

interface SendEmailRequest {
  type: EmailType;
  to: string;
  cc: string[];
  subject: string;
  body: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check - only admin, manager, and accountant can send invoice emails
    const role = await getUserRole(supabase, user.id);
    if (!isRoleAllowed(role, ["admin", "manager", "accountant"])) {
      return NextResponse.json({ error: "Forbidden - insufficient permissions" }, { status: 403 });
    }

    const invoiceId = params.id;
    const payload: SendEmailRequest = await request.json();

    // Validate input
    if (!payload.to || !payload.subject) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject" },
        { status: 400 },
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.to)) {
      return NextResponse.json(
        { error: "Invalid recipient email format" },
        { status: 400 },
      );
    }

    // Verify invoice exists
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, invoice_number, invoice_type, total_amount, currency, due_date, client_id")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Fetch client for template data
    const { data: client } = await supabase
      .from("clients")
      .select("company_name")
      .eq("id", invoice.client_id)
      .single();

    // Build email HTML - use caller body if provided, otherwise use template
    let html: string;
    if (payload.body && payload.body.trim()) {
      html = payload.body;
    } else if (payload.type === "reminder") {
      html = paymentReminderTemplate({
        clientName: client?.company_name ?? "Client",
        invoiceNumber: invoice.invoice_number ?? "DRAFT",
        amount: String(invoice.total_amount ?? 0),
        dueDate: invoice.due_date ?? "",
        daysOverdue: 0,
      });
    } else {
      html = invoiceSentTemplate({
        clientName: client?.company_name ?? "Client",
        invoiceNumber: invoice.invoice_number ?? "DRAFT",
        amount: String(invoice.total_amount ?? 0),
        dueDate: invoice.due_date ?? "",
        currency: invoice.currency ?? "INR",
      });
    }

    // Build recipients
    const recipients = [payload.to];
    const ccList = (payload.cc ?? []).filter(
      (addr) => typeof addr === "string" && addr.trim().length > 0,
    );

    // Send the email
    await sendEmail({
      to: recipients,
      cc: ccList.length > 0 ? ccList : undefined,
      subject: payload.subject,
      html,
    });

    // Log email activity (fire-and-forget)
    const allRecipients = [...recipients, ...ccList];
    const activityRows = allRecipients.map((addr) => ({
      invoice_id: invoiceId,
      action_type: "sent" as const,
      email_recipient: addr.toLowerCase().trim(),
      email_template: TYPE_TO_TEMPLATE[payload.type] ?? "invoice",
      created_by: user.id,
    }));

    // eslint-disable-next-line
    const db = supabase as any;
    const { error: activityErr } = await db
      .from("invoice_email_activity")
      .insert(activityRows);

    if (activityErr) {
      console.error("[send-email] Failed to log activity:", activityErr.message);
    }

    // Update invoice status to "sent" if currently draft
    const { data: currentInvoice } = await supabase
      .from("invoices")
      .select("status")
      .eq("id", invoiceId)
      .single();

    if (currentInvoice?.status === "draft") {
      await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", invoiceId);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email sent successfully",
        invoiceId,
        recipient: payload.to,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    console.error("[send-email] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
