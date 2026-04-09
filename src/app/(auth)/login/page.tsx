"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/shared/glass-card";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Ensure profile exists
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!profile) {
          // Auto-create profile
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true });

          await supabase.from("profiles").insert({
            id: user.id,
            full_name: user.email?.split("@")[0] ?? "User",
            email: user.email ?? "",
            role: count === 0 ? "admin" : "viewer",
          });
        }
      }

      router.push("/dashboard");
      router.refresh();
      // Don't setLoading(false) on success — keep spinner visible
      // until navigation completes and this component unmounts
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <GlassCard className="w-full max-w-md" padding="lg">
        {/* Logo + branding */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/wodo-logo.png"
            alt="WODO Digital"
            width={48}
            height={48}
            className="rounded-xl mb-4"
          />
          <h1 className="text-2xl font-bold text-text-primary">WODO Ally</h1>
          <p className="text-sm text-text-muted mt-1">Internal Management Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@wodo.digital"
              required
              className={`glass-input ${error ? "border-red-500/50 focus:border-red-500" : ""}`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={`glass-input pr-10 ${error ? "border-red-500/50 focus:border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-button text-xs text-red-400 bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-button font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: loading
                ? "rgba(253,126,20,0.5)"
                : "linear-gradient(135deg, #fd7e14, #e8720f)",
              boxShadow: loading ? "none" : "0 4px 15px rgba(253,126,20,0.3)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-xs text-text-muted text-center mt-6">
          WODO Digital Private Limited - Internal use only
        </p>
      </GlassCard>
    </div>
  );
}
