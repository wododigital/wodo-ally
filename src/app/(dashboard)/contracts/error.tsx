"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ContractsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-24 px-6">
      <div className="text-center space-y-4 max-w-md">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <span className="text-2xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-text-primary">Failed to load contracts</h2>
        <p className="text-sm text-text-secondary">
          An error occurred while loading contract data. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-medium text-white rounded-button"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            Try again
          </button>
          <Link
            href="/contracts"
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] rounded-button hover:border-black/[0.08] transition-colors"
          >
            Back to Contracts
          </Link>
        </div>
      </div>
    </div>
  );
}
