"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, XCircle } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";

const CLIENT_DATA: Record<string, {
  company_name: string;
  display_name: string;
  client_type: "indian_gst" | "indian_non_gst" | "international";
  region: string;
  currency: string;
  gstin?: string;
  address: string;
  city: string;
  country: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  website: string;
  billing_day?: number;
  engagement_type?: "retainer" | "one_time";
}> = {
  "11111111-0000-0000-0000-000000000001": {
    company_name: "Nandhini Deluxe Hotel",
    display_name: "Nandhini Hotel",
    client_type: "indian_gst",
    region: "india",
    currency: "INR",
    gstin: "29AAACN1234F1ZP",
    address: "No. 45, Brigade Road, Shivajinagar",
    city: "Bangalore",
    country: "India",
    contact_name: "Ramesh Kumar",
    contact_phone: "+91 98451 23456",
    contact_email: "accounts@nandhinideluxe.com",
    website: "nandhinideluxe.com",
    billing_day: 1,
    engagement_type: "retainer",
  },
  "22222222-0000-0000-0000-000000000002": {
    company_name: "Maximus OIGA",
    display_name: "Maximus",
    client_type: "indian_gst",
    region: "india",
    currency: "INR",
    gstin: "29AABCM5678K1ZX",
    address: "78, Residency Road",
    city: "Bangalore",
    country: "India",
    contact_name: "Priya Sharma",
    contact_phone: "+91 99001 23456",
    contact_email: "finance@maximusoiga.com",
    website: "maximusoiga.com",
    billing_day: 1,
    engagement_type: "retainer",
  },
  "33333333-0000-0000-0000-000000000003": {
    company_name: "Godavari Heritage Hotels",
    display_name: "Godavari Heritage",
    client_type: "indian_gst",
    region: "india",
    currency: "INR",
    gstin: "29AABCG9012L1ZM",
    address: "12, MG Road",
    city: "Bangalore",
    country: "India",
    contact_name: "Venkat Rao",
    contact_phone: "+91 97000 12345",
    contact_email: "billing@godavariheritage.com",
    website: "godavariheritage.com",
  },
  "44444444-0000-0000-0000-000000000004": {
    company_name: "Dentique Dental Care",
    display_name: "Dentique",
    client_type: "international",
    region: "usa",
    currency: "USD",
    address: "2200 SW Freeway, Suite 510",
    city: "Houston",
    country: "USA",
    contact_name: "Dr. Sarah Mitchell",
    contact_phone: "+1 713-555-0123",
    contact_email: "sarah@dentiquedental.com",
    website: "dentiquedental.com",
  },
  "55555555-0000-0000-0000-000000000005": {
    company_name: "Sea Wonders Tourism",
    display_name: "Sea Wonders",
    client_type: "international",
    region: "uae",
    currency: "AED",
    address: "Office 301, Al Garhoud Business Park",
    city: "Dubai",
    country: "UAE",
    contact_name: "Ahmed Al Rashidi",
    contact_phone: "+971 50 123 4567",
    contact_email: "ahmed@seawonders.ae",
    website: "seawonders.ae",
  },
  "66666666-0000-0000-0000-000000000006": {
    company_name: "Raj Enterprises",
    display_name: "Raj Enterprises",
    client_type: "indian_non_gst",
    region: "india",
    currency: "INR",
    address: "44, Jayanagar 4th Block",
    city: "Bangalore",
    country: "India",
    contact_name: "Rajesh Patel",
    contact_phone: "+91 98765 43210",
    contact_email: "rajesh@rajenterprises.in",
    website: "",
  },
};

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const defaults = CLIENT_DATA[id] ?? {
    company_name: "",
    display_name: "",
    client_type: "indian_gst" as const,
    region: "india",
    currency: "INR",
    address: "",
    city: "",
    country: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    website: "",
  };

  const [clientType, setClientType] = useState<"indian_gst" | "indian_non_gst" | "international">(defaults.client_type);
  const [engagementType, setEngagementType] = useState<"retainer" | "one_time">(defaults.engagement_type ?? "one_time");
  const [billingDay, setBillingDay] = useState<number>(defaults.billing_day ?? 1);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => router.push(`/clients/${id}`), 800);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <Link
          href={`/clients/${id}`}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Client
        </Link>
        <PageHeader title="Edit Client" description="Update client account details" />
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Client type */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Invoice Type</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "indian_gst", label: "GST Invoices", desc: "G-series, 18% GST - Indian registered" },
              { value: "indian_non_gst", label: "Non-GST", desc: "NG-series, 0% tax - Unregistered Indian" },
              { value: "international", label: "International", desc: "G-series, 0% tax - Foreign clients" },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setClientType(type.value as typeof clientType)}
                className={cn(
                  "p-3 rounded-card text-left border transition-all duration-150",
                  clientType === type.value
                    ? "border-accent bg-accent-muted"
                    : "border-black/[0.05] bg-surface-DEFAULT hover:border-black/[0.08]"
                )}
              >
                <p className={cn("text-sm font-medium", clientType === type.value ? "text-accent" : "text-text-primary")}>
                  {type.label}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{type.desc}</p>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Company info */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Company Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Company Name *</label>
              <input type="text" required defaultValue={defaults.company_name} className="glass-input" placeholder="Full legal company name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Display Name</label>
              <input type="text" defaultValue={defaults.display_name} className="glass-input" placeholder="Short name for UI" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Region *</label>
              <select className="glass-input" defaultValue={defaults.region}>
                <option value="india">India</option>
                <option value="usa">USA</option>
                <option value="uae">UAE</option>
                <option value="uk">UK</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Currency *</label>
              <select className="glass-input" defaultValue={defaults.currency}>
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            {clientType === "indian_gst" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">GSTIN</label>
                <input type="text" defaultValue={defaults.gstin ?? ""} className="glass-input font-sans" placeholder="29AADCW8591N1ZA" />
              </div>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Address</label>
              <textarea rows={2} defaultValue={defaults.address} className="glass-input resize-none" placeholder="Full address" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">City</label>
              <input type="text" defaultValue={defaults.city} className="glass-input" placeholder="City" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Country</label>
              <input type="text" defaultValue={defaults.country} className="glass-input" placeholder="Country" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Primary Contact</label>
              <input type="text" defaultValue={defaults.contact_name} className="glass-input" placeholder="Contact person name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Phone</label>
              <input type="tel" defaultValue={defaults.contact_phone} className="glass-input" placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Website</label>
              <input type="text" defaultValue={defaults.website} className="glass-input" placeholder="www.example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Billing Email</label>
              <input type="email" defaultValue={defaults.contact_email} className="glass-input" placeholder="accounts@company.com" />
            </div>
          </div>
        </GlassCard>

        {/* Billing settings */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Billing Settings</h3>
          <p className="text-xs text-text-muted mb-4">Configure recurring invoice generation for retainer clients.</p>
          <div className="space-y-4">
            {/* Engagement type */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Engagement Type</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "retainer", label: "Retainer", desc: "Recurring monthly invoices" },
                  { value: "one_time", label: "One-Time", desc: "Project-based, no recurrence" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEngagementType(opt.value)}
                    className={cn(
                      "p-3 rounded-card text-left border transition-all duration-150",
                      engagementType === opt.value
                        ? "border-accent bg-accent-muted"
                        : "border-black/[0.05] bg-surface-DEFAULT hover:border-black/[0.08]"
                    )}
                  >
                    <p className={cn("text-sm font-medium", engagementType === opt.value ? "text-accent" : "text-text-primary")}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Billing day - only for retainer */}
            {engagementType === "retainer" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                  Invoice Generation Day
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={billingDay}
                    onChange={(e) => setBillingDay(Math.min(28, Math.max(1, Number(e.target.value))))}
                    className="glass-input w-24 font-sans"
                  />
                  <span className="text-sm text-text-muted">of every month</span>
                  <span className="text-xs px-2 py-1 rounded-full text-blue-500 bg-blue-500/10 font-medium">
                    Next: Apr {billingDay}, 2026
                  </span>
                </div>
                <p className="text-xs text-text-muted">Day 1-28. A reminder notification will be triggered on this day each month.</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Danger zone */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-red-500 mb-1">Danger Zone</h3>
          <p className="text-xs text-text-muted mb-4">Irreversible or high-impact actions for this client account.</p>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
            <div>
              <p className="text-sm font-medium text-text-primary">Close Client Account</p>
              <p className="text-xs text-text-muted mt-0.5">Stop billing reminders and mark as closed. All history preserved.</p>
            </div>
            <Link
              href={`/clients/${id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-button text-sm font-medium transition-all"
              style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <XCircle className="w-4 h-4" />
              Close
            </Link>
          </div>
        </GlassCard>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link
            href={`/clients/${id}`}
            className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saved}
            className="px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70"
            style={{ background: saved ? "#16a34a" : "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
