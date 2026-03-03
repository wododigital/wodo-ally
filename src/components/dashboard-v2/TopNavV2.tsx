"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, Settings, LogOut, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { useEffect, useState } from "react";

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

export function TopNavV2() {
  const pathname    = usePathname();
  const router      = useRouter();
  const { profile } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function isActive(tab: (typeof NAV_TABS)[0]) {
    return tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
  }

  const pageKey = Object.keys(PAGE_TITLES).find((k) =>
    k === "/dashboard" ? pathname === k : pathname.startsWith(k)
  );
  const pageTitle   = pageKey ? PAGE_TITLES[pageKey] : "";
  const isDashboard = pathname === "/dashboard";

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

        {/* Dark pill — absolutely centered */}
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
          <button className="p-2 rounded-full text-gray-600 hover:bg-black/5 transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-full text-gray-600 hover:bg-black/5 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
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

      {/* ── Row 2: Back + page title (hidden on dashboard — hero handles that) ── */}
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
