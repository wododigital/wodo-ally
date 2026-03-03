"use client";

import Link from "next/link";
import { ArrowUpRight, MoreHorizontal } from "lucide-react";

type AttentionType = "overdue" | "pending" | "action";

interface AttentionItem {
  id: string;
  type: AttentionType;
  title: string;
  client: string;
  amount: string;
  dueLabel: string;
  action: string;
}

interface NeedsAttentionV2Props {
  items: AttentionItem[];
  variant?: "light" | "dark";
  className?: string;
}

const typeConfig: Record<
  AttentionType,
  { borderColor: string; dotColor: string; labelColor: string }
> = {
  overdue: {
    borderColor: "#ef4444",
    dotColor: "#ef4444",
    labelColor: "#ef4444",
  },
  pending: {
    borderColor: "#f59e0b",
    dotColor: "#f59e0b",
    labelColor: "#f59e0b",
  },
  action: {
    borderColor: "rgba(255,255,255,0.15)",
    dotColor: "rgba(255,255,255,0.3)",
    labelColor: "rgba(255,255,255,0.45)",
  },
};

export function NeedsAttentionV2({ items, variant = "light", className }: NeedsAttentionV2Props) {
  const isDark = variant === "dark";

  return (
    <div
      className={`rounded-2xl overflow-hidden${className ? ` ${className}` : ""}`}
      style={
        isDark
          ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
          : { background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.75)", boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }
      }
    >
      {items.map((item, idx) => {
        const cfg = typeConfig[item.type];
        const actionDotColor =
          item.type === "action"
            ? isDark
              ? "rgba(255,255,255,0.25)"
              : "#9ca3af"
            : cfg.dotColor;

        return (
          <Link
            key={item.id}
            href={item.action}
            className="group flex items-center transition-colors duration-150"
            style={{
              borderBottom:
                idx < items.length - 1
                  ? `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`
                  : "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.02)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            {/* Left accent bar */}
            <div
              className="w-[3px] self-stretch shrink-0"
              style={{ background: cfg.borderColor, minHeight: "68px" }}
            />

            <div className="flex-1 flex items-center gap-4 px-6 py-5 min-w-0">
              {/* Dot */}
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: actionDotColor }}
              />

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold leading-snug transition-colors"
                  style={{ color: isDark ? "rgba(255,255,255,0.9)" : "#1f2937" }}
                >
                  {item.title}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: isDark ? "rgba(255,255,255,0.38)" : "#9ca3af" }}
                >
                  {item.client}
                </p>
              </div>

              {/* Amount + label */}
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span
                  className="text-sm font-bold font-sans"
                  style={{ color: isDark ? "rgba(255,255,255,0.95)" : "#111827" }}
                >
                  {item.amount}
                </span>
                <span className="text-[11px] font-medium" style={{ color: cfg.labelColor }}>
                  {item.dueLabel}
                </span>
              </div>

              {/* Actions */}
              <div className="ml-1 flex items-center gap-0.5">
                <button
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: isDark ? "rgba(255,255,255,0.25)" : "#d1d5db" }}
                  onClick={(e) => e.preventDefault()}
                  title="More options"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
                <ArrowUpRight
                  className="w-3.5 h-3.5 transition-colors"
                  style={{ color: isDark ? "rgba(255,255,255,0.2)" : "#d1d5db" }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
