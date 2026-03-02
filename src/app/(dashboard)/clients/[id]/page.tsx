"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, Building2,
  FileText, CreditCard, FolderKanban, Edit, Plus
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

const CLIENT_DATA: Record<string, {
  id: string;
  company_name: string;
  display_name: string;
  client_type: string;
  region: string;
  currency: "INR" | "USD" | "AED" | "GBP";
  address: string;
  city: string;
  country: string;
  gstin?: string;
  health_score: number;
  status: "active" | "inactive" | "churned";
  contacts: Array<{ name: string; email: string; phone: string; designation: string; is_primary: boolean }>;
  projects: Array<{ id: string; name: string; type: string; status: "active_execution" | "completed" | "design_phase" | "development_phase"; value: string }>;
  invoices: Array<{ id: string; number: string; amount: number; status: "paid" | "sent" | "draft" | "overdue"; date: string }>;
  total_invoiced: number;
  total_received: number;
}> = {
  "11111111-0000-0000-0000-000000000001": {
    id: "11111111-0000-0000-0000-000000000001",
    company_name: "Nandhini Deluxe Hotel",
    display_name: "Nandhini Hotel",
    client_type: "Indian GST",
    region: "India",
    currency: "INR",
    address: "No. 45, Brigade Road, Shivajinagar",
    city: "Bangalore",
    country: "India",
    gstin: "29AAACN1234F1ZP",
    health_score: 82,
    status: "active",
    contacts: [
      { name: "Ramesh Kumar", email: "ramesh@nandhinideluxe.com", phone: "+91 98451 23456", designation: "Managing Director", is_primary: true },
      { name: "Sunita Iyer", email: "accounts@nandhinideluxe.com", phone: "+91 98451 23457", designation: "Accounts Manager", is_primary: false },
    ],
    projects: [
      { id: "aaaaaaaa-0000-0000-0000-000000000001", name: "SEO & GMB Retainer", type: "SEO", status: "active_execution", value: "Rs.65,000/mo" },
    ],
    invoices: [
      { id: "bbbbbbbb-0000-0000-0000-000000000009", number: "G00107", amount: 76700, status: "paid", date: "2026-01-01" },
      { id: "bbbbbbbb-0000-0000-0000-000000000001", number: "G00110", amount: 76700, status: "paid", date: "2026-02-01" },
      { id: "bbbbbbbb-0000-0000-0000-000000000002", number: "G00111", amount: 76700, status: "sent", date: "2026-03-01" },
    ],
    total_invoiced: 921900,
    total_received: 845200,
  },
};

const TABS = ["Overview", "Projects", "Invoices", "Payments"];

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("Overview");

  const client = CLIENT_DATA[id] ?? {
    id,
    company_name: "Client",
    display_name: "Client",
    client_type: "Indian GST",
    region: "India",
    currency: "INR" as const,
    address: "Bangalore",
    city: "Bangalore",
    country: "India",
    health_score: 70,
    status: "active" as const,
    contacts: [],
    projects: [],
    invoices: [],
    total_invoiced: 0,
    total_received: 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + header */}
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
              style={{ background: "rgba(253,126,20,0.15)", border: "1px solid rgba(253,126,20,0.2)" }}
            >
              {client.company_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{client.display_name}</h1>
              <p className="text-sm text-text-muted">{client.company_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={client.status} />
            <Link
              href={`/clients/${id}/edit`}
              className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-white/5 transition-all duration-150"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard padding="md">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Invoiced</p>
          <CurrencyDisplay amount={client.total_invoiced} currency={client.currency} size="md" />
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Received</p>
          <CurrencyDisplay amount={client.total_received} currency={client.currency} size="md" className="text-green-400" />
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Balance Due</p>
          <CurrencyDisplay amount={client.total_invoiced - client.total_received} currency={client.currency} size="md" className="text-yellow-400" />
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Health Score</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${client.health_score}%`,
                  backgroundColor: client.health_score >= 80 ? "#22c55e" : client.health_score >= 60 ? "#eab308" : "#ef4444",
                }}
              />
            </div>
            <span className="text-sm font-bold font-mono text-text-primary">{client.health_score}</span>
          </div>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-white/5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all duration-150 border-b-2 -mb-px",
                activeTab === tab
                  ? "text-accent border-accent"
                  : "text-text-muted hover:text-text-secondary border-transparent"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "Overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client details */}
              <GlassCard padding="md">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Company Details</h3>
                <div className="space-y-3">
                  {[
                    { icon: Building2, label: "Type", value: client.client_type },
                    { icon: MapPin, label: "Location", value: `${client.city}, ${client.country}` },
                    { icon: Globe, label: "Currency", value: client.currency },
                    ...(client.gstin ? [{ icon: FileText, label: "GSTIN", value: client.gstin }] : []),
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-xs text-text-muted w-20 shrink-0">{label}</span>
                      <span className="text-sm text-text-secondary font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>

              {/* Contacts */}
              <GlassCard padding="md">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Contacts</h3>
                <div className="space-y-4">
                  {client.contacts.map((contact) => (
                    <div key={contact.email} className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-button flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        {contact.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary">{contact.name}</p>
                          {contact.is_primary && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-accent-muted text-accent">Primary</span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted">{contact.designation}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors">
                            <Mail className="w-3 h-3" /> {contact.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors">
                            <Phone className="w-3 h-3" /> {contact.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === "Projects" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Link
                  href="/projects/new"
                  className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </Link>
              </div>
              {client.projects.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-sm">No projects yet</div>
              ) : (
                client.projects.map((project) => (
                  <GlassCard key={project.id} padding="md" className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FolderKanban className="w-4 h-4 text-text-muted" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{project.name}</p>
                        <p className="text-xs text-text-muted">{project.type} - {project.value}</p>
                      </div>
                    </div>
                    <StatusBadge status={project.status} />
                  </GlassCard>
                ))
              )}
            </div>
          )}

          {activeTab === "Invoices" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Link
                  href="/invoices/new"
                  className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Invoice
                </Link>
              </div>
              {client.invoices.length === 0 ? (
                <div className="text-center py-12 text-text-muted text-sm">No invoices yet</div>
              ) : (
                <GlassCard padding="none">
                  {client.invoices.map((invoice, idx) => (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className={cn(
                        "flex items-center justify-between px-5 py-4 hover:bg-surface-DEFAULT transition-colors",
                        idx < client.invoices.length - 1 && "border-b border-white/5"
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary font-mono">{invoice.number}</p>
                        <p className="text-xs text-text-muted">{formatDate(invoice.date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <CurrencyDisplay amount={invoice.amount} currency={client.currency} size="sm" />
                        <StatusBadge status={invoice.status} />
                      </div>
                    </Link>
                  ))}
                </GlassCard>
              )}
            </div>
          )}

          {activeTab === "Payments" && (
            <div className="text-center py-12 text-text-muted text-sm">
              Payment history will appear here.
              <br />
              <Link href="/payments" className="text-accent hover:text-accent-hover text-sm mt-2 inline-block">
                View all payments
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
