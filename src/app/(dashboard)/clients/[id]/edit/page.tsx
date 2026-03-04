"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/shared/glass-card";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils/cn";
import { useClient, useUpdateClient } from "@/lib/hooks/use-clients";
import type { Database } from "@/types/database";

type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

function phoneOnly(value: string): string {
  return value.replace(/[^\d+\s\-()]/g, "");
}

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: client, isLoading, isError, error } = useClient(id);
  const updateClient = useUpdateClient();

  const [clientType, setClientType] = useState<"indian_gst" | "indian_non_gst" | "international">("indian_gst");
  const [engagementType, setEngagementType] = useState<"retainer" | "one_time">("one_time");
  const [billingDay, setBillingDay] = useState<number>(1);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (client) {
      setClientType(client.client_type);
      setBillingDay(client.billing_day ?? 1);
      setPhone(client.phone ?? "");
      setEngagementType(client.billing_day ? "retainer" : "one_time");
    }
  }, [client]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const updateData: ClientUpdate = {
      company_name: (data.get("company_name") as string).trim(),
      display_name: (data.get("display_name") as string)?.trim() || null,
      client_type: clientType,
      region: (data.get("region") as ClientUpdate["region"]) ?? "india",
      currency: (data.get("currency") as ClientUpdate["currency"]) ?? "INR",
      gstin: clientType === "indian_gst" ? ((data.get("gstin") as string)?.trim() || null) : null,
      address: (data.get("address") as string)?.trim() || null,
      city: (data.get("city") as string)?.trim() || null,
      country: (data.get("country") as string)?.trim() || "India",
      signing_authority: (data.get("signing_authority") as string)?.trim() || null,
      phone: phone.trim() || null,
      website: (data.get("website") as string)?.trim() || null,
      billing_day: engagementType === "retainer" ? billingDay : null,
    };

    updateClient.mutate(
      { id, data: updateData },
      {
        onSuccess: () => router.push(`/clients/${id}`),
        onError: () => toast.error("Failed to save changes. Please try again."),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-4">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full rounded-card" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="rounded-xl px-4 py-3 text-sm text-red-500 border border-red-500/20 bg-red-500/[0.06]">
        Failed to load client: {(error as Error)?.message ?? "Client not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <form className="space-y-6" onSubmit={handleSubmit}>

        {/* Company info - first */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Company Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Company Name *</label>
              <input name="company_name" type="text" required defaultValue={client.company_name} className="glass-input" placeholder="Full legal company name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Display Name</label>
              <input name="display_name" type="text" defaultValue={client.display_name ?? ""} className="glass-input" placeholder="Short name for UI" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Region *</label>
              <select name="region" className="glass-input" defaultValue={client.region}>
                <option value="india">India</option>
                <option value="usa">USA</option>
                <option value="uae">UAE</option>
                <option value="uk">UK</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Currency *</label>
              <select name="currency" className="glass-input" defaultValue={client.currency}>
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Address</label>
              <textarea name="address" rows={2} defaultValue={client.address ?? ""} className="glass-input resize-none" placeholder="Full address" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">City</label>
              <input name="city" type="text" defaultValue={client.city ?? ""} className="glass-input" placeholder="City" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Country</label>
              <input name="country" type="text" defaultValue={client.country} className="glass-input" placeholder="Country" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Signing Authority</label>
              <input name="signing_authority" type="text" defaultValue={client.signing_authority ?? ""} className="glass-input" placeholder="Contact person name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(phoneOnly(e.target.value))}
                className="glass-input"
                placeholder="+91 98765 43210"
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Website</label>
              <input name="website" type="text" defaultValue={client.website ?? ""} className="glass-input" placeholder="www.example.com" />
            </div>
          </div>
        </GlassCard>

        {/* Invoice type - after company info */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Invoice Type</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "indian_gst",     label: "GST Invoices",  desc: "G-series, 18% GST - Indian registered" },
              { value: "indian_non_gst", label: "Non-GST",       desc: "NG-series, 0% tax - Unregistered Indian" },
              { value: "international",  label: "International", desc: "G-series, 0% tax - Foreign clients" },
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
                <p className={cn("text-sm font-medium", clientType === type.value ? "text-accent" : "text-text-primary")}>{type.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{type.desc}</p>
              </button>
            ))}
          </div>
          {clientType === "indian_gst" && (
            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">GSTIN</label>
              <input name="gstin" type="text" defaultValue={client.gstin ?? ""} className="glass-input font-sans w-72" placeholder="29AADCW8591N1ZA" />
            </div>
          )}
        </GlassCard>

        {/* Billing settings */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Billing Settings</h3>
          <p className="text-xs text-text-muted mb-4">Configure recurring invoice generation for retainer clients.</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Engagement Type</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "retainer", label: "Retainer",  desc: "Recurring monthly invoices" },
                  { value: "one_time", label: "One-Time",  desc: "Project-based, no recurrence" },
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
                    <p className={cn("text-sm font-medium", engagementType === opt.value ? "text-accent" : "text-text-primary")}>{opt.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {engagementType === "retainer" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Invoice Generation Day</label>
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
            disabled={updateClient.isPending}
            className="px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70"
            style={{ background: updateClient.isPending ? "#16a34a" : "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {updateClient.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
