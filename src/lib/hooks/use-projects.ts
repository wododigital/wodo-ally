"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];

export type ProjectWithClient = Project & {
  clients: { company_name: string } | null;
};

export interface UpdateProjectStatusPayload {
  id: string;
  status: Project["status"];
}

// ─── Fetch all projects (optionally by client) ────────────────────────────────

export function useProjects(clientId?: string) {
  return useQuery({
    queryKey: clientId ? ["projects", { clientId }] : ["projects"],
    queryFn: async (): Promise<ProjectWithClient[]> => {
      const supabase = createClient();

      let query = supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const projects = (data ?? []) as Project[];

      // Fetch unique client names separately
      const clientIdSet = new Set(projects.map((p) => p.client_id));
      const uniqueClientIds = Array.from(clientIdSet);
      let clientMap: Record<string, string> = {};

      if (uniqueClientIds.length > 0) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("id, company_name")
          .in("id", uniqueClientIds);

        if (clientData) {
          clientMap = Object.fromEntries(clientData.map((c) => [c.id, c.company_name]));
        }
      }

      return projects.map((p) => ({
        ...p,
        clients: clientMap[p.client_id] ? { company_name: clientMap[p.client_id] } : null,
      }));
    },
  });
}

// ─── Fetch single project ─────────────────────────────────────────────────────

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async (): Promise<Project> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
  });
}

// ─── Create project ───────────────────────────────────────────────────────────

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProjectInsert): Promise<Project> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", { clientId: data.client_id }] });
      toast.success("Project created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create project: ${error.message}`);
    },
  });
}

// ─── Update project ───────────────────────────────────────────────────────────

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Database["public"]["Tables"]["projects"]["Update"];
    }): Promise<Project> => {
      const supabase = createClient();
      const { data: updated, error } = await supabase
        .from("projects")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.id] });
      queryClient.invalidateQueries({ queryKey: ["projects", { clientId: data.client_id }] });
      toast.success("Project updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update project: ${error.message}`);
    },
  });
}

// ─── Update project status only ───────────────────────────────────────────────

export function useUpdateProjectStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status: Project["status"]): Promise<Project> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", id] });
      queryClient.invalidateQueries({ queryKey: ["projects", { clientId: data.client_id }] });
      toast.success("Project status updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update project status: ${error.message}`);
    },
  });
}
