"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, Settings, LogOut, ChevronLeft, AlertCircle, Clock, Calendar, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useEffect, useRef, useState } from "react";

const NAV_TABS = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/clients",   label: "Clients"   },
  { href: "/invoices",  label: "Invoices"  },
  { href: "/payments",  label: "Payments"  },
  { href: "/expenses",  label: "Expenses"  },
  { href: "/analytics", label: "Analytics" },
  { href: "/targets",   label: "Targets"   },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/clients":    "Clients",
  "/invoices":   "Invoices",
  "/payments":   "Payments",
  "/expenses":   "Expenses",
  "/analytics":  "Analytics",
  "/targets":    "Targets",
  "/projects":   "Projects",
  "/reports":    "Reports",
  "/settings":   "Settings",
  "/contracts":  "Contracts",
};

// ─── Notifications ────────────────────────────────────────────────────────────

type NotifType = "overdue" | "due_soon" | "upcoming" | "payment";

const NOTIFICATIONS: {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  href: string;
}[] = [
  {
    id: "1",
    type: "overdue",
    title: "Invoice overdue",
    body: "NG00201 - Raj Enterprises · Rs.17,500",
    time: "8 days ago",
    read: false,
    href: "/invoices/bbbbbbbb-0000-0000-0000-000000000007",
  },
  {
    id: "2",
    type: "due_soon",
    title: "Invoice due in 5 days",
    body: "G00111 - Nandhini Hotel · Rs.76,700",
    time: "Today",
    read: false,
    href: "/invoices/bbbbbbbb-0000-0000-0000-000000000002",
  },
  {
    id: "3",
    type: "upcoming",
    title: "Retainer invoice due Apr 1",
    body: "Maximus OIGA · Rs.59,000 - Draft before Apr 1",
    time: "In 28 days",
    read: false,
    href: "/invoices/new?client=22222222-0000-0000-0000-000000000002",
  },
  {
    id: "4",
    type: "upcoming",
    title: "Retainer invoice due Apr 1",
    body: "Nandhini Hotel · Rs.76,700 - Draft before Apr 1",
    time: "In 28 days",
    read: true,
    href: "/invoices/new?client=11111111-0000-0000-0000-000000000001",
  },
  {
    id: "5",
    type: "payment",
    title: "Payment received",
    body: "Sea Wonders Tourism · Rs.89,600",
    time: "3 days ago",
    read: true,
    href: "/payments",
  },
];

const NOTIF_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  overdue:  { icon: AlertCircle,   color: "#ef4444", bg: "rgba(239,68,68,0.10)"   },
  due_soon: { icon: Clock,         color: "#f59e0b", bg: "rgba(245,158,11,0.10)"  },
  upcoming: { icon: Calendar,      color: "#3b82f6", bg: "rgba(59,130,246,0.10)"  },
  payment:  { icon: CheckCircle2,  color: "#16a34a", bg: "rgba(22,163,74,0.10)"   },
};

// ─── NotificationDropdown ─────────────────────────────────────────────────────

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState(NOTIFICATIONS);
  const unreadCount = items.filter((n) => !n.read).length;

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden z-50"
      style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.05]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#fd7e14" }}>
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 transition-colors text-gray-400">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="max-h-80 overflow-y-auto">
        {items.map((notif) => {
          const cfg = NOTIF_CONFIG[notif.type];
          const Icon = cfg.icon;
          return (
            <Link
              key={notif.id}
              href={notif.href}
              onClick={onClose}
              className={cn(
                "flex items-start gap-3 px-4 py-3 hover:bg-black/[0.03] transition-colors border-b border-black/[0.04] last:border-0",
                !notif.read && "bg-orange-50/40"
              )}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: cfg.bg }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-xs font-semibold text-gray-900 leading-snug", !notif.read && "font-bold")}>
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: "#fd7e14" }} />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{notif.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-black/[0.05]">
        <Link
          href="/invoices"
          onClick={onClose}
          className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors w-full text-center block"
        >
          View all invoices
        </Link>
      </div>
    </div>
  );
}

// ─── TopNavV2 ────────────────────────────────────────────────────────────────

export function TopNavV2() {
  const pathname    = usePathname();
  const router      = useRouter();
  const { profile } = useAuth();
  const [scrolled,   setScrolled]   = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  function isActive(tab: (typeof NAV_TABS)[0]) {
    return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
  }

  const pageKey = Object.keys(PAGE_TITLES).find((k) =>
    k === "/dashboard" ? pathname === k : pathname.startsWith(k)
  );
  const pageTitle   = pageKey ? PAGE_TITLES[pageKey] : "";
  const isDashboard = pathname === "/dashboard";

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header
      className="sticky top-0 z-40 transition-all duration-300"
      style={
        scrolled
          ? {
              background: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderBottom: "1px solid rgba(255,255,255,0.55)",
            }
          : { background: "transparent" }
      }
    >
      {/* ── Row 1: Brand | Centered nav tabs | Icons ── */}
      <div className="relative flex items-center px-10 h-16">

        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0 z-10">
          <Image src="/black-logo.webp" alt="WODO" width={88} height={28} className="object-contain" style={{ height: 22, width: "auto" }} />
        </div>

        {/* Dark pill - absolutely centered */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-1.5 rounded-full"
          style={{ background: "#1e2030" }}
        >
          {NAV_TABS.map((tab) => {
            const active = isActive(tab);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-3.5 py-1 rounded-full text-[12px] font-semibold transition-all duration-150 whitespace-nowrap select-none",
                  active ? "text-white" : "text-gray-400 hover:text-gray-200"
                )}
                style={active ? { background: "#fd7e14" } : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 shrink-0 ml-auto z-10">

          {/* Bell - with dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 rounded-full text-gray-600 hover:bg-black/5 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full border-2 border-white"
                  style={{ background: "#fd7e14" }}
                />
              )}
            </button>
            {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
          </div>

          {/* Settings - links to settings page */}
          <Link
            href="/settings"
            className={cn(
              "p-2 rounded-full text-gray-600 hover:bg-black/5 transition-colors",
              pathname.startsWith("/settings") && "bg-black/5 text-gray-900"
            )}
          >
            <Settings className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-black/10">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: "#fd7e14" }}
            >
              {profile?.full_name?.charAt(0) ?? "S"}
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-full text-gray-400 hover:bg-black/5 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 2: Back + page title (hidden on dashboard) ── */}
      {!isDashboard && (
        <div className="flex items-center px-10 pb-7 pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-full text-gray-500 hover:bg-black/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h1 className="text-[1.75rem] font-bold text-gray-900 leading-none">{pageTitle}</h1>
          </div>
        </div>
      )}
    </header>
  );
}
