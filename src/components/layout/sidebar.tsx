"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FolderKanban, FileText,
  FileSignature, CreditCard, Receipt, BarChart3,
  Target, PieChart, Settings, LogOut, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

const NAV_GROUPS = [
  {
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/contracts", label: "Contracts", icon: FileSignature },
      { href: "/payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    items: [
      { href: "/expenses", label: "Expenses", icon: Receipt },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/targets", label: "Targets", icon: Target },
    ],
  },
  {
    items: [
      { href: "/reports", label: "Investor Reports", icon: PieChart },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "glass-sidebar w-[260px] h-screen flex flex-col fixed left-0 top-0 z-40",
        className
      )}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Image
            src="/wodo-logo.png"
            alt="WODO Digital"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <div>
            <p className="text-sm font-semibold text-text-primary leading-none">WODO Ally</p>
            <p className="text-xs text-text-muted mt-0.5">Internal Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-0.5">
            {groupIdx > 0 && (
              <div className="h-px bg-white/5 mb-3" />
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-card text-sm transition-all duration-150 group relative",
                    active
                      ? "text-accent bg-accent-muted font-medium"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-DEFAULT"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r-full" />
                  )}
                  <item.icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      active ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-3 h-3 text-accent opacity-60" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User account */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="glass-card p-3 rounded-card">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-button flex items-center justify-center text-xs font-semibold text-white shrink-0"
              style={{ background: "rgba(253,126,20,0.2)", border: "1px solid rgba(253,126,20,0.3)" }}
            >
              {profile?.full_name?.charAt(0) ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">
                {profile?.full_name ?? "User"}
              </p>
              <p className="text-xs text-text-muted capitalize">{profile?.role ?? "viewer"}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
