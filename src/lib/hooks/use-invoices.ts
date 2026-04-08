"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getNextInvoiceNumber, generateProformaRef } from "@/lib/invoice/number-generator";
import type { Database } from "@/types/database";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];
type InvoiceStatus = Database["public"]["Tables"]["invoices"]["Row"]["status"];
type LineItemRow = Database["public"]["Tables"]["invoice_line_items"]["Row"];
type LineItemInsert = Database["public"]["Tables"]["invoice_line_items"]["Insert"];
type PaymentRow = Database["public"]["Tables"]["invoice_payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["invoice_payments"]["Insert"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

// ─── Enriched types ───────────────────────────────────────────────────────────

export type InvoiceListItem = InvoiceRow & {
  client_name: string;
  client_currency: string;
};

export type InvoiceWithDetails = InvoiceRow & {
  line_items: LineItemRow[];
  client: ClientRow | null;
};

export interface CreateInvoicePayload {
  invoice: InvoiceInsert;
  lineItems: Omit<LineItemInsert, "invoice_id">[];
}

export interface RecordPaymentPayload {
  payment: PaymentInsert;
}

// ─── useInvoices ──────────────────────────────────────────────────────────────

export function useInvoices(filters?: { status?: string; clientId?: string }) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: async (): Promise<InvoiceListItem[]> => {
      const supabase = createClient();

      // Query invoices and clients separately to avoid Supabase join type issues
      let invoiceQuery = supabase
        .from("invoices")
        .select(
          `id, invoice_number, proforma_ref, invoice_type, client_id, currency,
           subtotal, tax_rate, tax_amount, total_amount, balance_due, total_received,
           project_ids, total_amount_inr, sent_at, viewed_at, paid_at, cancelled_at,
           total_tds_deducted, total_other_deductions,
           invoice_date, due_date, billing_period_start, billing_period_end,
           status, notes, internal_notes, pdf_url, created_at, updated_at, created_by`
        )
        .order("invoice_date", { ascending: false });

      if (filters?.status) {
        invoiceQuery = invoiceQuery.eq("status", filters.status as InvoiceStatus);
      }
      if (filters?.clientId) {
        invoiceQuery = invoiceQuery.eq("client_id", filters.clientId);
      }

      const { data: invoiceData, error: invoiceError } = await invoiceQuery;
      if (invoiceError) throw new Error(invoiceError.message);

      const invoices = invoiceData ?? [];
      if (invoices.length === 0) return [];

      // Fetch client names for all unique client IDs
      const clientIds = Array.from(new Set(invoices.map((i) => i.client_id)));
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name, currency")
        .in("id", clientIds);

      if (clientError) throw new Error(clientError.message);

      const clientMap = new Map(
        (clientData ?? []).map((c) => [c.id, c])
      );

      // Auto-detect overdue invoices: mark "sent" invoices past due_date as "overdue"
      const today = new Date().toISOString().split("T")[0];
      const overdueIds = invoices
        .filter(
          (inv) =>
            inv.status === "sent" &&
            inv.due_date &&
            inv.due_date < today
        )
        .map((inv) => inv.id);

      if (overdueIds.length > 0) {
        // Fire-and-forget: update status to overdue in the background
        supabase
          .from("invoices")
          .update({ status: "overdue" as InvoiceStatus })
          .in("id", overdueIds)
          .then();
      }

      return invoices.map((row) => {
        const client = clientMap.get(row.client_id);
        // Also reflect overdue in the returned data immediately
        const effectiveStatus =
          row.status === "sent" && row.due_date && row.due_date < today
            ? "overdue"
            : row.status;
        return {
          ...row,
          status: effectiveStatus,
          client_name: client?.company_name ?? "Unknown",
          client_currency: client?.currency ?? "INR",
        } as InvoiceListItem;
      });
    },
  });
}

// ─── useInvoice ───────────────────────────────────────────────────────────────

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async (): Promise<InvoiceWithDetails> => {
      const supabase = createClient();

      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (invoiceError) throw new Error(invoiceError.message);

      // Fetch line items
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", id)
        .order("sort_order", { ascending: true });

      if (lineItemsError) throw new Error(lineItemsError.message);

      // Fetch client
      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", invoiceData.client_id)
        .single();

      return {
        ...invoiceData,
        line_items: lineItemsData ?? [],
        client: clientData ?? null,
      };
    },
    enabled: !!id,
  });
}

// ─── useCreateInvoice ─────────────────────────────────────────────────────────

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateInvoicePayload): Promise<InvoiceRow> => {
      const supabase = createClient();

      // Insert invoice first - no number assigned on draft
      const { data: newInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({ ...payload.invoice, status: payload.invoice.status ?? "draft" })
        .select()
        .single();

      if (invoiceError) throw new Error(invoiceError.message);

      // Insert line items
      if (payload.lineItems.length > 0) {
        const items = payload.lineItems.map((item, idx) => ({
          ...item,
          invoice_id: newInvoice.id,
          sort_order: idx,
        }));
        const { error: itemsError } = await supabase
          .from("invoice_line_items")
          .insert(items);

        if (itemsError) throw new Error(itemsError.message);
      }

      return newInvoice;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });
}

// ─── useUpdateInvoice ─────────────────────────────────────────────────────────

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      lineItems,
    }: {
      id: string;
      data: InvoiceUpdate;
      lineItems?: Array<{ description: string; amount: number; quantity: number; service_id?: string | null; sort_order?: number }>;
    }): Promise<InvoiceRow> => {
      const supabase = createClient();
      const { data: updated, error } = await supabase
        .from("invoices")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // If line items provided, replace them
      if (lineItems && lineItems.length > 0) {
        // Delete existing line items
        const { error: deleteError } = await supabase
          .from("invoice_line_items")
          .delete()
          .eq("invoice_id", id);

        if (deleteError) throw new Error(deleteError.message);

        // Insert new line items
        const { error: insertError } = await supabase
          .from("invoice_line_items")
          .insert(
            lineItems.map((item, idx) => ({
              invoice_id: id,
              description: item.description,
              amount: item.amount,
              quantity: item.quantity,
              service_id: item.service_id || null,
              sort_order: item.sort_order ?? idx,
            }))
          );

        if (insertError) throw new Error(insertError.message);
      }

      return updated;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["invoice", data.id] }),
      ]);
      toast.success("Invoice updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });
}

// ─── useDeleteInvoice ─────────────────────────────────────────────────────────

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();

      // Safety: only allow deleting drafts
      const { data: inv, error: fetchError } = await supabase
        .from("invoices")
        .select("status")
        .eq("id", id)
        .single();

      if (fetchError) throw new Error(fetchError.message);
      if (inv.status !== "draft") {
        throw new Error("Only draft invoices can be deleted");
      }

      // Delete line items first (FK constraint)
      await supabase.from("invoice_line_items").delete().eq("invoice_id", id);

      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });
}

// ─── useFinalizeInvoice ───────────────────────────────────────────────────────

export function useFinalizeInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
    }: {
      id: string;
      sendAfterFinalize?: boolean;
    }): Promise<InvoiceRow> => {
      const supabase = createClient();

      // Fetch current invoice
      const { data: inv, error: fetchError } = await supabase
        .from("invoices")
        .select("invoice_type, status, invoice_number, proforma_ref")
        .eq("id", id)
        .single();

      if (fetchError) throw new Error(fetchError.message);
      if (inv.status !== "draft") {
        throw new Error("Only draft invoices can be finalized");
      }

      let invoiceNumber: string | null = inv.invoice_number;
      let proformaRef: string | null = inv.proforma_ref;

      // Assign number based on type
      if (inv.invoice_type === "proforma") {
        if (!proformaRef) {
          proformaRef = generateProformaRef();
        }
      } else if (inv.invoice_type === "gst") {
        invoiceNumber = await getNextInvoiceNumber(supabase, "gst");
      } else if (inv.invoice_type === "non_gst") {
        invoiceNumber = await getNextInvoiceNumber(supabase, "non_gst");
      } else {
        // international - uses gst sequence
        invoiceNumber = await getNextInvoiceNumber(supabase, "gst");
      }

      const now = new Date().toISOString();

      const { data: updated, error: updateError } = await supabase
        .from("invoices")
        .update({
          invoice_number: invoiceNumber,
          proforma_ref: proformaRef,
          status: "sent",
          sent_at: now,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);
      return updated;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["invoice", data.id] }),
      ]);
      toast.success(
        data.invoice_type === "proforma"
          ? `Pro forma ${data.proforma_ref} finalized`
          : `Invoice ${data.invoice_number} finalized and sent`
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to finalize invoice: ${error.message}`);
    },
  });
}

// ─── useGenerateRetainerInvoices ──────────────────────────────────────────────

export function useGenerateRetainerInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ created: number }> => {
      const supabase = createClient();

      const now = new Date();
      const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const monthStart = `${billingMonth}-01`;
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);

      // Find active retainer projects
      const { data: projects, error: projError } = await supabase
        .from("projects")
        .select("id, client_id, name, retainer_amount, retainer_currency")
        .eq("engagement_type", "retainer")
        .in("status", ["active_execution", "maintenance"])
        .not("retainer_amount", "is", null);

      if (projError) throw new Error(projError.message);
      if (!projects || projects.length === 0) return { created: 0 };

      // Find which projects already have an invoice this month
      const { data: existingInvoices, error: existingError } = await supabase
        .from("invoices")
        .select("id, project_ids, invoice_date")
        .gte("invoice_date", monthStart)
        .lte("invoice_date", monthEnd)
        .neq("status", "cancelled");

      if (existingError) throw new Error(existingError.message);

      const coveredProjectIds = new Set<string>();
      (existingInvoices ?? []).forEach((inv) => {
        (inv.project_ids ?? []).forEach((pid: string) => coveredProjectIds.add(pid));
      });

      const toCreate = projects.filter((p) => !coveredProjectIds.has(p.id));
      if (toCreate.length === 0) return { created: 0 };

      // Fetch client details
      const clientIds = Array.from(new Set(toCreate.map((p) => p.client_id)));
      const { data: clients, error: clientError } = await supabase
        .from("clients")
        .select("id, client_type, currency, gstin")
        .in("id", clientIds);

      if (clientError) throw new Error(clientError.message);

      const clientMap = new Map(
        (clients ?? []).map((c) => [c.id, c])
      );

      let created = 0;
      for (const project of toCreate) {
        const client = clientMap.get(project.client_id);
        if (!client) continue;

        const invoiceType: "gst" | "non_gst" | "international" =
          client.client_type === "indian_gst"
            ? "gst"
            : client.client_type === "indian_non_gst"
            ? "non_gst"
            : "international";

        const taxRate = invoiceType === "gst" ? 18 : 0;
        const subtotal = Math.round((project.retainer_amount ?? 0) * 100) / 100;
        const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
        const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

        const invoiceInsert: InvoiceInsert = {
          invoice_type: invoiceType,
          client_id: project.client_id,
          project_ids: [project.id],
          currency: project.retainer_currency ?? client.currency ?? "INR",
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          balance_due: totalAmount,
          invoice_date: monthStart,
          billing_period_start: monthStart,
          billing_period_end: monthEnd,
          status: "draft",
        };

        const { data: newInvoice, error: invError } = await supabase
          .from("invoices")
          .insert(invoiceInsert)
          .select()
          .single();

        if (invError) continue;

        await supabase.from("invoice_line_items").insert({
          invoice_id: newInvoice.id,
          description: `${project.name} - ${billingMonth}`,
          amount: subtotal,
          quantity: 1,
          sort_order: 0,
        });

        created++;
      }

      return { created };
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (result.created === 0) {
        toast.info("All retainer invoices for this month are already created");
      } else {
        toast.success(`Generated ${result.created} retainer invoice draft${result.created !== 1 ? "s" : ""}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate retainer invoices: ${error.message}`);
    },
  });
}

// ─── useScheduledInvoices ─────────────────────────────────────────────────────

type ScheduledInvoiceRow = Database["public"]["Tables"]["scheduled_invoices"]["Row"];

export type ScheduledInvoiceEnriched = ScheduledInvoiceRow & {
  client_name: string;
  payment_terms_days: number;
  project_name: string;
  engagement_type: "retainer" | "milestone" | "fixed_price" | "hourly" | null;
  expected_payment_date: string;
  display_amount: string;
};

export function useScheduledInvoices() {
  return useQuery({
    queryKey: ["scheduled-invoices"],
    queryFn: async (): Promise<ScheduledInvoiceEnriched[]> => {
      const supabase = createClient();

      const { data: rows, error } = await supabase
        .from("scheduled_invoices")
        .select("*")
        .in("status", ["pending", "generated"])
        .order("billing_month", { ascending: true });

      if (error) throw new Error(error.message);
      if (!rows || rows.length === 0) return [];

      // Fetch clients
      const clientIds = Array.from(new Set(rows.map((r) => r.client_id)));
      const { data: clients } = await supabase
        .from("clients")
        .select("id, company_name, payment_terms_days, currency")
        .in("id", clientIds);

      // Fetch projects
      const projectIds = Array.from(
        new Set(rows.map((r) => r.project_id).filter(Boolean) as string[])
      );
      const { data: projects } =
        projectIds.length > 0
          ? await supabase
              .from("projects")
              .select("id, name, engagement_type")
              .in("id", projectIds)
          : { data: [] };

      const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));
      const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));

      return rows.map((row) => {
        const client = clientMap.get(row.client_id);
        const project = row.project_id ? projectMap.get(row.project_id) : undefined;
        const terms = client?.payment_terms_days ?? 15;

        // Compute expected payment date
        const base = new Date(row.scheduled_date);
        base.setDate(base.getDate() + terms);
        const expected = base.toISOString().slice(0, 10);

        // Format display amount
        const display =
          row.currency === "INR"
            ? `Rs.${row.amount.toLocaleString("en-IN")}`
            : `${row.currency} ${row.amount.toLocaleString()}`;

        return {
          ...row,
          client_name: client?.company_name ?? "Unknown",
          payment_terms_days: terms,
          project_name: project?.name ?? row.description,
          engagement_type: (project?.engagement_type ?? null) as ScheduledInvoiceEnriched["engagement_type"],
          expected_payment_date: expected,
          display_amount: display,
        };
      });
    },
  });
}

export function useUpdateScheduledInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      generated_invoice_id,
    }: {
      id: string;
      status: "pending" | "generated" | "skipped" | "cancelled";
      generated_invoice_id?: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("scheduled_invoices")
        .update({ status, ...(generated_invoice_id ? { invoice_id: generated_invoice_id } : {}) })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["scheduled-invoices"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update scheduled invoice: ${error.message}`);
    },
  });
}

// ─── useCollectionsInvoices ───────────────────────────────────────────────────

export type CollectionUrgency = "overdue" | "due_soon" | "upcoming";

export type CollectionInvoice = InvoiceListItem & {
  urgency: CollectionUrgency;
  days_label: string;
};

export function useCollectionsInvoices() {
  return useQuery({
    queryKey: ["collections-invoices"],
    queryFn: async (): Promise<CollectionInvoice[]> => {
      const supabase = createClient();

      const { data: invoiceData, error } = await supabase
        .from("invoices")
        .select(
          `id, invoice_number, proforma_ref, invoice_type, client_id, currency,
           subtotal, tax_rate, tax_amount, total_amount, balance_due, total_received,
           project_ids, total_amount_inr, sent_at, viewed_at, paid_at, cancelled_at,
           total_tds_deducted, total_other_deductions,
           invoice_date, due_date, billing_period_start, billing_period_end,
           status, notes, internal_notes, pdf_url, created_at, updated_at, created_by`
        )
        .in("status", ["sent", "overdue", "partially_paid"])
        .gt("balance_due", 0)
        .order("due_date", { ascending: true });

      if (error) throw new Error(error.message);
      const invoices = invoiceData ?? [];
      if (invoices.length === 0) return [];

      // Fetch clients
      const clientIds = Array.from(new Set(invoices.map((i) => i.client_id)));
      const { data: clientData } = await supabase
        .from("clients")
        .select("id, company_name, currency")
        .in("id", clientIds);

      const clientMap = new Map((clientData ?? []).map((c) => [c.id, c]));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return invoices.map((row) => {
        const client = clientMap.get(row.client_id);
        const dueDate = row.due_date ? new Date(row.due_date) : null;

        let urgency: CollectionUrgency = "upcoming";
        let days_label = "Upcoming";

        if (dueDate) {
          const diffDays = Math.floor(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays < 0) {
            urgency = "overdue";
            days_label = `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} overdue`;
          } else if (diffDays <= 7) {
            urgency = "due_soon";
            const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            days_label = `Due ${months[dueDate.getMonth()]} ${dueDate.getDate()}`;
          } else {
            urgency = "upcoming";
            const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
            days_label = `Expected ${months[dueDate.getMonth()]} ${dueDate.getDate()}`;
          }
        }

        return {
          ...row,
          client_name: client?.company_name ?? "Unknown",
          client_currency: client?.currency ?? "INR",
          urgency,
          days_label,
        } as CollectionInvoice;
      });
    },
  });
}

// ─── useInvoicePayments ───────────────────────────────────────────────────────

export function useInvoicePayments(invoiceId: string) {
  return useQuery({
    queryKey: ["invoice-payments", invoiceId],
    queryFn: async (): Promise<PaymentRow[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("invoice_payments")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("payment_date", { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!invoiceId,
  });
}

// ─── useConvertProformaToInvoice ──────────────────────────────────────────────

export function useConvertProformaToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string): Promise<InvoiceRow> => {
      const supabase = createClient();

      // Fetch the proforma invoice
      const { data: inv, error: fetchError } = await supabase
        .from("invoices")
        .select("invoice_type, invoice_date, total_amount, client_id, currency, status, proforma_ref")
        .eq("id", invoiceId)
        .single();

      if (fetchError) throw new Error(fetchError.message);
      if (inv.invoice_type !== "proforma") {
        throw new Error("Only proforma invoices can be converted");
      }

      // Fetch client to determine new invoice type
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("client_type")
        .eq("id", inv.client_id)
        .single();

      if (clientError) throw new Error(clientError.message);

      const newType: "gst" | "non_gst" | "international" =
        client.client_type === "indian_gst"
          ? "gst"
          : client.client_type === "indian_non_gst"
          ? "non_gst"
          : "international";

      // Get next invoice number (international uses gst sequence)
      const seqType = newType === "non_gst" ? "non_gst" : "gst";
      const invoiceNumber = await getNextInvoiceNumber(supabase, seqType);

      const now = new Date().toISOString();

      // Convert proforma: assign real invoice number + mark paid
      const { data: updated, error: updateError } = await supabase
        .from("invoices")
        .update({
          invoice_type: newType,
          invoice_number: invoiceNumber,
          status: "paid" as any,
          paid_at: now,
          total_received: inv.total_amount,
          balance_due: 0,
          // invoice_date kept as-is (proforma date)
        })
        .eq("id", invoiceId)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);

      // Create a payment record so revenue aggregation views can see this payment
      const { error: paymentError } = await supabase
        .from("invoice_payments")
        .insert({
          invoice_id: invoiceId,
          amount_received: inv.total_amount,
          payment_date: now.split("T")[0],
          payment_method: "bank_transfer" as any,
          notes: `Auto-created from proforma conversion (${inv.proforma_ref ?? "PF"})`,
        });

      if (paymentError) {
        console.error("Failed to create payment for proforma conversion:", paymentError.message);
      }

      return updated;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["invoice", data.id] }),
      ]);
      toast.success(`Converted to ${data.invoice_number} and marked paid`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to convert proforma: ${error.message}`);
    },
  });
}

// ─── useExportInvoicesCSV ─────────────────────────────────────────────────────

export interface ExportInvoicesCSVParams {
  /** Filter by invoice type: "gst" | "non_gst" | "international" | "proforma" */
  invoiceType?: string;
  /** ISO date string (YYYY-MM-DD) - inclusive lower bound on invoice_date */
  dateFrom?: string;
  /** ISO date string (YYYY-MM-DD) - inclusive upper bound on invoice_date */
  dateTo?: string;
}

/**
 * Triggers a CSV export of invoices matching the supplied filters.
 * The API route returns an application/octet-stream response; this hook
 * converts it to a Blob URL and programmatically clicks a hidden anchor
 * to prompt the browser's native file-save dialog.
 *
 * The download filename includes today's date for easy archival,
 * e.g. "invoices-export-2026-03-04.csv".
 */
export function useExportInvoicesCSV() {
  return useMutation<{ success: true }, Error, ExportInvoicesCSVParams>({
    mutationFn: async (
      params: ExportInvoicesCSVParams
    ): Promise<{ success: true }> => {
      const qs = new URLSearchParams();
      if (params.invoiceType) qs.set("invoiceType", params.invoiceType);
      if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
      if (params.dateTo) qs.set("dateTo", params.dateTo);

      const url = `/api/invoices/export-csv${qs.toString() ? `?${qs.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body?.error ?? `Export failed (${response.status})`
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `invoices-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);

      return { success: true };
    },
    onSuccess: () => {
      toast.success("CSV exported successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to export CSV: ${error.message}`);
    },
  });
}

// ─── useRecordPayment ─────────────────────────────────────────────────────────

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RecordPaymentPayload): Promise<void> => {
      const supabase = createClient();
      const invoiceId = payload.payment.invoice_id;

      // 0. Validate payment amount does not exceed balance due (overpayment guard)
      const { data: preInvoice, error: preInvError } = await supabase
        .from("invoices")
        .select("total_amount, total_received, total_tds_deducted")
        .eq("id", invoiceId)
        .single();

      if (preInvError) throw new Error(preInvError.message);

      const currentBalance = Math.max(
        0,
        (preInvoice.total_amount ?? 0)
          - (preInvoice.total_received ?? 0)
          - (preInvoice.total_tds_deducted ?? 0)
      );
      const paymentTotal = (payload.payment.amount_received ?? 0) + (payload.payment.tds_amount ?? 0);

      if (paymentTotal > currentBalance + 0.01) {
        throw new Error(
          `Payment of ${paymentTotal.toFixed(2)} exceeds the outstanding balance of ${currentBalance.toFixed(2)}. Please enter a smaller amount.`
        );
      }

      // 1. Insert the payment record
      const { error: paymentError } = await supabase
        .from("invoice_payments")
        .insert(payload.payment);

      if (paymentError) throw new Error(paymentError.message);

      // 2. Recalculate total_received from all payments
      const { data: allPayments, error: fetchError } = await supabase
        .from("invoice_payments")
        .select("amount_received, tds_amount")
        .eq("invoice_id", invoiceId);

      if (fetchError) throw new Error(fetchError.message);

      const totalReceived = Math.round((allPayments ?? []).reduce(
        (sum, p) => sum + (p.amount_received ?? 0),
        0
      ) * 100) / 100;
      const totalTds = Math.round((allPayments ?? []).reduce(
        (sum, p) => sum + (p.tds_amount ?? 0),
        0
      ) * 100) / 100;

      // 3. Fetch invoice to get total_amount
      const { data: invoice, error: invFetchError } = await supabase
        .from("invoices")
        .select("total_amount")
        .eq("id", invoiceId)
        .single();

      if (invFetchError) throw new Error(invFetchError.message);

      const balanceDue = Math.max(0, Math.round(((invoice.total_amount ?? 0) - totalReceived - totalTds) * 100) / 100);

      // 4. Determine new status
      let newStatus: InvoiceStatus | undefined;
      if (balanceDue <= 0) {
        newStatus = "paid";
      } else if (totalReceived > 0) {
        newStatus = "partially_paid";
      }

      // 5. Update invoice totals and status
      const updatePayload: InvoiceUpdate = {
        total_received: totalReceived,
        total_tds_deducted: totalTds,
        balance_due: balanceDue,
        ...(newStatus ? { status: newStatus } : {}),
        ...(newStatus === "paid" ? { paid_at: new Date().toISOString() } : {}),
      };

      const { error: updateError } = await supabase
        .from("invoices")
        .update(updatePayload)
        .eq("id", invoiceId);

      if (updateError) throw new Error(updateError.message);
    },
    onSuccess: async (_, payload) => {
      const invoiceId = payload.payment.invoice_id;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
        queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] }),
        queryClient.invalidateQueries({ queryKey: ["invoice-payments", invoiceId] }),
      ]);
      toast.success("Payment recorded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}
