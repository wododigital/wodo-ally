import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Role = Database["public"]["Tables"]["profiles"]["Row"]["role"];

/**
 * Server-side role check for API routes.
 * Fetches the user's role from the profiles table and checks against allowed roles.
 * Returns the role if allowed, or null if the user lacks permission.
 */
export async function getUserRole(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Role | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !profile) return null;
  return profile.role;
}

/**
 * Check if a user role is in the allowed list.
 */
export function isRoleAllowed(
  role: Role | null,
  allowedRoles: Role[]
): boolean {
  if (!role) return false;
  return allowedRoles.includes(role);
}
