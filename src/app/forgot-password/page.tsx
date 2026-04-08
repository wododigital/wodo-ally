"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Mail, Check, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/white-bg.webp')",
        backgroundSize: "cover",
      }}
    >
      <div className="w-full max-w-md">
        <div className="glass-card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <h1 className="text-lg font-bold text-text-primary">Check your email</h1>
              <p className="text-sm text-text-secondary">
                We have sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
              </p>
              <p className="text-xs text-text-muted">
                Did not receive it? Check your spam folder or try again.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => { setSent(false); setEmail(""); }}
                  className="text-sm text-accent hover:underline"
                >
                  Try a different email
                </button>
                <Link href="/login" className="text-sm text-text-muted hover:text-text-primary transition-colors">
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
                <h1 className="text-lg font-bold text-text-primary">Forgot your password?</h1>
                <p className="text-sm text-text-muted mt-1">
                  Enter your email address and we will send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="accounts@wodo.digital"
                      className="glass-input pl-10"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Send Reset Link
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
