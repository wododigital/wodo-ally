"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";
import { useCreateClient } from "@/lib/hooks/use-clients";
import type { Database } from "@/types/database";

type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

export default function NewClientPage() {
  const router = useRouter();
  const createClient = useCreateClient();

  const [clientType, setClientType] = useState<"indian_gst" | "indian_non_gst" | "international">("indian_gst");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const clientData: ClientInsert = {
      company_name: (data.get("company_name") as string).trim(),
      display_name: (data.get("display_name") as string)?.trim() || null,
      client_type: clientType,
      region: (data.get("region") as ClientInsert["region"]) ?? "india",
      currency: (data.get("currency") as ClientInsert["currency"]) ?? "INR",
      gstin: clientType === "indian_gst" ? ((data.get("gstin") as string)?.trim() || null) : null,
      address: (data.get("address") as string)?.trim() || null,
      city: (data.get("city") as string)?.trim() || null,
      country: (data.get("country") as string)?.trim() || "India",
      signing_authority: (data.get("signing_authority") as string)?.trim() || null,
      phone: (data.get("phone") as string)?.trim() || null,
      website: (data.get("website") as string)?.trim() || null,
      billing_emails: (() => {
        const email = (data.get("billing_email") as string)?.trim();
        return email ? [email] : null;
      })(),
    };

    createClient.mutate(
      { client: clientData },
      {
        onSuccess: (newClient) => {
          router.push(`/clients/${newClient.id}`);
        },
      }
    );
  }

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
              <input name="company_name" type="text" required className="glass-input" placeholder="Full legal company name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Display Name</label>
              <input name="display_name" type="text" className="glass-input" placeholder="Short name for UI" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Region *</label>
              <select name="region" className="glass-input">
                <option value="india">India</option>
                <option value="usa">USA</option>
                <option value="uae">UAE</option>
                <option value="uk">UK</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Currency *</label>
              <select name="currency" className="glass-input">
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            {clientType === "indian_gst" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">GSTIN</label>
                <input name="gstin" type="text" className="glass-input font-sans" placeholder="29AADCW8591N1ZA" />
              </div>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Address</label>
              <textarea name="address" rows={2} className="glass-input resize-none" placeholder="Full address" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">City</label>
              <input name="city" type="text" className="glass-input" placeholder="City" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Country</label>
              <input name="country" type="text" className="glass-input" placeholder="Country" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Signing Authority</label>
              <input name="signing_authority" type="text" className="glass-input" placeholder="Contact person name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Phone</label>
              <input name="phone" type="tel" className="glass-input" placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Website</label>
              <input name="website" type="url" className="glass-input" placeholder="www.example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Billing Email</label>
              <input name="billing_email" type="email" className="glass-input" placeholder="accounts@company.com" />
            </div>
          </div>
        </GlassCard>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Link
            href="/clients"
            className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createClient.isPending}
            className="px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {createClient.isPending ? "Creating..." : "Create Client"}
          </button>
        </div>
      </form>
    </div>
  );
}
