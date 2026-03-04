"use client";

import Link from "next/link";
import { LayoutDashboard, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle px-4">
      <div className="text-center max-w-sm">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{ background: "rgba(253,126,20,0.10)", border: "1px solid rgba(253,126,20,0.15)" }}
        >
          <span className="text-2xl font-light" style={{ color: "#fd7e14" }}>404</span>
        </div>

        <h1 className="text-2xl font-light text-text-primary mb-2">Page not found</h1>
        <p className="text-sm text-text-muted mb-8">
          This page does not exist or may have been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-text-secondary"
            style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
