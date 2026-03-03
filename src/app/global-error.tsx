"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <p className="text-sm">Something went wrong.</p>
            <button
              onClick={reset}
              className="px-4 py-2 text-sm font-medium text-white rounded"
              style={{ background: "#fd7e14" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
