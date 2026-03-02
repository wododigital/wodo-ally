"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const PAGE_TITLES: Record<string, { title: string; description?: string }> = {
  "/dashboard": { title: "Dashboard", description: "Financial overview" },
  "/clients": { title: "Clients", description: "Manage client accounts" },
  "/projects": { title: "Projects", description: "Track project lifecycle" },
  "/invoices": { title: "Invoices", description: "Billing and invoicing" },
  "/contracts": { title: "Contracts", description: "Contract management" },
  "/payments": { title: "Payments", description: "Payment tracking" },
  "/expenses": { title: "Expenses", description: "Expense management" },
  "/analytics": { title: "Analytics", description: "Financial analytics" },
  "/targets": { title: "Targets", description: "Financial goals" },
  "/reports": { title: "Investor Reports", description: "Monthly reports" },
  "/settings": { title: "Settings", description: "App configuration" },
};

interface HeaderProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const pathname = usePathname();
  const pageKey = Object.keys(PAGE_TITLES).find((key) =>
    key === "/dashboard" ? pathname === key : pathname.startsWith(key)
  );
  const pageInfo = pageKey ? PAGE_TITLES[pageKey] : { title: "WODO Ally" };

  return (
    <header
      className={cn(
        "h-16 flex items-center justify-between px-6 border-b border-white/5",
        "bg-background/80 backdrop-blur-sm sticky top-0 z-30",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-colors duration-150 md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-base font-semibold text-text-primary leading-none">
            {pageInfo.title}
          </h2>
          {pageInfo.description && (
            <p className="text-xs text-text-muted mt-0.5">{pageInfo.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-colors duration-150 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
        </button>
      </div>
    </header>
  );
}
