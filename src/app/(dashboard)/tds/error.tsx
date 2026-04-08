"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TdsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("TDS page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <h2 className="text-lg font-bold text-text-primary mb-2">Something went wrong</h2>
      <p className="text-sm text-text-muted mb-6 max-w-md">
        An error occurred while loading TDS certificates. Please try again.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium text-white transition-all"
          style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:text-text-primary transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
