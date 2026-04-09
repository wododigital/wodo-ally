import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, isRoleAllowed } from "@/lib/auth/check-role";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionType = "sent" | "bounced" | "opened";
type EmailTemplate = "invoice" | "reminder" | "followup";

const VALID_ACTION_TYPES: ActionType[] = ["sent", "bounced", "opened"];
const VALID_EMAIL_TEMPLATES: EmailTemplate[] = ["invoice", "reminder", "followup"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidActionType(value: unknown): value is ActionType {
  return typeof value === "string" && VALID_ACTION_TYPES.includes(value as ActionType);
}

function isValidEmailTemplate(value: unknown): value is EmailTemplate {
  return typeof value === "string" && VALID_EMAIL_TEMPLATES.includes(value as EmailTemplate);
}

function isValidEmail(value: unknown): boolean {
  return typeof value === "string" && EMAIL_REGEX.test(value);
}

// ---------------------------------------------------------------------------
// POST /api/invoices/[id]/email-activity
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1b. Role check - only admin, manager, and accountant can manage email activity
  const role = await getUserRole(supabase, user.id);
  if (!isRoleAllowed(role, ["admin", "manager", "accountant"])) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // 2. Extract and validate invoiceId from params
  const { id: invoiceId } = await params;
  if (!invoiceId || typeof invoiceId !== "string") {
    return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
  }

  // 3. Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action_type, email_recipient, email_template } = body;

  // 4. Validate fields
  if (!isValidActionType(action_type)) {
    return NextResponse.json(
      { error: `action_type must be one of: ${VALID_ACTION_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!isValidEmail(email_recipient)) {
    return NextResponse.json(
      { error: "email_recipient must be a valid email address" },
      { status: 400 }
    );
  }

  if (!isValidEmailTemplate(email_template)) {
    return NextResponse.json(
      { error: `email_template must be one of: ${VALID_EMAIL_TEMPLATES.join(", ")}` },
      { status: 400 }
    );
  }

  // 5. Verify the invoice exists (prevents orphan activity rows from reaching the DB)
  const { data: invoice, error: invoiceErr } = await supabase
    .from("invoices")
    .select("id")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceErr) {
    console.error("[email-activity POST] Invoice lookup error:", invoiceErr.message);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // 6. Insert activity record
  // eslint-disable-next-line
  const db = supabase as any;
  const { data: activity, error: insertErr } = await db
    .from("invoice_email_activity")
    .insert({
      invoice_id: invoiceId,
      action_type,
      email_recipient: (email_recipient as string).toLowerCase().trim(),
      email_template,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[email-activity POST] Insert error:", insertErr.message);
    return NextResponse.json({ error: "Failed to record email activity" }, { status: 500 });
  }

  return NextResponse.json(
    {
      success: true,
      activity_id: activity.id,
      message: "Email activity recorded",
    },
    { status: 201 }
  );
}

// ---------------------------------------------------------------------------
// GET /api/invoices/[id]/email-activity
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1b. Role check - only admin, manager, and accountant can view email activity
  const role = await getUserRole(supabase, user.id);
  if (!isRoleAllowed(role, ["admin", "manager", "accountant"])) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // 2. Extract invoiceId
  const { id: invoiceId } = await params;
  if (!invoiceId || typeof invoiceId !== "string") {
    return NextResponse.json({ error: "Missing invoice ID" }, { status: 400 });
  }

  // 3. Fetch activity records ordered by sent_at DESC
  // eslint-disable-next-line
  const db = supabase as any;
  const { data: activities, error: fetchErr } = await db
    .from("invoice_email_activity")
    .select(
      "id, action_type, email_recipient, email_template, sent_at, resent_count, created_by"
    )
    .eq("invoice_id", invoiceId)
    .order("sent_at", { ascending: false });

  if (fetchErr) {
    console.error("[email-activity GET] Fetch error:", fetchErr.message);
    return NextResponse.json({ error: "Failed to fetch email activity" }, { status: 500 });
  }

  return NextResponse.json({
    invoiceId,
    activities: activities ?? [],
  });
}
