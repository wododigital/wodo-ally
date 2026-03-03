"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Check, FileText, LayoutDashboard, FilePen, Plus, X } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { cn } from "@/lib/utils/cn";
import { useCreateClient } from "@/lib/hooks/use-clients";
import { useCreateProject } from "@/lib/hooks/use-projects";
import { useServices } from "@/lib/hooks/use-services";
import Link from "next/link";

type Step = 1 | 2 | 3;
type ClientType = "indian_gst" | "indian_non_gst" | "international";

interface ClientForm {
  client_type: ClientType;
  company_name: string;
  display_name: string;
  region: string;
  currency: string;
  gstin: string;
  // Address
  address: string;
  city: string;
  state: string;
  pincode: string;
  // Signing authority (for contracts)
  signing_authority: string;
  designation: string;
  // Primary contact
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  // Billing emails (multiple)
  billing_emails: string[];
}

interface EngagementItem {
  engagement_type: "one_time" | "retainer";
  project_type: string;
  service_ids: string[];
}

interface ProjectForm {
  project_name: string;
  engagements: EngagementItem[];
  start_date: string;
  expected_close_date: string;
  description: string;
}

const STEPS = [
  { num: 1, label: "Client Details" },
  { num: 2, label: "Project Setup" },
  { num: 3, label: "Next Steps" },
];

const PROJECT_TYPES = [
  { value: "seo",                label: "SEO" },
  { value: "google_ads",         label: "Google Ads" },
  { value: "social_media",       label: "Social Media" },
  { value: "gmb",                label: "GMB" },
  { value: "content_marketing",  label: "Content Marketing" },
  { value: "web_development",    label: "Web Development" },
  { value: "branding",           label: "Branding" },
  { value: "ui_ux_design",       label: "UI/UX Design" },
  { value: "full_service",       label: "Full Service" },
  { value: "other",              label: "Other" },
];

function phoneOnly(value: string): string {
  return value.replace(/[^\d+\s\-()]/g, "");
}

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);

  const createClient = useCreateClient();
  const createProject = useCreateProject();
  const { data: services = [] } = useServices();

  const [clientForm, setClientForm] = useState<ClientForm>({
    client_type: "indian_gst",
    company_name: "",
    display_name: "",
    region: "india",
    currency: "INR",
    gstin: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    signing_authority: "",
    designation: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    billing_emails: [""],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [projectForm, setProjectForm] = useState<ProjectForm>({
    project_name: "",
    engagements: [{ engagement_type: "retainer", project_type: "seo", service_ids: [] }],
    start_date: new Date().toISOString().split("T")[0],
    expected_close_date: "",
    description: "",
  });

  function updateClient<K extends keyof ClientForm>(key: K, value: ClientForm[K]) {
    setClientForm((prev) => ({ ...prev, [key]: value }));
  }

  // Billing emails helpers
  function updateBillingEmail(idx: number, value: string) {
    setClientForm((prev) => {
      const emails = [...prev.billing_emails];
      emails[idx] = value;
      return { ...prev, billing_emails: emails };
    });
  }
  function addBillingEmail() {
    setClientForm((prev) => ({ ...prev, billing_emails: [...prev.billing_emails, ""] }));
  }
  function removeBillingEmail(idx: number) {
    setClientForm((prev) => ({
      ...prev,
      billing_emails: prev.billing_emails.filter((_, i) => i !== idx),
    }));
  }

  // Engagement helpers
  function addEngagement() {
    setProjectForm((prev) => ({
      ...prev,
      engagements: [...prev.engagements, { engagement_type: "retainer", project_type: "seo", service_ids: [] }],
    }));
  }
  function removeEngagement(idx: number) {
    setProjectForm((prev) => ({
      ...prev,
      engagements: prev.engagements.filter((_, i) => i !== idx),
    }));
  }
  function updateEngagement<K extends keyof EngagementItem>(idx: number, key: K, value: EngagementItem[K]) {
    setProjectForm((prev) => {
      const engagements = [...prev.engagements];
      engagements[idx] = { ...engagements[idx], [key]: value };
      return { ...prev, engagements };
    });
  }
  function toggleServiceInEngagement(engIdx: number, serviceId: string) {
    setProjectForm((prev) => {
      const engagements = [...prev.engagements];
      const current = engagements[engIdx].service_ids;
      engagements[engIdx] = {
        ...engagements[engIdx],
        service_ids: current.includes(serviceId)
          ? current.filter((s) => s !== serviceId)
          : [...current, serviceId],
      };
      return { ...prev, engagements };
    });
  }

  const clientLabel = clientForm.display_name || clientForm.company_name || "New Client";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateStep1(): boolean {
    const errors: Record<string, string> = {};
    if (clientForm.client_type === "indian_gst" && !clientForm.gstin.trim()) {
      errors.gstin = "GSTIN is required for GST invoices";
    }
    const filledEmails = clientForm.billing_emails.filter((e) => e.trim() !== "");
    if (filledEmails.length === 0) {
      errors.billing_emails = "At least one billing email is required";
    } else if (filledEmails.some((e) => !emailRegex.test(e.trim()))) {
      errors.billing_emails = "One or more billing emails are not valid";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleClientSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep1()) return;
    const billingEmails = clientForm.billing_emails.filter((e) => e.trim() !== "");
    const result = await createClient.mutateAsync({
      client: {
        company_name: clientForm.company_name,
        display_name: clientForm.display_name || null,
        client_type: clientForm.client_type,
        region: clientForm.region as "india" | "usa" | "uae" | "uk" | "other",
        currency: clientForm.currency as "INR" | "USD" | "AED" | "GBP" | "EUR",
        gstin: clientForm.gstin || null,
        address: clientForm.address || null,
        city: clientForm.city || null,
        state: clientForm.state || null,
        pincode: clientForm.pincode || null,
        signing_authority: clientForm.signing_authority || null,
        designation: clientForm.designation || null,
        phone: clientForm.contact_phone || null,
        billing_emails: billingEmails.length > 0 ? billingEmails : null,
      },
      contacts: clientForm.contact_name || clientForm.contact_email
        ? [{
            name: clientForm.contact_name,
            email: clientForm.contact_email || "",
            phone: clientForm.contact_phone || null,
            is_primary: true,
          }]
        : undefined,
    });
    setCreatedClientId(result.id);
    setStep(2);
  }

  async function handleProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (createdClientId && projectForm.project_name) {
      const firstEngagement = projectForm.engagements[0];
      await createProject.mutateAsync({
        client_id: createdClientId,
        name: projectForm.project_name,
        description: projectForm.description || null,
        engagement_type: firstEngagement?.engagement_type ?? "retainer",
        project_type: (firstEngagement?.project_type ?? "other") as "seo" | "google_ads" | "social_media" | "gmb" | "content_marketing" | "web_development" | "branding" | "ui_ux_design" | "full_service" | "other",
        contract_start_date: projectForm.start_date || null,
        projected_completion_date: projectForm.expected_close_date || null,
      });
    }
    setStep(3);
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Step progress indicator */}
      <div className="flex items-start">
        {STEPS.map((s, idx) => (
          <Fragment key={s.num}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  step > s.num
                    ? "bg-green-500 text-white"
                    : step === s.num
                    ? "text-white"
                    : "bg-surface-DEFAULT text-text-muted border border-black/[0.08]"
                )}
                style={step === s.num ? { background: "#fd7e14" } : undefined}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <p
                className={cn(
                  "text-xs mt-1.5 font-medium whitespace-nowrap text-center",
                  step === s.num ? "text-accent" : step > s.num ? "text-green-600" : "text-text-muted"
                )}
              >
                {s.label}
              </p>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-10 shrink-0 mt-4",
                  step > s.num ? "bg-green-400" : "bg-black/[0.08]"
                )}
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* Step 1: Client Details */}
      {step === 1 && (
        <form className="space-y-6" onSubmit={handleClientSubmit}>
          <GlassCard padding="md">
            <h3 className="text-base font-semibold text-text-primary mb-1">Client Details</h3>
            <p className="text-xs text-text-muted mb-5">Set up the new client account</p>

            {/* Invoice type selector */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { value: "indian_gst",     label: "GST Invoices",  desc: "G-series, 18% GST" },
                { value: "indian_non_gst", label: "Non-GST",        desc: "NG-series, 0% tax" },
                { value: "international",  label: "International",  desc: "G-series, 0% tax"  },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => updateClient("client_type", type.value as ClientType)}
                  className={cn(
                    "p-3 rounded-card text-left border transition-all duration-150",
                    clientForm.client_type === type.value
                      ? "border-accent bg-accent-muted"
                      : "border-black/[0.05] bg-surface-DEFAULT hover:border-black/[0.08]"
                  )}
                >
                  <p className={cn("text-sm font-medium", clientForm.client_type === type.value ? "text-accent" : "text-text-primary")}>
                    {type.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Company Name *</label>
                <input
                  type="text" required
                  value={clientForm.company_name}
                  onChange={(e) => updateClient("company_name", e.target.value)}
                  className="glass-input"
                  placeholder="Full legal company name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={clientForm.display_name}
                  onChange={(e) => updateClient("display_name", e.target.value)}
                  className="glass-input"
                  placeholder="Short name for UI"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Region *</label>
                <select className="glass-input" value={clientForm.region} onChange={(e) => updateClient("region", e.target.value)}>
                  <option value="india">India</option>
                  <option value="usa">USA</option>
                  <option value="uae">UAE</option>
                  <option value="uk">UK</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Currency *</label>
                <select className="glass-input" value={clientForm.currency} onChange={(e) => updateClient("currency", e.target.value)}>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
              {clientForm.client_type === "indian_gst" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    GSTIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientForm.gstin}
                    onChange={(e) => {
                      updateClient("gstin", e.target.value);
                      if (e.target.value.trim()) setFormErrors((prev) => { const n = { ...prev }; delete n.gstin; return n; });
                    }}
                    className={cn("glass-input font-sans", formErrors.gstin ? "border-red-400" : "")}
                    placeholder="29AADCW8591N1ZA"
                  />
                  {formErrors.gstin && <p className="text-xs text-red-500 mt-1">{formErrors.gstin}</p>}
                </div>
              )}
            </div>
          </GlassCard>

          {/* Address */}
          <GlassCard padding="md">
            <h3 className="text-base font-semibold text-text-primary mb-1">Address</h3>
            <p className="text-xs text-text-muted mb-4">Billing and correspondence address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Street Address</label>
                <input
                  type="text"
                  value={clientForm.address}
                  onChange={(e) => updateClient("address", e.target.value)}
                  className="glass-input"
                  placeholder="Building, street name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">City</label>
                <input
                  type="text"
                  value={clientForm.city}
                  onChange={(e) => updateClient("city", e.target.value)}
                  className="glass-input"
                  placeholder="City"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">State</label>
                <input
                  type="text"
                  value={clientForm.state}
                  onChange={(e) => updateClient("state", e.target.value)}
                  className="glass-input"
                  placeholder="State"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Pincode</label>
                <input
                  type="text"
                  value={clientForm.pincode}
                  onChange={(e) => updateClient("pincode", e.target.value.replace(/\D/g, ""))}
                  className="glass-input"
                  placeholder="560001"
                  maxLength={10}
                />
              </div>
            </div>
          </GlassCard>

          {/* Signing Authority */}
          <GlassCard padding="md">
            <h3 className="text-base font-semibold text-text-primary mb-1">Signing Authority</h3>
            <p className="text-xs text-text-muted mb-4">Person who signs contracts on behalf of the client</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={clientForm.signing_authority}
                  onChange={(e) => updateClient("signing_authority", e.target.value)}
                  className="glass-input"
                  placeholder="Authorised signatory name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Designation</label>
                <input
                  type="text"
                  value={clientForm.designation}
                  onChange={(e) => updateClient("designation", e.target.value)}
                  className="glass-input"
                  placeholder="Director, CEO, MD..."
                />
              </div>
            </div>
          </GlassCard>

          {/* POC Contact */}
          <GlassCard padding="md">
            <h3 className="text-base font-semibold text-text-primary mb-1">Point of Contact</h3>
            <p className="text-xs text-text-muted mb-4">Primary person to reach out to</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Contact Name</label>
                <input
                  type="text"
                  value={clientForm.contact_name}
                  onChange={(e) => updateClient("contact_name", e.target.value)}
                  className="glass-input"
                  placeholder="Primary contact person"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Phone</label>
                <input
                  type="tel"
                  value={clientForm.contact_phone}
                  onChange={(e) => updateClient("contact_phone", phoneOnly(e.target.value))}
                  className="glass-input"
                  placeholder="+91 98765 43210"
                  inputMode="tel"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={clientForm.contact_email}
                  onChange={(e) => updateClient("contact_email", e.target.value)}
                  className="glass-input"
                  placeholder="poc@company.com"
                />
              </div>
            </div>
          </GlassCard>

          {/* Billing Emails */}
          <GlassCard padding="md">
            <h3 className="text-base font-semibold text-text-primary mb-1">
              Billing Emails <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Invoices and billing emails will be sent to these addresses.{" "}
              <span className="text-text-secondary">shyam@wodo.digital and suhas@wodo.digital are always CC&apos;d.</span>
            </p>
            <div className="space-y-3">
              {clientForm.billing_emails.map((email, idx) => {
                const isTouched = email.trim() !== "";
                const isInvalid = isTouched && !emailRegex.test(email.trim());
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => {
                          updateBillingEmail(idx, e.target.value);
                          if (formErrors.billing_emails) setFormErrors((prev) => { const n = { ...prev }; delete n.billing_emails; return n; });
                        }}
                        className={cn("glass-input flex-1", isInvalid ? "border-red-400" : "")}
                        placeholder={`billing${idx > 0 ? idx + 1 : ""}@company.com`}
                      />
                      {clientForm.billing_emails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBillingEmail(idx)}
                          className="p-2 rounded-button text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {isInvalid && <p className="text-xs text-red-500">Enter a valid email address</p>}
                  </div>
                );
              })}
              {formErrors.billing_emails && (
                <p className="text-xs text-red-500">{formErrors.billing_emails}</p>
              )}
              <button
                type="button"
                onClick={addBillingEmail}
                className="flex items-center gap-2 text-xs text-accent font-medium hover:opacity-80 transition-opacity mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another email
              </button>
            </div>
          </GlassCard>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createClient.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              {createClient.isPending ? "Saving..." : "Next: Project Setup"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Project Setup */}
      {step === 2 && (
        <form className="space-y-6" onSubmit={handleProjectSubmit}>
          {/* Client summary card */}
          <GlassCard padding="md">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-button flex items-center justify-center text-sm font-bold text-accent shrink-0"
                style={{ background: "rgba(253,126,20,0.12)", border: "1px solid rgba(253,126,20,0.18)" }}
              >
                {clientLabel.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{clientLabel}</p>
                <p className="text-xs text-text-muted truncate">{clientForm.company_name}</p>
              </div>
              <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-200 shrink-0">
                Client saved
              </span>
            </div>
          </GlassCard>

          <GlassCard padding="md">
            <h3 className="text-base font-semibold text-text-primary mb-1">Project Setup</h3>
            <p className="text-xs text-text-muted mb-5">Create the first project for this client</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Project Name *</label>
                <input
                  type="text" required
                  value={projectForm.project_name}
                  onChange={(e) => setProjectForm((p) => ({ ...p, project_name: e.target.value }))}
                  className="glass-input"
                  placeholder="e.g. SEO Management, Performance Marketing"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={projectForm.start_date}
                  onChange={(e) => setProjectForm((p) => ({ ...p, start_date: e.target.value }))}
                  className="glass-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Expected Close Date</label>
                <input
                  type="date"
                  value={projectForm.expected_close_date}
                  onChange={(e) => setProjectForm((p) => ({ ...p, expected_close_date: e.target.value }))}
                  className="glass-input"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Description</label>
                <textarea
                  rows={2}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
                  className="glass-input resize-none"
                  placeholder="Brief description of the project scope..."
                />
              </div>
            </div>
          </GlassCard>

          {/* Engagement types */}
          <GlassCard padding="md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Engagement Types</h3>
                <p className="text-xs text-text-muted mt-0.5">Each engagement type can have its own services</p>
              </div>
              <button
                type="button"
                onClick={addEngagement}
                className="flex items-center gap-1.5 text-xs text-accent font-semibold hover:opacity-80 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            <div className="space-y-5">
              {projectForm.engagements.map((engagement, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-4 space-y-4"
                  style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Engagement {idx + 1}
                    </span>
                    {projectForm.engagements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEngagement(idx)}
                        className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Type</label>
                      <select
                        className="glass-input"
                        value={engagement.engagement_type}
                        onChange={(e) => updateEngagement(idx, "engagement_type", e.target.value as "one_time" | "retainer")}
                      >
                        <option value="retainer">Monthly Retainer</option>
                        <option value="one_time">Fixed / One-time</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Project Type</label>
                      <select
                        className="glass-input"
                        value={engagement.project_type}
                        onChange={(e) => updateEngagement(idx, "project_type", e.target.value)}
                      >
                        {PROJECT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {services.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Services</label>
                      <div className="flex flex-wrap gap-2">
                        {services.map((svc) => {
                          const selected = engagement.service_ids.includes(svc.id);
                          return (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => toggleServiceInEngagement(idx, svc.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
                                selected
                                  ? "border-accent text-accent"
                                  : "border-black/[0.07] text-text-secondary hover:border-black/[0.12]"
                              )}
                              style={selected ? { background: "rgba(253,126,20,0.08)" } : { background: "rgba(255,255,255,0.7)" }}
                            >
                              {svc.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all"
            >
              Back
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={createProject.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
              >
                {createProject.isPending ? "Saving..." : "Save Project"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Step 3: Success + Next Action */}
      {step === 3 && (
        <div className="space-y-6">
          <GlassCard padding="md">
            <div className="text-center py-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.2)" }}
              >
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">{clientLabel} is ready!</h2>
              <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
                Client{projectForm.project_name ? ` and project "${projectForm.project_name}"` : ""} have been set up. Choose what to do next.
              </p>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: FilePen,
                label: "Create Contract",
                description: "Draft a service agreement",
                href: "/contracts",
                color: "#6366f1",
                bg: "rgba(99,102,241,0.08)",
                border: "rgba(99,102,241,0.2)",
              },
              {
                icon: FileText,
                label: "Create Invoice",
                description: "Send your first invoice",
                href: "/invoices",
                color: "#fd7e14",
                bg: "rgba(253,126,20,0.08)",
                border: "rgba(253,126,20,0.2)",
              },
              {
                icon: LayoutDashboard,
                label: "Go to Dashboard",
                description: "Continue from dashboard",
                href: "/dashboard",
                color: "#6b7280",
                bg: "rgba(107,114,128,0.06)",
                border: "rgba(107,114,128,0.15)",
              },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <div
                  className="p-5 rounded-card border flex flex-col items-center text-center gap-3 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                  style={{ background: action.bg, border: `1px solid ${action.border}` }}
                >
                  <div
                    className="w-11 h-11 rounded-button flex items-center justify-center"
                    style={{ background: action.bg, border: `1px solid ${action.border}` }}
                  >
                    <action.icon className="w-5 h-5" style={{ color: action.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{action.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
