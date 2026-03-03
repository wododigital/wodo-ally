"use client";

import { useEffect } from "react";

export default function Error({
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <p className="text-text-muted text-sm">Something went wrong.</p>
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium text-white rounded-button"
          style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
