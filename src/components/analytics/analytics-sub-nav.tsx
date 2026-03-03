"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/analytics",           label: "Overview",      exact: true },
  { href: "/analytics/invoices",  label: "Invoices"  },
  { href: "/analytics/expenses",  label: "Expenses"  },
  { href: "/analytics/clients",   label: "Clients"   },
  { href: "/analytics/projects",  label: "Projects"  },
  { href: "/analytics/pl",        label: "P&L"       },
  { href: "/analytics/balance",   label: "Balance Sheet" },
];

export function AnalyticsSubNav() {
  const pathname = usePathname();

  function isActive(tab: typeof TABS[0]) {
    return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
  }

  return (
    <div className="overflow-x-auto -mx-1 pb-0.5">
      <div className="flex items-center gap-1.5 min-w-max px-1">
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-3.5 py-1.5 rounded-button text-xs font-semibold whitespace-nowrap transition-all duration-150 border",
                active
                  ? "bg-accent-muted text-accent border-accent-light"
                  : "text-text-muted bg-surface-DEFAULT border-black/[0.05] hover:text-text-secondary hover:border-black/[0.08]"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
