"use client";

import { useState } from "react";
import {
  Building2,
  CreditCard,
  Tag,
  User,
  Bell,
  Save,
  Edit2,
  UserPlus,
  Check,
  Layers,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = "company" | "bank" | "invoice" | "users" | "notifications" | "services";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "company",       label: "Company",       icon: Building2 },
  { id: "bank",          label: "Bank Details",  icon: CreditCard },
  { id: "invoice",       label: "Invoice",       icon: Tag },
  { id: "services",      label: "Services",      icon: Layers },
  { id: "users",         label: "Users",         icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
];

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const COMPANY_DEFAULTS = {
  name:     "WODO Digital Private Limited",
  pan:      "AAECW2882M",
  gstin:    "29AAECW2882M1ZW",
  address1: "#1, First Floor, Shree Lakshmi Arcade",
  address2: "BDA Layout, Nagarbhavi",
  city:     "Bangalore",
  state:    "Karnataka",
  pincode:  "560091",
  country:  "India",
  phone:    "+91 63621 80633",
  email:    "accounts@wodo.digital",
  website:  "wodo.digital",
};

interface BankAccount {
  id: string;
  title: string;
  fields: { key: string; label: string; value: string; mono?: boolean }[];
}

const BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "gst",
    title: "Indian GST Account",
    fields: [
      { key: "beneficiary", label: "Beneficiary Name",  value: "WODO Digital Pvt Ltd" },
      { key: "bank",        label: "Bank",              value: "IDFC FIRST" },
      { key: "account",     label: "Account Number",    value: "10213871315",   mono: true },
      { key: "ifsc",        label: "IFSC Code",         value: "IDFB0081105",   mono: true },
    ],
  },
  {
    id: "usa",
    title: "USA Account (via Skydo)",
    fields: [
      { key: "beneficiary", label: "Beneficiary Name",  value: "WODO Digital Pvt Ltd" },
      { key: "method",      label: "Transfer Method",   value: "ACH" },
      { key: "routing",     label: "ACH Routing Number",value: "026015422",     mono: true },
      { key: "account",     label: "Account Number",    value: "8328215937",    mono: true },
    ],
  },
  {
    id: "uae",
    title: "UAE Account (via Skydo)",
    fields: [
      { key: "beneficiary", label: "Beneficiary Name",  value: "WODO Digital Pvt Ltd" },
      { key: "iban",        label: "IBAN",              value: "AE330860000009668684003", mono: true },
      { key: "bic",         label: "BIC / SWIFT",       value: "WIOBAEADXXX",            mono: true },
    ],
  },
  {
    id: "nongst",
    title: "Non-GST Account",
    fields: [
      { key: "name",    label: "Account Holder", value: "Shyam Singh Bhati" },
      { key: "bank",    label: "Bank",           value: "IDFC FIRST" },
      { key: "account", label: "Account Number", value: "10221086461",   mono: true },
      { key: "ifsc",    label: "IFSC Code",      value: "IDFB0081105",   mono: true },
      { key: "swift",   label: "SWIFT Code",     value: "IDFBINBBMUM",   mono: true },
      { key: "branch",  label: "Branch",         value: "BANGALORE-JP NAGAR 5TH PHASE BRANCH" },
      { key: "gpay",    label: "G-Pay Number",   value: "9535743993",    mono: true },
    ],
  },
];

const NOTIFICATION_ITEMS = [
  { id: "invoice_viewed",   label: "Email on invoice viewed",            desc: "Get notified when a client opens your invoice",            default: true  },
  { id: "payment_received", label: "Email on payment received",          desc: "Confirmation when a payment is recorded",                  default: true  },
  { id: "overdue_7",        label: "Email on invoice overdue (7 days)",  desc: "Alert when an invoice is 7 days past due",                 default: true  },
  { id: "overdue_30",       label: "Email on invoice overdue (30 days)", desc: "Escalation when an invoice is 30 days past due",           default: true  },
  { id: "weekly_summary",   label: "Weekly financial summary",           desc: "A digest of all transactions and outstanding amounts",      default: false },
  { id: "monthly_report",   label: "Monthly investor report reminder",   desc: "Reminder to generate and send the monthly report",         default: true  },
];

// ---------------------------------------------------------------------------
// Services data
// ---------------------------------------------------------------------------

const PRESET_COLORS = [
  "#fd7e14", "#f59e0b", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
  "#f97316", "#6366f1", "#ef4444", "#9ca3af",
];

interface Service {
  id: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
  projects: number;
  line_items: number;
}

const INITIAL_SERVICES: Service[] = [
  { id: "s1", name: "SEO",                description: "Search engine optimisation and organic ranking",    color: "#fd7e14", active: true,  projects: 3, line_items: 12 },
  { id: "s2", name: "Google My Business", description: "GMB profile setup, posts, and review management",  color: "#f59e0b", active: true,  projects: 1, line_items: 4  },
  { id: "s3", name: "Web Development",    description: "Website design, development, and deployment",      color: "#3b82f6", active: true,  projects: 2, line_items: 6  },
  { id: "s4", name: "Branding",           description: "Brand identity, logo design, and brand guidelines",color: "#8b5cf6", active: true,  projects: 1, line_items: 2  },
  { id: "s5", name: "Google Ads",         description: "Paid search and display advertising management",   color: "#22c55e", active: true,  projects: 1, line_items: 3  },
  { id: "s6", name: "Social Media",       description: "Social media strategy, content, and management",   color: "#ec4899", active: false, projects: 0, line_items: 0  },
  { id: "s7", name: "UI/UX Design",       description: "User interface and experience design",             color: "#06b6d4", active: false, projects: 0, line_items: 0  },
  { id: "s8", name: "Content Marketing",  description: "Content strategy, creation, and distribution",    color: "#84cc16", active: false, projects: 0, line_items: 0  },
];

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">{children}</label>
  );
}

function SaveButton({ saved, onClick }: { saved: boolean; onClick?: () => void }) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-300"
      style={{ background: saved ? "#16a34a" : "linear-gradient(135deg, #fd7e14, #e8720f)" }}
    >
      {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {saved ? "Saved!" : "Save Changes"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tab: Company
// ---------------------------------------------------------------------------

function CompanyTab() {
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <GlassCard padding="lg">
      <h3 className="text-sm font-semibold text-text-primary mb-6">Company Information</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <FieldLabel>Company Name</FieldLabel>
          <input type="text" defaultValue={COMPANY_DEFAULTS.name} className="glass-input" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>PAN</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.pan} className="glass-input font-sans tracking-widest" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>GSTIN</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.gstin} className="glass-input font-sans tracking-widest" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Address Line 1</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.address1} className="glass-input" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Address Line 2</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.address2} className="glass-input" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>City</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.city} className="glass-input" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>State</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.state} className="glass-input" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Pincode</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.pincode} className="glass-input font-sans" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Country</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.country} className="glass-input" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Phone</FieldLabel>
            <input type="tel" defaultValue={COMPANY_DEFAULTS.phone} className="glass-input font-sans" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Email</FieldLabel>
            <input type="email" defaultValue={COMPANY_DEFAULTS.email} className="glass-input" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <FieldLabel>Website</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.website} className="glass-input" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <SaveButton saved={saved} />
        </div>
      </form>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Tab: Bank Details
// ---------------------------------------------------------------------------

function BankTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedId,   setSavedId]   = useState<string | null>(null);

  function handleSave(id: string) {
    setSavedId(id);
    setEditingId(null);
    setTimeout(() => setSavedId(null), 2500);
  }

  return (
    <div className="space-y-4">
      {BANK_ACCOUNTS.map((account) => {
        const isEditing = editingId === account.id;
        const justSaved = savedId  === account.id;

        return (
          <GlassCard key={account.id} padding="lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-text-primary">{account.title}</h3>
              <div className="flex items-center gap-2">
                {justSaved && (
                  <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    Saved
                  </span>
                )}
                {!isEditing ? (
                  <button
                    onClick={() => setEditingId(account.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={() => handleSave(account.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-white transition-colors"
                    style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {account.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <FieldLabel>{field.label}</FieldLabel>
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={field.value}
                      className={cn("glass-input text-sm", field.mono && "font-sans tracking-wide")}
                    />
                  ) : (
                    <p className={cn("text-sm text-text-primary py-2 px-3 rounded-button bg-surface-DEFAULT border border-black/[0.05] break-all", field.mono && "font-sans tracking-wide")}>
                      {field.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Invoice
// ---------------------------------------------------------------------------

function InvoiceTab() {
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <GlassCard padding="lg">
      <h3 className="text-sm font-semibold text-text-primary mb-6">Invoice Settings</h3>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>Invoice Prefix - GST</FieldLabel>
            <input type="text" defaultValue="G" className="glass-input font-sans w-24" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Invoice Prefix - Non-GST</FieldLabel>
            <input type="text" defaultValue="NG" className="glass-input font-sans w-24" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Starting Sequence - GST</FieldLabel>
            <input type="text" value="G00113" readOnly className="glass-input font-sans tabular-nums opacity-60 cursor-not-allowed" />
            <p className="text-xs text-text-muted">Read-only - auto-incremented</p>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Starting Sequence - Non-GST</FieldLabel>
            <input type="text" value="NG00202" readOnly className="glass-input font-sans tabular-nums opacity-60 cursor-not-allowed" />
            <p className="text-xs text-text-muted">Read-only - auto-incremented</p>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Default Due Days</FieldLabel>
            <input type="number" defaultValue={30} className="glass-input font-sans tabular-nums" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Default GST Rate (%)</FieldLabel>
            <input type="number" defaultValue={18} className="glass-input font-sans tabular-nums" />
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Invoice Footer Text</FieldLabel>
          <textarea
            rows={3}
            defaultValue="Payment due within 30 days of invoice date. Late payments attract 2% per month interest. All disputes subject to Bangalore jurisdiction."
            className="glass-input resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <SaveButton saved={saved} onClick={handleSave} />
        </div>
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Tab: Services
// ---------------------------------------------------------------------------

function ServicesTab() {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [adding,   setAdding]   = useState(false);
  const [newName,  setNewName]  = useState("");
  const [newDesc,  setNewDesc]  = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  function addService() {
    if (!newName.trim()) return;
    setServices((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name:        newName.trim(),
        description: newDesc.trim(),
        color:       newColor,
        active:      true,
        projects:    0,
        line_items:  0,
      },
    ]);
    setNewName("");
    setNewDesc("");
    setNewColor(PRESET_COLORS[0]);
    setAdding(false);
  }

  function toggleActive(id: string) {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  }

  function removeService(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* List */}
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Service Catalogue</h3>
            <p className="text-xs text-text-muted mt-0.5">Available in invoice line items and project setup</p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-button text-xs font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Service
          </button>
        </div>

        <div className="divide-y divide-black/[0.05]">
          {services.map((svc) => (
            <div key={svc.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
              {/* Colour swatch */}
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                style={{ background: svc.color }}
              >
                {svc.name.charAt(0)}
              </div>

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", svc.active ? "text-text-primary" : "text-text-muted line-through")}>
                  {svc.name}
                </p>
                {svc.description && (
                  <p className="text-xs text-text-muted mt-0.5 truncate">{svc.description}</p>
                )}
              </div>

              {/* Usage stats */}
              <div className="hidden sm:flex items-center gap-4 shrink-0">
                <span className="text-[11px] text-text-muted whitespace-nowrap">
                  {svc.projects} project{svc.projects !== 1 ? "s" : ""}
                </span>
                <span className="text-[11px] text-text-muted whitespace-nowrap">
                  {svc.line_items} line item{svc.line_items !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Active toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={svc.active}
                onClick={() => toggleActive(svc.id)}
                className={cn(
                  "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 focus:outline-none",
                  svc.active ? "bg-accent" : "bg-black/[0.10]"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                    svc.active ? "right-0.5" : "left-0.5"
                  )}
                />
              </button>

              {/* Delete */}
              <button
                onClick={() => removeService(svc.id)}
                disabled={svc.projects > 0 || svc.line_items > 0}
                title={svc.projects > 0 || svc.line_items > 0 ? "Cannot delete - service is in use" : "Delete service"}
                className="p-1.5 rounded-button text-text-muted hover:text-red-400 hover:bg-red-400/[0.08] transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Add service modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => { setAdding(false); setNewName(""); setNewDesc(""); setNewColor(PRESET_COLORS[0]); }}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-card shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-text-primary">New Service</h3>
              <button
                type="button"
                onClick={() => { setAdding(false); setNewName(""); setNewDesc(""); setNewColor(PRESET_COLORS[0]); }}
                className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Service Name *</FieldLabel>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addService()}
                  placeholder="e.g. Performance Marketing"
                  className="glass-input"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Description</FieldLabel>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Short description (optional)"
                  className="glass-input"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Colour</FieldLabel>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all duration-150",
                        newColor === c
                          ? "ring-2 ring-offset-2 ring-black/20 scale-110"
                          : "opacity-60 hover:opacity-100 hover:scale-105"
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setAdding(false); setNewName(""); setNewDesc(""); setNewColor(PRESET_COLORS[0]); }}
                  className="px-4 py-2 rounded-button text-sm text-text-secondary hover:text-text-primary border border-black/[0.05] bg-surface-DEFAULT transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addService}
                  disabled={!newName.trim()}
                  className="px-5 py-2 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Users
// ---------------------------------------------------------------------------

const ROLE_DEFINITIONS = [
  { role: "admin",     label: "Admin",     color: "bg-accent/10 text-accent border-accent/20",                        description: "Full access to all features, settings, and user management." },
  { role: "manager",   label: "Manager",   color: "bg-blue-500/10 text-blue-400 border-blue-500/20",                  description: "Can manage clients, projects, invoices, and expenses. Cannot manage users or settings." },
  { role: "accountant",label: "Accountant",color: "bg-purple-500/10 text-purple-400 border-purple-500/20",            description: "Read-only access to invoices, payments, and expenses. Can record payments." },
  { role: "viewer",    label: "Viewer",    color: "bg-surface-DEFAULT text-text-muted border-black/[0.08]",           description: "Read-only access to all data. Cannot create or modify any records." },
];

function UsersTab() {
  const users = [
    { name: "Shyam Singh Bhati", email: "accounts@wodo.digital", role: "admin", status: "Active" },
  ];

  return (
    <div className="space-y-5">
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-text-primary">Team Members</h3>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-button text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.05]">
                <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
                <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Email</th>
                <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Role</th>
                <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                <th className="pb-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleDef = ROLE_DEFINITIONS.find((r) => r.role === user.role);
                return (
                  <tr key={user.email} className="border-b border-black/[0.05] last:border-0">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-text-primary whitespace-nowrap">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-sm text-text-secondary">{user.email}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", roleDef?.color ?? "bg-surface-DEFAULT text-text-muted border-black/[0.08]")}>
                        {roleDef?.label ?? user.role}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-xs text-text-muted hover:text-text-secondary transition-colors px-2 py-1 rounded-button hover:bg-surface-DEFAULT">
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard padding="lg">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Role Permissions</h3>
        <div className="space-y-3">
          {ROLE_DEFINITIONS.map((r) => (
            <div key={r.role} className="flex items-start gap-3">
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 mt-0.5", r.color)}>
                {r.label}
              </span>
              <p className="text-sm text-text-secondary">{r.description}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Notifications
// ---------------------------------------------------------------------------

function NotificationsTab() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_ITEMS.map((item) => [item.id, item.default]))
  );

  function toggle(id: string) {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <GlassCard padding="lg">
      <h3 className="text-sm font-semibold text-text-primary mb-6">Notification Preferences</h3>
      <div className="divide-y divide-black/[0.05]">
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
            <div className="pr-6">
              <p className="text-sm font-medium text-text-primary">{item.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled[item.id]}
              onClick={() => toggle(item.id)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none",
                enabled[item.id] ? "bg-accent" : "bg-black/[0.08]"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                  enabled[item.id] ? "right-1" : "left-1"
                )}
              />
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("company");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Settings"
        description="Configure company information, bank accounts, and preferences"
      />

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
          {activeTab === "users"         && <UsersTab />}
          {activeTab === "notifications" && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}
