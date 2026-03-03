"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TdsCertificate {
  id: string;
  certificate_number: string;
  client_id: string | null;
  amount: number;
  financial_year: string;
  quarter: string | null;
  received_date: string | null;
  notes: string | null;
  created_at: string;
  // Enriched
  client_name?: string;
}

export interface CreateTdsCertificatePayload {
  certificate_number: string;
  client_id: string | null;
  amount: number;
  financial_year: string;
  quarter: string | null;
  received_date: string | null;
  notes: string | null;
}

// ─── useTdsCertificates ───────────────────────────────────────────────────────

export function useTdsCertificates(financialYear?: string) {
  return useQuery({
    queryKey: ["tds-certificates", financialYear],
    queryFn: async (): Promise<TdsCertificate[]> => {
      const supabase = createClient();

      let query = (supabase as any)
        .from("tds_certificates")
        .select("*")
        .order("received_date", { ascending: false });

      if (financialYear) {
        query = query.eq("financial_year", financialYear);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const rows: TdsCertificate[] = data ?? [];
      if (rows.length === 0) return [];

      // Fetch client names
      const clientIds = Array.from(
        new Set(rows.map((r) => r.client_id).filter(Boolean) as string[])
      );

      if (clientIds.length === 0) return rows;

      const { data: clients, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name")
        .in("id", clientIds);

      if (clientError) throw new Error(clientError.message);

      const clientMap = new Map(
        (clients ?? []).map((c) => [c.id, c.company_name])
      );

      return rows.map((row) => ({
        ...row,
        client_name: row.client_id ? (clientMap.get(row.client_id) ?? "Unknown") : "-",
      }));
    },
  });
}

// ─── useCreateTdsCertificate ──────────────────────────────────────────────────

export function useCreateTdsCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTdsCertificatePayload): Promise<void> => {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from("tds_certificates")
        .insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tds-certificates"] });
      toast.success("TDS certificate added");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add certificate: ${error.message}`);
    },
  });
}

// ─── useDeleteTdsCertificate ──────────────────────────────────────────────────

export function useDeleteTdsCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from("tds_certificates")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tds-certificates"] });
      toast.success("Certificate deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete certificate: ${error.message}`);
    },
  });
}
