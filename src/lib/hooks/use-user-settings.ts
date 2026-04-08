"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SettingsCategory =
  | "company"
  | "invoice"
  | "notifications"
  | "email_templates"
  | "contract_templates"
  | "brand_assets";

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetches a user setting by category.
 * Falls back to localStorage if DB has no entry (migration path).
 */
export function useUserSetting<T>(category: SettingsCategory, fallback: T) {
  return useQuery({
    queryKey: ["user-settings", category],
    queryFn: async (): Promise<T> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return fallback;

      const { data, error } = await (supabase as any)
        .from("user_settings")
        .select("settings")
        .eq("user_id", user.id)
        .eq("category", category)
        .maybeSingle();

      if (error) {
        console.error(`Failed to load ${category} settings:`, error.message);
        return fallback;
      }

      if (data?.settings) {
        return data.settings as T;
      }

      // Fallback: try localStorage for migration
      const lsKey = getLsKey(category);
      if (lsKey && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(lsKey);
          if (stored) {
            const parsed = JSON.parse(stored) as T;
            // Auto-migrate to DB
            await (supabase as any).from("user_settings").upsert({
              user_id: user.id,
              category,
              settings: parsed,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id,category" });
            return parsed;
          }
        } catch {
          // ignore parse errors
        }
      }

      return fallback;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Saves a user setting to the database.
 */
export function useSaveUserSetting<T>(category: SettingsCategory) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: T): Promise<void> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any)
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            category,
            settings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,category" }
        );

      if (error) throw new Error(error.message);

      // Also update localStorage as backup
      const lsKey = getLsKey(category);
      if (lsKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(lsKey, JSON.stringify(settings));
        } catch {
          // ignore quota errors
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-settings", category] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLsKey(category: SettingsCategory): string | null {
  const map: Record<SettingsCategory, string> = {
    company: "wodo_company",
    invoice: "wodo_invoice_settings",
    notifications: "wodo_notifications",
    email_templates: "wodo_email_templates",
    contract_templates: "wodo_contract_templates",
    brand_assets: "wodo_brand_assets",
  };
  return map[category] ?? null;
}
