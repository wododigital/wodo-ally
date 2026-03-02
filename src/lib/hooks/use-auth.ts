"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: Profile["role"] | null;
  isAdmin: boolean;
  isManagerOrAbove: boolean;
  isAccountantOrAbove: boolean;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: null,
    isAdmin: false,
    isManagerOrAbove: false,
    isAccountantOrAbove: false,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const role = profile?.role ?? null;
      setState({
        user: { id: user.id, email: user.email ?? "" },
        profile: profile ?? null,
        role,
        isAdmin: role === "admin",
        isManagerOrAbove: role === "admin" || role === "manager",
        isAccountantOrAbove: role === "admin" || role === "manager" || role === "accountant",
        loading: false,
      });
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
