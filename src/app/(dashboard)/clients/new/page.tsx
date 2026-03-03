"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GlassCard } from "@/components/shared/glass-card";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";
import { useCreateClient } from "@/lib/hooks/use-clients";
import type { Database } from "@/types/database";

type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

// ─── Zod schema ───────────────────────────────────────────────────────────────

const clientSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  display_name: z.string().optional(),
  region: z.enum(["india", "usa", "uae", "uk", "other"]),
  currency: z.enum(["INR", "USD", "AED", "GBP"]),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  signing_authority: z.string().optional(),
  phone: z.string().optional(),
  website: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        try {
          const url = val.startsWith("http") ? val : `https://${val}`;
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Enter a valid website URL" }
    ),
  billing_email: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      },
      { message: "Enter a valid email address" }
    ),
  client_type: z.enum(["indian_gst", "indian_non_gst", "international"]),
});

type ClientFormValues = z.infer<typeof clientSchema>;

// ─── Inline error ─────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-0.5">{message}</p>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewClientPage() {
  const router = useRouter();
  const createClient = useCreateClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      client_type: "indian_gst",
      region: "india",
      currency: "INR",
    },
  });

  const clientType = watch("client_type");

  function onSubmit(values: ClientFormValues) {
    const clientData: ClientInsert = {
      company_name: values.company_name.trim(),
      display_name: values.display_name?.trim() || null,
      client_type: values.client_type,
      region: values.region,
      currency: values.currency,
      gstin: values.client_type === "indian_gst" ? (values.gstin?.trim() || null) : null,
      address: values.address?.trim() || null,
      city: values.city?.trim() || null,
      country: values.country?.trim() || "India",
      signing_authority: values.signing_authority?.trim() || null,
      phone: values.phone?.trim() || null,
      website: values.website?.trim() || null,
      billing_emails: (() => {
        const email = values.billing_email?.trim();
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

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Client type */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Invoice Type</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "indian_gst",     label: "GST Invoices", desc: "G-series, 18% GST - Indian registered" },
              { value: "indian_non_gst", label: "Non-GST",      desc: "NG-series, 0% tax - Unregistered Indian" },
              { value: "international",  label: "International", desc: "G-series, 0% tax - Foreign clients" },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setValue("client_type", type.value as ClientFormValues["client_type"], { shouldValidate: true })}
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
              <input
                {...register("company_name")}
                type="text"
                className={cn("glass-input", errors.company_name && "border-red-400")}
                placeholder="Full legal company name"
              />
              <FieldError message={errors.company_name?.message} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Display Name</label>
              <input
                {...register("display_name")}
                type="text"
                className="glass-input"
                placeholder="Short name for UI"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Region *</label>
              <select {...register("region")} className="glass-input">
                <option value="india">India</option>
                <option value="usa">USA</option>
                <option value="uae">UAE</option>
                <option value="uk">UK</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Currency *</label>
              <select {...register("currency")} className="glass-input">
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>

            {clientType === "indian_gst" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">GSTIN</label>
                <input
                  {...register("gstin")}
                  type="text"
                  className="glass-input font-sans"
                  placeholder="29AADCW8591N1ZA"
                />
              </div>
            )}

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Address</label>
              <textarea
                {...register("address")}
                rows={2}
                className="glass-input resize-none"
                placeholder="Full address"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">City</label>
              <input {...register("city")} type="text" className="glass-input" placeholder="City" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Country</label>
              <input {...register("country")} type="text" className="glass-input" placeholder="Country" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Signing Authority</label>
              <input
                {...register("signing_authority")}
                type="text"
                className="glass-input"
                placeholder="Contact person name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Phone</label>
              <input
                {...register("phone")}
                type="tel"
                className="glass-input"
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Website</label>
              <input
                {...register("website")}
                type="text"
                className={cn("glass-input", errors.website && "border-red-400")}
                placeholder="www.example.com"
              />
              <FieldError message={errors.website?.message} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Billing Email</label>
              <input
                {...register("billing_email")}
                type="text"
                className={cn("glass-input", errors.billing_email && "border-red-400")}
                placeholder="accounts@company.com"
              />
              <FieldError message={errors.billing_email?.message} />
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {createClient.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {createClient.isPending ? "Creating..." : "Create Client"}
          </button>
        </div>
      </form>
    </div>
  );
}
