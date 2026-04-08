"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  CreditCard,
  Tag,
  User,
  Bell,
  Layers,
  Mail,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  CompanyTab,
  BankTab,
  InvoiceTab,
  ServicesTab,
  EmailTemplatesTab,
  ContractsTab,
  UsersTab,
  NotificationsTab,
} from "./tabs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = "company" | "bank" | "invoice" | "services" | "users" | "notifications" | "email" | "contracts";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "company",       label: "Company",          icon: Building2  },
  { id: "bank",          label: "Bank Details",     icon: CreditCard },
  { id: "invoice",       label: "Invoice",          icon: Tag        },
  { id: "services",      label: "Services",         icon: Layers     },
  { id: "email",         label: "Email Templates",  icon: Mail       },
  { id: "contracts",     label: "Contracts",        icon: FileText   },
  { id: "users",         label: "Users",            icon: User       },
  { id: "notifications", label: "Notifications",    icon: Bell       },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("company");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="sm:w-48 shrink-0 space-y-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-black/[0.04] animate-pulse" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <div className="glass-card p-6 space-y-4">
              <div className="h-5 w-40 rounded bg-black/[0.04] animate-pulse" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-black/[0.04] animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <nav className="sm:w-48 shrink-0">
          <div className="flex sm:flex-col flex-row gap-1 overflow-x-auto pb-1 sm:pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-150 sm:w-full",
                  activeTab === tab.id
                    ? "bg-accent/10 text-accent font-semibold border border-accent/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-black/[0.03] border border-transparent"
                )}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          {activeTab === "company"       && <CompanyTab />}
          {activeTab === "bank"          && <BankTab />}
          {activeTab === "invoice"       && <InvoiceTab />}
          {activeTab === "services"      && <ServicesTab />}
          {activeTab === "email"         && <EmailTemplatesTab />}
          {activeTab === "contracts"     && <ContractsTab />}
          {activeTab === "users"         && <UsersTab />}
          {activeTab === "notifications" && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}
