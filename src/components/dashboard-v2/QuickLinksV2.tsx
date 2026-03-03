"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface QuickLink {
  href: string;
  label: string;
}

export function QuickLinksV2({ links }: { links: QuickLink[] }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {links.map((link, idx) => (
        <Link
          key={link.href}
          href={link.href}
          className="group flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/[0.04]"
          style={{
            borderBottom: idx < links.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}
        >
          <span
            className="text-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {link.label}
          </span>
          <ArrowRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />
        </Link>
      ))}
    </div>
  );
}
