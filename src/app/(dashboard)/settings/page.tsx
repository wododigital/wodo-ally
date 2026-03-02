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
} from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = "company" | "bank" | "invoice" | "users" | "notifications";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "bank", label: "Bank Details", icon: CreditCard },
  { id: "invoice", label: "Invoice", icon: Tag },
  { id: "users", label: "Users", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
];

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const COMPANY_DEFAULTS = {
  name: "WODO Digital Private Limited",
  pan: "AAECW2882M",
  gstin: "29AAECW2882M1ZW",
  address1: "#1, First Floor, Shree Lakshmi Arcade",
  address2: "BDA Layout, Nagarbhavi",
  city: "Bangalore",
  state: "Karnataka",
  pincode: "560091",
  country: "India",
  phone: "+91 63621 80633",
  email: "accounts@wodo.digital",
  website: "wodo.digital",
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
      { key: "beneficiary", label: "Beneficiary Name", value: "WODO Digital Pvt Ltd" },
      { key: "bank", label: "Bank", value: "IDFC FIRST" },
      { key: "account", label: "Account Number", value: "10213871315", mono: true },
      { key: "ifsc", label: "IFSC Code", value: "IDFB0081105", mono: true },
    ],
  },
  {
    id: "usa",
    title: "USA Account (via Skydo)",
    fields: [
      { key: "beneficiary", label: "Beneficiary Name", value: "WODO Digital Pvt Ltd" },
      { key: "method", label: "Transfer Method", value: "ACH" },
      { key: "routing", label: "ACH Routing Number", value: "026015422", mono: true },
      { key: "account", label: "Account Number", value: "8328215937", mono: true },
    ],
  },
  {
    id: "uae",
    title: "UAE Account (via Skydo)",
    fields: [
      { key: "beneficiary", label: "Beneficiary Name", value: "WODO Digital Pvt Ltd" },
      { key: "iban", label: "IBAN", value: "AE330860000009668684003", mono: true },
      { key: "bic", label: "BIC / SWIFT", value: "WIOBAEADXXX", mono: true },
    ],
  },
  {
    id: "nongst",
    title: "Non-GST Account",
    fields: [
      { key: "name", label: "Account Holder", value: "Shyam Singh Bhati" },
      { key: "bank", label: "Bank", value: "IDFC FIRST" },
      { key: "account", label: "Account Number", value: "10221086461", mono: true },
      { key: "ifsc", label: "IFSC Code", value: "IDFB0081105", mono: true },
      { key: "swift", label: "SWIFT Code", value: "IDFBINBBMUM", mono: true },
      { key: "branch", label: "Branch", value: "BANGALORE-JP NAGAR 5TH PHASE BRANCH" },
      { key: "gpay", label: "G-Pay Number", value: "9535743993", mono: true },
    ],
  },
];

const NOTIFICATION_ITEMS = [
  { id: "invoice_viewed", label: "Email on invoice viewed", desc: "Get notified when a client opens your invoice", default: true },
  { id: "payment_received", label: "Email on payment received", desc: "Confirmation when a payment is recorded", default: true },
  { id: "overdue_7", label: "Email on invoice overdue (7 days)", desc: "Alert when an invoice is 7 days past due", default: true },
  { id: "overdue_30", label: "Email on invoice overdue (30 days)", desc: "Escalation when an invoice is 30 days past due", default: true },
  { id: "weekly_summary", label: "Weekly financial summary", desc: "A digest of all transactions and outstanding amounts", default: false },
  { id: "monthly_report", label: "Monthly investor report reminder", desc: "Reminder to generate and send the monthly report", default: true },
];

// ---------------------------------------------------------------------------
// Sub-components
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
      style={{ background: saved ? "#22c55e" : "linear-gradient(135deg, #fd7e14, #e8720f)" }}
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
        {/* Full-width: Company Name */}
        <div className="space-y-1.5">
          <FieldLabel>Company Name</FieldLabel>
          <input type="text" defaultValue={COMPANY_DEFAULTS.name} className="glass-input" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* PAN */}
          <div className="space-y-1.5">
            <FieldLabel>PAN</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.pan} className="glass-input font-mono tracking-widest" />
          </div>
          {/* GSTIN */}
          <div className="space-y-1.5">
            <FieldLabel>GSTIN</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.gstin} className="glass-input font-mono tracking-widest" />
          </div>

          {/* Address Line 1 */}
          <div className="space-y-1.5">
            <FieldLabel>Address Line 1</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.address1} className="glass-input" />
          </div>
          {/* Address Line 2 */}
          <div className="space-y-1.5">
            <FieldLabel>Address Line 2</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.address2} className="glass-input" />
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <FieldLabel>City</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.city} className="glass-input" />
          </div>
          {/* State */}
          <div className="space-y-1.5">
            <FieldLabel>State</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.state} className="glass-input" />
          </div>

          {/* Pincode */}
          <div className="space-y-1.5">
            <FieldLabel>Pincode</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.pincode} className="glass-input font-mono" />
          </div>
          {/* Country */}
          <div className="space-y-1.5">
            <FieldLabel>Country</FieldLabel>
            <input type="text" defaultValue={COMPANY_DEFAULTS.country} className="glass-input" />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <FieldLabel>Phone</FieldLabel>
            <input type="tel" defaultValue={COMPANY_DEFAULTS.phone} className="glass-input font-mono" />
          </div>
          {/* Email */}
          <div className="space-y-1.5">
            <FieldLabel>Email</FieldLabel>
            <input type="email" defaultValue={COMPANY_DEFAULTS.email} className="glass-input" />
          </div>

          {/* Website */}
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
  const [savedId, setSavedId] = useState<string | null>(null);

  function handleSave(id: string) {
    setSavedId(id);
    setEditingId(null);
    setTimeout(() => setSavedId(null), 2500);
  }

  return (
    <div className="space-y-4">
      {BANK_ACCOUNTS.map((account) => {
        const isEditing = editingId === account.id;
        const justSaved = savedId === account.id;

        return (
          <GlassCard key={account.id} padding="lg">
            {/* Card header */}
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-white/5 hover:border-white/15 hover:text-text-primary transition-all"
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

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {account.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <FieldLabel>{field.label}</FieldLabel>
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={field.value}
                      className={cn("glass-input text-sm", field.mono && "font-mono tracking-wide")}
                    />
                  ) : (
                    <p className={cn("text-sm text-text-primary py-2 px-3 rounded-button bg-surface-DEFAULT border border-white/5 break-all", field.mono && "font-mono tracking-wide")}>
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
          {/* GST Prefix */}
          <div className="space-y-1.5">
            <FieldLabel>Invoice Prefix - GST</FieldLabel>
            <input type="text" defaultValue="G" className="glass-input font-mono w-24" />
          </div>
          {/* Non-GST Prefix */}
          <div className="space-y-1.5">
            <FieldLabel>Invoice Prefix - Non-GST</FieldLabel>
            <input type="text" defaultValue="NG" className="glass-input font-mono w-24" />
          </div>

          {/* GST Sequence */}
          <div className="space-y-1.5">
            <FieldLabel>Starting Sequence - GST</FieldLabel>
            <input
              type="text"
              value="G00113"
              readOnly
              className="glass-input font-mono tabular-nums opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-text-muted">Read-only - auto-incremented</p>
          </div>
          {/* Non-GST Sequence */}
          <div className="space-y-1.5">
            <FieldLabel>Starting Sequence - Non-GST</FieldLabel>
            <input
              type="text"
              value="NG00202"
              readOnly
              className="glass-input font-mono tabular-nums opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-text-muted">Read-only - auto-incremented</p>
          </div>

          {/* Default due days */}
          <div className="space-y-1.5">
            <FieldLabel>Default Due Days</FieldLabel>
            <input type="number" defaultValue={30} className="glass-input font-mono tabular-nums" />
          </div>
          {/* Default GST rate */}
          <div className="space-y-1.5">
            <FieldLabel>Default GST Rate (%)</FieldLabel>
            <input type="number" defaultValue={18} className="glass-input font-mono tabular-nums" />
          </div>
        </div>

        {/* Invoice footer */}
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
// Tab: Users
// ---------------------------------------------------------------------------

function UsersTab() {
  const users = [
    { name: "Shyam Singh Bhati", email: "accounts@wodo.digital", role: "Admin", status: "Active" },
  ];

  return (
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

      {/* Table header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
              <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Email</th>
              <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Role</th>
              <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
              <th className="pb-3 w-16" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.email} className="border-b border-white/5 last:border-0">
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
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                    {user.role}
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
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
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
      <div className="divide-y divide-white/5">
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
            <div className="pr-6">
              <p className="text-sm font-medium text-text-primary">{item.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
            </div>
            {/* Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={enabled[item.id]}
              onClick={() => toggle(item.id)}
              className={cn(
                "relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-accent/40",
                enabled[item.id] ? "bg-accent" : "bg-white/10"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                  enabled[item.id] ? "translate-x-5" : "translate-x-1"
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
                    : "text-text-secondary hover:text-text-primary hover:bg-white/4 border border-transparent"
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
          {activeTab === "company" && <CompanyTab />}
          {activeTab === "bank" && <BankTab />}
          {activeTab === "invoice" && <InvoiceTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "notifications" && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}
