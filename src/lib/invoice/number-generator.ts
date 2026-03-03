import { createClient } from "@/lib/supabase/client";

/**
 * Generate a proforma reference number in the format PF-{YYYYMMDD}-{NNN}.
 * No DB call required - uses timestamp suffix for uniqueness within a day.
 */
export function generateProformaRef(): string {
  const today = new Date();
  const date = today.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(Date.now()).slice(-3);
  return `PF-${date}-${suffix}`;
}

/**
 * Call the Supabase RPC to get the next sequential invoice number.
 * For gst type returns e.g. "G00107", for non_gst returns e.g. "NG00202".
 * This should only be called at finalization time, never on draft creation.
 */
export async function getNextInvoiceNumber(
  supabase: ReturnType<typeof createClient>,
  type: "gst" | "non_gst"
): Promise<string> {
  const { data, error } = await supabase.rpc("get_next_invoice_number", { seq_type: type });
  if (error) throw new Error(`Failed to get invoice number: ${error.message}`);
  return data as string;
}
