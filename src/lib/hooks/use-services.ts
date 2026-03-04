"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  hsn_code: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceInsert {
  name: string;
  description?: string | null;
  color?: string | null;
  hsn_code?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface ServiceUpdate {
  name?: string;
  description?: string | null;
  color?: string | null;
  hsn_code?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

// ─── useServices - active only, ordered by sort_order ────────────────────────

export function useServices() {
  return useQuery({
    queryKey: ["services", { activeOnly: true }],
    queryFn: async (): Promise<Service[]> => {
      const supabase = createClient();
      // Cast to any to bypass Database type - services table is not in the generated types yet
      const { data, error } = await (supabase as any)
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as Service[];
    },
  });
}

// ─── useAllServices - all including inactive, for settings ───────────────────

export function useAllServices() {
  return useQuery({
    queryKey: ["services", { activeOnly: false }],
    queryFn: async (): Promise<Service[]> => {
      const supabase = createClient();
      const { data, error } = await (supabase as any)
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as Service[];
    },
  });
}

// ─── useCreateService ────────────────────────────────────────────────────────

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ServiceInsert): Promise<Service> => {
      const supabase = createClient();
      const { data, error } = await (supabase as any)
        .from("services")
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Service;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create service: ${error.message}`);
    },
  });
}

// ─── useUpdateService ────────────────────────────────────────────────────────

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ServiceUpdate;
    }): Promise<Service> => {
      const supabase = createClient();
      const { data: updated, error } = await (supabase as any)
        .from("services")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return updated as Service;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update service: ${error.message}`);
    },
  });
}

// ─── useDeleteService ────────────────────────────────────────────────────────
// Safe delete: catches FK constraint violations from the DB

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();

      const { error } = await (supabase as any)
        .from("services")
        .delete()
        .eq("id", id);

      if (error) {
        // Surface FK constraint violations as readable messages
        if (error.code === "23503") {
          throw new Error(
            "Cannot delete this service - it is still referenced by invoices or projects."
          );
        }
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete service: ${error.message}`);
    },
  });
}

// ─── useToggleService ────────────────────────────────────────────────────────

export function useToggleService(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<Service> => {
      const supabase = createClient();

      // Fetch current state
      const { data: current, error: fetchError } = await (supabase as any)
        .from("services")
        .select("is_active")
        .eq("id", id)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const { data: updated, error: updateError } = await (supabase as any)
        .from("services")
        .update({ is_active: !current.is_active })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);
      return updated as Service;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(
        data.is_active ? "Service activated" : "Service deactivated"
      );
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle service: ${error.message}`);
    },
  });
}
