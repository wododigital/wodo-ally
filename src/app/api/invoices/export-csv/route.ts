import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvoiceType = "gst" | "international" | "non_gst" | "proforma";

const VALID_INVOICE_TYPES: InvoiceType[] = ["gst", "international", "non_gst", "proforma"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Row shape returned by the Supabase query
interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  invoice_type: string;
  invoice_date: string;
  due_date: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  total_received: number;
  balance_due: number;
  currency: string;
  clients: { company_name: string } | null;
  invoice_line_items: Array<{
    services: { hsn_code: string | null } | null;
  }> | null;
}

// ---------------------------------------------------------------------------
// CSV builder utilities
// ---------------------------------------------------------------------------

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in double quotes if the value contains commas, quotes, or newlines
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(fields: Array<string | number | null | undefined>): string {
  return fields.map(escapeCsvField).join(",");
}

// Deduplicate HSN codes from all line items and join them
function extractHsnCodes(
  lineItems: InvoiceRow["invoice_line_items"]
): string {
  if (!lineItems || lineItems.length === 0) return "";
  const codes = lineItems
    .map((li) => li.services?.hsn_code ?? "")
    .filter(Boolean);
  return Array.from(new Set(codes)).join("; ");
}

// ---------------------------------------------------------------------------
// GET /api/invoices/export-csv
// Query params:
//   invoiceType?: 'gst' | 'international' | 'non_gst' | 'proforma'
//   dateFrom?:    YYYY-MM-DD
//   dateTo?:      YYYY-MM-DD
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse query params
  const searchParams = req.nextUrl.searchParams;
  const invoiceType = searchParams.get("invoiceType");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  // Validate invoiceType if provided
  if (invoiceType !== null && !VALID_INVOICE_TYPES.includes(invoiceType as InvoiceType)) {
    return NextResponse.json(
      { error: `invoiceType must be one of: ${VALID_INVOICE_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate date formats if provided
  if (dateFrom !== null && !DATE_REGEX.test(dateFrom)) {
    return NextResponse.json(
      { error: "dateFrom must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  if (dateTo !== null && !DATE_REGEX.test(dateTo)) {
    return NextResponse.json(
      { error: "dateTo must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  if (dateFrom && dateTo && dateFrom > dateTo) {
    return NextResponse.json(
      { error: "dateFrom must not be after dateTo" },
      { status: 400 }
    );
  }

  // 3. Build and execute query
  // Supabase client handles parameterization - no manual string interpolation
  let query = supabase
    .from("invoices")
    .select(
      `
      id,
      invoice_number,
      invoice_type,
      invoice_date,
      due_date,
      status,
      subtotal,
      tax_amount,
      total_amount,
      total_received,
      balance_due,
      currency,
      clients ( company_name ),
      invoice_line_items (
        services ( hsn_code )
      )
      `
    )
    // Exclude draft and cancelled - active/billed invoices only
    .not("status", "eq", "draft")
    .not("status", "eq", "cancelled")
    .order("invoice_date", { ascending: false });

  if (invoiceType) {
    query = query.eq("invoice_type", invoiceType as InvoiceType);
  }

  if (dateFrom) {
    query = query.gte("invoice_date", dateFrom);
  }

  if (dateTo) {
    query = query.lte("invoice_date", dateTo);
  }

  const { data: invoices, error: fetchErr } = await query;

  if (fetchErr) {
    console.error("[export-csv GET] Fetch error:", fetchErr.message);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }

  if (!invoices || invoices.length === 0) {
    // Return an empty CSV with headers rather than an error
    const emptyHeader = buildCsvRow([
      "Invoice #", "Client", "Type", "Invoice Date", "Due Date",
      "Status", "Subtotal", "Tax", "Total", "Paid", "Balance", "Currency", "HSN Code",
    ]);
    return new NextResponse(emptyHeader + "\n", {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="invoices-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // 4. Build CSV content
  const rows: string[] = [];

  // Header row
  rows.push(
    buildCsvRow([
      "Invoice #", "Client", "Type", "Invoice Date", "Due Date",
      "Status", "Subtotal", "Tax", "Total", "Paid", "Balance", "Currency", "HSN Code",
    ])
  );

  // Data rows
  for (const inv of invoices as unknown as InvoiceRow[]) {
    const clientName = inv.clients?.company_name ?? "";
    const hsnCode = extractHsnCodes(inv.invoice_line_items);

    rows.push(
      buildCsvRow([
        inv.invoice_number ?? "",
        clientName,
        inv.invoice_type,
        inv.invoice_date,
        inv.due_date ?? "",
        inv.status,
        inv.subtotal,
        inv.tax_amount,
        inv.total_amount,
        inv.total_received,
        inv.balance_due,
        inv.currency,
        hsnCode,
      ])
    );
  }

  const csvBody = rows.join("\n");
  const exportDate = new Date().toISOString().slice(0, 10);

  return new NextResponse(csvBody, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices-export-${exportDate}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
