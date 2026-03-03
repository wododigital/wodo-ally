"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
type ClientContact = Database["public"]["Tables"]["client_contacts"]["Row"];
type ClientContactInsert = Database["public"]["Tables"]["client_contacts"]["Insert"];

export type ClientWithContacts = Client & {
  client_contacts: ClientContact[];
};

export interface ClientStats {
  total_invoiced: number;
  total_received: number;
  outstanding: number;
}

export interface CreateClientPayload {
  client: ClientInsert;
  contacts?: Omit<ClientContactInsert, "client_id">[];
}

export interface UpdateClientPayload {
  id: string;
  data: Database["public"]["Tables"]["clients"]["Update"];
}

// ─── Fetch all clients ────────────────────────────────────────────────────────

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<Client[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as Client[];
    },
  });
}

// ─── Fetch single client with contacts ───────────────────────────────────────

export function useClient(id: string) {
  return useQuery({
    queryKey: ["clients", id],
    refetchOnMount: "always",
    queryFn: async (): Promise<ClientWithContacts> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);

      const { data: contacts, error: contactsError } = await supabase
        .from("client_contacts")
        .select("*")
        .eq("client_id", id)
        .order("is_primary", { ascending: false });

      if (contactsError) throw new Error(contactsError.message);

      return { ...(data as Client), client_contacts: contacts ?? [] };
    },
    enabled: !!id,
  });
}

// ─── Client stats ─────────────────────────────────────────────────────────────

export function useClientStats(id: string) {
  return useQuery({
    queryKey: ["client-stats", id],
    queryFn: async (): Promise<ClientStats> => {
      const supabase = createClient();

      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("total_amount, total_received, balance_due")
        .eq("client_id", id)
        .neq("status", "cancelled");

      if (invoiceError) throw new Error(invoiceError.message);

      const rows = invoiceData ?? [];
      const total_invoiced = rows.reduce((sum, r) => sum + (r.total_amount ?? 0), 0);
      const total_received = rows.reduce((sum, r) => sum + (r.total_received ?? 0), 0);
      const outstanding = rows.reduce((sum, r) => sum + (r.balance_due ?? 0), 0);

      return { total_invoiced, total_received, outstanding };
    },
    enabled: !!id,
  });
}

// ─── Create client ────────────────────────────────────────────────────────────

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateClientPayload): Promise<Client> => {
      const supabase = createClient();

      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert(payload.client)
        .select()
        .single();

      if (clientError) throw new Error(clientError.message);

      if (payload.contacts && payload.contacts.length > 0) {
        const contactsToInsert = payload.contacts.map((c) => ({
          ...c,
          client_id: newClient.id,
        }));
        const { error: contactError } = await supabase
          .from("client_contacts")
          .insert(contactsToInsert);

        if (contactError) throw new Error(contactError.message);
      }

      return newClient;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create client: ${error.message}`);
    },
  });
}

// ─── Update client ────────────────────────────────────────────────────────────

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateClientPayload): Promise<Client> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("clients")
        .update(payload.data)
        .eq("id", payload.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clients"] }),
        queryClient.invalidateQueries({ queryKey: ["clients", data.id] }),
      ]);
      toast.success("Client updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });
}

// ─── Close client ─────────────────────────────────────────────────────────────

export function useCloseClient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("clients")
        .update({ status: "closed" })
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clients"] }),
        queryClient.invalidateQueries({ queryKey: ["clients", id] }),
      ]);
      toast.success("Client account closed");
    },
    onError: (error: Error) => {
      toast.error(`Failed to close client: ${error.message}`);
    },
  });
}

// ─── Reactivate client ────────────────────────────────────────────────────────

export function useReactivateClient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("clients")
        .update({ status: "active" })
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["clients"] }),
        queryClient.invalidateQueries({ queryKey: ["clients", id] }),
      ]);
      toast.success("Client reactivated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to reactivate client: ${error.message}`);
    },
  });
}

// ─── Delete client ────────────────────────────────────────────────────────────

export function useDeleteClient(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });
}
