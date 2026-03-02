"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";

export default function NewClientPage() {
  const router = useRouter();
  const [clientType, setClientType] = useState<"indian_gst" | "indian_non_gst" | "international">("indian_gst");

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <PageHeader title="Add New Client" description="Create a new client account" />
      </div>

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); router.push("/clients"); }}>
        {/* Client type */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Client Type</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "indian_gst", label: "Indian GST", desc: "GST registered Indian client" },
              { value: "indian_non_gst", label: "Non-GST", desc: "Unregistered Indian client" },
              { value: "international", label: "International", desc: "Foreign client (USD/AED/GBP)" },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setClientType(type.value as typeof clientType)}
                className={cn(
                  "p-3 rounded-card text-left border transition-all duration-150",
                  clientType === type.value
                    ? "border-accent bg-accent-muted"
                    : "border-white/5 bg-surface-DEFAULT hover:border-white/10"
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
              <input type="text" required className="glass-input" placeholder="Full legal company name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Display Name</label>
              <input type="text" className="glass-input" placeholder="Short name for UI" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Region *</label>
              <select className="glass-input">
                <option value="india">India</option>
                <option value="usa">USA</option>
                <option value="uae">UAE</option>
                <option value="uk">UK</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Currency *</label>
              <select className="glass-input">
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            {clientType === "indian_gst" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">GSTIN</label>
                <input type="text" className="glass-input font-mono" placeholder="29AADCW8591N1ZA" />
              </div>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Address</label>
              <textarea rows={2} className="glass-input resize-none" placeholder="Full address" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">City</label>
              <input type="text" className="glass-input" placeholder="City" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Country</label>
              <input type="text" className="glass-input" placeholder="Country" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Signing Authority</label>
              <input type="text" className="glass-input" placeholder="Contact person name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Phone</label>
              <input type="tel" className="glass-input" placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Website</label>
              <input type="url" className="glass-input" placeholder="www.example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Billing Email</label>
              <input type="email" className="glass-input" placeholder="accounts@company.com" />
            </div>
          </div>
        </GlassCard>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link
            href="/clients"
            className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-white/5 transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            Create Client
          </button>
        </div>
      </form>
    </div>
  );
}
