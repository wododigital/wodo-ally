"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];
type ContractInsert = Database["public"]["Tables"]["contracts"]["Insert"];
type ContractUpdate = Database["public"]["Tables"]["contracts"]["Update"];

export type ContractStatus = ContractRow["status"];

export type ContractWithDetails = ContractRow & {
  client: {
    company_name: string;
    currency: Database["public"]["Tables"]["clients"]["Row"]["currency"];
  };
  project: { name: string } | null;
};

export interface ContractFilters {
  status?: ContractStatus;
  clientId?: string;
}

// ─── useContracts ─────────────────────────────────────────────────────────────

export function useContracts(filters?: ContractFilters) {
  return useQuery({
    queryKey: ["contracts", filters],
    queryFn: async (): Promise<ContractWithDetails[]> => {
      const supabase = createClient();

      let query = supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      }

      const { data: contracts, error: contractsError } = await query;
      if (contractsError) throw new Error(contractsError.message);

      const rows = (contracts ?? []) as ContractRow[];
      if (rows.length === 0) return [];

      // Fetch client details
      const clientIds = Array.from(new Set(rows.map((c) => c.client_id)));
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("id, company_name, currency")
        .in("id", clientIds);

      if (clientsError) throw new Error(clientsError.message);

      const clientMap = new Map(
        (clients ?? []).map((c) => [c.id, c])
      );

      // Fetch project details
      const projectIds = rows
        .map((c) => c.project_id)
        .filter((id): id is string => id !== null);

      let projectMap = new Map<string, { name: string }>();
      if (projectIds.length > 0) {
        const uniqueProjectIds = Array.from(new Set(projectIds));
        const { data: projectData } = await supabase
          .from("projects")
          .select("id, name")
          .in("id", uniqueProjectIds);

        if (projectData) {
          projectMap = new Map(projectData.map((p) => [p.id, { name: p.name }]));
        }
      }

      return rows.map((contract) => {
        const clientData = clientMap.get(contract.client_id);
        return {
          ...contract,
          client: {
            company_name: clientData?.company_name ?? "Unknown",
            currency: (clientData?.currency ?? "INR") as ContractWithDetails["client"]["currency"],
          },
          project: contract.project_id
            ? (projectMap.get(contract.project_id) ?? null)
            : null,
        };
      });
    },
  });
}

// ─── useContract (single) ─────────────────────────────────────────────────────

export function useContract(id: string) {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: async (): Promise<ContractWithDetails> => {
      const supabase = createClient();

      const { data: contract, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      const row = contract as ContractRow;

      // Fetch client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, company_name, currency, address, city, state, pincode, country, gstin")
        .eq("id", row.client_id)
        .single();

      if (clientError) throw new Error(clientError.message);

      // Fetch project if linked
      let project: { name: string } | null = null;
      if (row.project_id) {
        const { data: projectData } = await supabase
          .from("projects")
          .select("id, name")
          .eq("id", row.project_id)
          .single();

        if (projectData) {
          project = { name: projectData.name };
        }
      }

      return {
        ...row,
        client: {
          company_name: clientData.company_name,
          currency: clientData.currency as ContractWithDetails["client"]["currency"],
        },
        project,
      };
    },
    enabled: !!id,
  });
}

// ─── useCreateContract ────────────────────────────────────────────────────────

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ContractInsert): Promise<ContractRow> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contracts")
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as ContractRow;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create contract: ${error.message}`);
    },
  });
}

// ─── useUpdateContract ────────────────────────────────────────────────────────

export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ContractUpdate;
    }): Promise<ContractRow> => {
      const supabase = createClient();
      const { data: updated, error } = await supabase
        .from("contracts")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return updated as ContractRow;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["contracts"] }),
        queryClient.invalidateQueries({ queryKey: ["contracts", data.id] }),
      ]);
      toast.success("Contract updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contract: ${error.message}`);
    },
  });
}

// ─── useDeleteContract - only drafts ─────────────────────────────────────────

export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();

      // Safety: only allow deleting drafts
      const { data: contract, error: fetchError } = await supabase
        .from("contracts")
        .select("status")
        .eq("id", id)
        .single();

      if (fetchError) throw new Error(fetchError.message);
      if (contract.status !== "draft") {
        throw new Error("Only draft contracts can be deleted");
      }

      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contract: ${error.message}`);
    },
  });
}

// ─── useUpdateContractStatus ──────────────────────────────────────────────────

export function useUpdateContractStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: ContractStatus;
    }): Promise<ContractRow> => {
      const supabase = createClient();

      const updateData: ContractUpdate = { status };
      if (status === "signed") {
        updateData.signed_date = new Date().toISOString().split("T")[0];
      }

      const { data, error } = await supabase
        .from("contracts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as ContractRow;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["contracts"] }),
        queryClient.invalidateQueries({ queryKey: ["contracts", data.id] }),
      ]);
      toast.success(`Contract status updated to ${data.status}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contract status: ${error.message}`);
    },
  });
}
