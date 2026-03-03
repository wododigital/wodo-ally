"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, Building2,
  FileText, CreditCard, FolderKanban, Edit, Plus,
  CheckCircle2, AlertCircle, XCircle, Calendar,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

// ─── Mock data ────────────────────────────────────────────────────────────────

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
  status: "active" | "inactive" | "churned" | "closed";
  billing_day?: number;
  contacts: Array<{ name: string; email: string; phone: string; designation: string; is_primary: boolean }>;
  projects: Array<{ id: string; name: string; type: string; status: "active_execution" | "completed" | "design_phase" | "development_phase"; value: string; engagement: "retainer" | "one_time" }>;
  invoices: Array<{ id: string; number: string; amount: number; status: "paid" | "sent" | "draft" | "overdue"; date: string }>;
  payments: Array<{ invoice: string; date: string; amount: number; method: string; reference: string; tds: number; notes: string }>;
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
    billing_day: 1,
    contacts: [
      { name: "Ramesh Kumar", email: "ramesh@nandhinideluxe.com", phone: "+91 98451 23456", designation: "Managing Director", is_primary: true },
      { name: "Sunita Iyer", email: "accounts@nandhinideluxe.com", phone: "+91 98451 23457", designation: "Accounts Manager", is_primary: false },
    ],
    projects: [
      { id: "aaaaaaaa-0000-0000-0000-000000000001", name: "SEO & GMB Retainer", type: "SEO", status: "active_execution", value: "Rs.65,000/mo", engagement: "retainer" },
    ],
    invoices: [
      { id: "bbbbbbbb-0000-0000-0000-000000000009", number: "G00107", amount: 76700, status: "paid", date: "2026-01-01" },
      { id: "bbbbbbbb-0000-0000-0000-000000000001", number: "G00110", amount: 76700, status: "paid", date: "2026-02-01" },
      { id: "bbbbbbbb-0000-0000-0000-000000000002", number: "G00111", amount: 76700, status: "sent", date: "2026-03-01" },
    ],
    payments: [
      { invoice: "G00110", date: "2026-02-10", amount: 76700, method: "Bank Transfer (NEFT)", reference: "NEFT2026021001234", tds: 0, notes: "Full payment received" },
      { invoice: "G00107", date: "2026-01-10", amount: 76700, method: "Bank Transfer (NEFT)", reference: "NEFT2026011001234", tds: 0, notes: "Full payment" },
    ],
    total_invoiced: 921900,
    total_received: 153400,
  },
  "22222222-0000-0000-0000-000000000002": {
    id: "22222222-0000-0000-0000-000000000002",
    company_name: "Maximus OIGA",
    display_name: "Maximus",
    client_type: "Indian GST",
    region: "India",
    currency: "INR",
    address: "78, Residency Road",
    city: "Bangalore",
    country: "India",
    gstin: "29AABCM5678K1ZX",
    health_score: 75,
    status: "active",
    billing_day: 1,
    contacts: [
      { name: "Priya Sharma", email: "finance@maximusoiga.com", phone: "+91 99001 23456", designation: "Finance Manager", is_primary: true },
    ],
    projects: [
      { id: "aaaaaaaa-0000-0000-0000-000000000002", name: "SEO Retainer - Maximus", type: "SEO", status: "active_execution", value: "Rs.50,000/mo", engagement: "retainer" },
    ],
    invoices: [
      { id: "bbbbbbbb-0000-0000-0000-000000000003", number: "G00112", amount: 59000, status: "paid", date: "2026-02-01" },
      { id: "bbbbbbbb-0000-0000-0000-000000000004", number: "G00113", amount: 59000, status: "draft", date: "2026-03-01" },
    ],
    payments: [
      { invoice: "G00112", date: "2026-02-09", amount: 53500, method: "Bank Transfer (NEFT)", reference: "NEFT2026020901234", tds: 5500, notes: "TDS @10% deducted under 194J" },
    ],
    total_invoiced: 590000,
    total_received: 53500,
  },
  "55555555-0000-0000-0000-000000000005": {
    id: "55555555-0000-0000-0000-000000000005",
    company_name: "Sea Wonders Tourism",
    display_name: "Sea Wonders",
    client_type: "International",
    region: "UAE",
    currency: "AED",
    address: "Office 301, Al Garhoud Business Park",
    city: "Dubai",
    country: "UAE",
    health_score: 88,
    status: "active",
    billing_day: 1,
    contacts: [
      { name: "Ahmed Al Rashidi", email: "ahmed@seawonders.ae", phone: "+971 50 123 4567", designation: "CEO", is_primary: true },
    ],
    projects: [
      { id: "aaaaaaaa-0000-0000-0000-000000000004", name: "SEO & Digital Marketing", type: "SEO", status: "active_execution", value: "AED 4,000/mo", engagement: "retainer" },
    ],
    invoices: [
      { id: "bbbbbbbb-0000-0000-0000-000000000006", number: "G00109", amount: 89600, status: "paid", date: "2026-02-01" },
    ],
    payments: [
      { invoice: "G00109", date: "2026-02-18", amount: 89600, method: "Skydo (AED)", reference: "SKYDO-FEB-001", tds: 0, notes: "AED 4,000 via Skydo" },
    ],
    total_invoiced: 357600,
    total_received: 89600,
  },
  "44444444-0000-0000-0000-000000000004": {
    id: "44444444-0000-0000-0000-000000000004",
    company_name: "Dentique Dental Care",
    display_name: "Dentique",
    client_type: "International",
    region: "USA",
    currency: "USD",
    address: "2200 SW Freeway, Suite 510",
    city: "Houston",
    country: "USA",
    health_score: 91,
    status: "active",
    contacts: [
      { name: "Dr. Sarah Mitchell", email: "sarah@dentiquedental.com", phone: "+1 713-555-0123", designation: "Owner", is_primary: true },
    ],
    projects: [
      { id: "aaaaaaaa-0000-0000-0000-000000000003", name: "Website Development", type: "Web Dev", status: "completed", value: "$1,350", engagement: "one_time" },
    ],
    invoices: [
      { id: "bbbbbbbb-0000-0000-0000-000000000005", number: "G00108", amount: 115830, status: "paid", date: "2025-12-01" },
    ],
    payments: [
      { invoice: "G00108", date: "2025-12-18", amount: 115830, method: "Skydo (USD)", reference: "SKYDO-DEC-001", tds: 0, notes: "$1,350 via Skydo" },
    ],
    total_invoiced: 115830,
    total_received: 115830,
  },
  "66666666-0000-0000-0000-000000000006": {
    id: "66666666-0000-0000-0000-000000000006",
    company_name: "Raj Enterprises",
    display_name: "Raj Enterprises",
    client_type: "Non-GST",
    region: "India",
    currency: "INR",
    address: "44, Jayanagar 4th Block",
    city: "Bangalore",
    country: "India",
    health_score: 55,
    status: "active",
    contacts: [
      { name: "Rajesh Patel", email: "rajesh@rajenterprises.in", phone: "+91 98765 43210", designation: "Director", is_primary: true },
    ],
    projects: [
      { id: "aaaaaaaa-0000-0000-0000-000000000006", name: "Website - Raj Enterprises", type: "Web Dev", status: "development_phase", value: "Rs.35,000", engagement: "one_time" },
    ],
    invoices: [
      { id: "bbbbbbbb-0000-0000-0000-000000000007", number: "NG00201", amount: 17500, status: "overdue", date: "2026-02-15" },
    ],
    payments: [],
    total_invoiced: 17500,
    total_received: 0,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getOrdinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

// ─── Close Confirmation Modal ─────────────────────────────────────────────────

function CloseClientModal({
  clientName,
  onConfirm,
  onCancel,
}: {
  clientName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        {/* Icon */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.10)" }}>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Close Client Account</h3>
            <p className="text-sm text-gray-500">{clientName}</p>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
          <p>This will mark <span className="font-semibold text-gray-900">{clientName}</span> as closed.</p>
          <ul className="space-y-1.5 mt-3">
            {[
              "Retainer billing reminders will be stopped",
              "Client will be excluded from active dashboards",
              "All invoices, payments and project history are preserved",
              "You can re-activate this client at any time",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-button text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-button text-sm font-semibold text-white transition-colors"
            style={{ background: "#ef4444" }}
          >
            Close Account
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TABS = ["Overview", "Projects", "Invoices", "Payments"];

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("Overview");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

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
    payments: [],
    total_invoiced: 0,
    total_received: 0,
  };

  const currentStatus = isClosed ? "closed" : client.status;
  const isRetainer = client.projects.some((p) => p.engagement === "retainer");

  return (
    <div className="space-y-6 animate-fade-in">
      {showCloseModal && (
        <CloseClientModal
          clientName={client.display_name}
          onConfirm={() => { setIsClosed(true); setShowCloseModal(false); }}
          onCancel={() => setShowCloseModal(false)}
        />
      )}

      {/* Back + header */}
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-accent"
              style={{ background: "rgba(253,126,20,0.12)", border: "1px solid rgba(253,126,20,0.2)" }}
            >
              {client.company_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{client.display_name}</h1>
              <p className="text-sm text-text-muted">{client.company_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={currentStatus} />
            <Link
              href={`/clients/${id}/edit`}
              className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all duration-150"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            {!isClosed && (
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-all duration-150"
                style={{
                  color: "#ef4444",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <XCircle className="w-4 h-4" />
                Close Client
              </button>
            )}
            {isClosed && (
              <button
                onClick={() => setIsClosed(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-all duration-150"
                style={{
                  color: "#16a34a",
                  background: "rgba(22,163,74,0.06)",
                  border: "1px solid rgba(22,163,74,0.15)",
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Re-activate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Closed banner */}
      {isClosed && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-red-400 font-medium">This client account is closed.</span>
          <span className="text-red-400/70">Billing reminders paused. All history preserved.</span>
        </div>
      )}

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
            <div className="flex-1 h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${client.health_score}%`,
                  backgroundColor: client.health_score >= 80 ? "#16a34a" : client.health_score >= 60 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <span className="text-sm font-bold font-sans text-text-primary">{client.health_score}</span>
          </div>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex border-b border-black/[0.05]">
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
              {/* Company details */}
              <GlassCard padding="md">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Company Details</h3>
                <div className="space-y-3">
                  {[
                    { icon: Building2, label: "Type",     value: client.client_type },
                    { icon: MapPin,    label: "Location", value: `${client.city}, ${client.country}` },
                    { icon: Globe,     label: "Currency", value: client.currency },
                    ...(client.gstin ? [{ icon: FileText, label: "GSTIN", value: client.gstin }] : []),
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="text-xs text-text-muted w-20 shrink-0">{label}</span>
                      <span className="text-sm text-text-secondary font-sans">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Billing schedule - only for retainer clients */}
                {isRetainer && (
                  <div className="mt-5 pt-4 border-t border-black/[0.05]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                        <span className="text-xs text-text-muted w-20 shrink-0">Billing Day</span>
                        {client.billing_day ? (
                          <span className="text-sm font-semibold text-blue-500 font-sans">
                            {getOrdinal(client.billing_day)} of every month
                          </span>
                        ) : (
                          <span className="text-sm text-text-muted italic">Not set</span>
                        )}
                      </div>
                      {client.billing_day && !isClosed && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-blue-500 bg-blue-500/10">
                          Active schedule
                        </span>
                      )}
                      {isClosed && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-gray-400 bg-gray-500/10">
                          Paused
                        </span>
                      )}
                    </div>
                    {client.billing_day && !isClosed && (
                      <p className="text-xs text-text-muted mt-2 ml-6">
                        Next invoice reminder: <span className="font-medium text-text-secondary">Apr {client.billing_day}, 2026</span>
                      </p>
                    )}
                  </div>
                )}
              </GlassCard>

              {/* Contacts */}
              <GlassCard padding="md">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Contacts</h3>
                <div className="space-y-4">
                  {client.contacts.map((contact) => (
                    <div key={contact.email} className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-button flex items-center justify-center text-xs font-bold text-accent shrink-0"
                        style={{ background: "rgba(253,126,20,0.12)" }}
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
                        <p className="text-xs text-text-muted">
                          {project.type} - {project.value}
                          {project.engagement === "retainer" && (
                            <span className="ml-2 text-blue-500">Retainer</span>
                          )}
                        </p>
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
                        idx < client.invoices.length - 1 && "border-b border-black/[0.05]"
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary font-sans">{invoice.number}</p>
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <GlassCard padding="md">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Invoiced</p>
                  <CurrencyDisplay amount={client.total_invoiced} currency={client.currency} size="md" />
                </GlassCard>
                <GlassCard padding="md">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Received</p>
                  <CurrencyDisplay amount={client.payments.reduce((s, p) => s + p.amount, 0)} currency={client.currency} size="md" className="text-green-400" />
                </GlassCard>
                <GlassCard padding="md">
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Balance Due</p>
                  <CurrencyDisplay
                    amount={client.total_invoiced - client.payments.reduce((s, p) => s + p.amount, 0)}
                    currency={client.currency}
                    size="md"
                    className="text-yellow-400"
                  />
                </GlassCard>
              </div>

              {client.payments.length === 0 ? (
                <GlassCard padding="md">
                  <div className="flex flex-col items-center py-10 text-center">
                    <CreditCard className="w-8 h-8 text-text-muted mb-3" />
                    <p className="text-sm text-text-muted">No payments recorded yet.</p>
                    <Link href="/payments" className="text-accent hover:text-accent-hover text-sm mt-2">
                      View all payments
                    </Link>
                  </div>
                </GlassCard>
              ) : (
                <GlassCard padding="none">
                  {client.payments.map((payment, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-start gap-4 px-5 py-4",
                        idx < client.payments.length - 1 && "border-b border-black/[0.05]"
                      )}
                    >
                      <div
                        className="w-9 h-9 rounded-button flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-text-primary">Invoice {payment.invoice}</p>
                            <p className="text-xs text-text-muted mt-0.5">{payment.method}</p>
                            {payment.reference && (
                              <p className="text-xs text-text-muted font-sans mt-0.5">{payment.reference}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <CurrencyDisplay amount={payment.amount} currency={client.currency} size="sm" className="text-green-400" />
                            <p className="text-xs text-text-muted mt-0.5">{formatDate(payment.date)}</p>
                          </div>
                        </div>
                        {payment.tds > 0 && (
                          <span className="inline-block mt-1.5 text-xs text-yellow-400/80 bg-yellow-500/10 px-2 py-0.5 rounded">
                            TDS deducted: Rs.{payment.tds.toLocaleString("en-IN")}
                          </span>
                        )}
                        {payment.notes && (
                          <p className="text-xs text-text-muted mt-1">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </GlassCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
