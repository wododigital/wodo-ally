"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BankAccountField {
  key: string;
  label: string;
  value: string;
  mono?: boolean;
  span?: boolean;
}

export interface BankAccount {
  id: string;
  account_key: string;
  title: string;
  fields: BankAccountField[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async (): Promise<BankAccount[]> => {
      const supabase = createClient();
      const { data, error } = await (supabase as any)
        .from("bank_accounts")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as BankAccount[];
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: BankAccountField[] }): Promise<void> => {
      const supabase = createClient();
      const { error } = await (supabase as any)
        .from("bank_accounts")
        .update({ fields, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Bank details updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}
