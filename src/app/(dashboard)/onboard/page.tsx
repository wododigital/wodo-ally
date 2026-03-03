"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Check, FileText, LayoutDashboard, FilePen } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { cn } from "@/lib/utils/cn";

type Step = 1 | 2 | 3;
type ClientType = "indian_gst" | "indian_non_gst" | "international";

interface ClientForm {
  client_type: ClientType;
  company_name: string;
  display_name: string;
  region: string;
  currency: string;
  gstin: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
}

interface ProjectForm {
  project_name: string;
  engagement_type: string;
  start_date: string;
  description: string;
}

const STEPS = [
  { num: 1, label: "Client Details" },
  { num: 2, label: "Project Setup" },
  { num: 3, label: "Next Steps" },
];

export default function OnboardPage() {
  const [step, setStep] = useState<Step>(1);
  const [clientForm, setClientForm] = useState<ClientForm>({
    client_type: "indian_gst",
    company_name: "",
    display_name: "",
    region: "india",
    currency: "INR",
    gstin: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  });
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    project_name: "",
    engagement_type: "retainer",
    start_date: new Date().toISOString().split("T")[0],
    description: "",
  });

  function updateClient<K extends keyof ClientForm>(key: K, value: ClientForm[K]) {
    setClientForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateProject<K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) {
    setProjectForm((prev) => ({ ...prev, [key]: value }));
  }

  const clientLabel = clientForm.display_name || clientForm.company_name || "New Client";

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Step progress indicator */}
      <div className="flex items-start">
        {STEPS.map((s, idx) => (
          <div key={s.num} className="flex items-start flex-1">
            <div className="flex flex-col items-center">
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
                  "text-xs mt-1.5 font-medium whitespace-nowrap",
                  step === s.num ? "text-accent" : step > s.num ? "text-green-600" : "text-text-muted"
                )}
              >
                {s.label}
              </p>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 mx-2 mt-4",
                  step > s.num ? "bg-green-400" : "bg-black/[0.08]"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Client Details */}
      {step === 1 && (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
          <GlassCard padding="md">
            <h3 className="text-base font-semibold text-text-primary mb-1">Client Details</h3>
            <p className="text-xs text-text-muted mb-5">Set up the new client account</p>

            {/* Invoice type selector */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { value: "indian_gst", label: "GST Invoices", desc: "G-series, 18% GST" },
                { value: "indian_non_gst", label: "Non-GST", desc: "NG-series, 0% tax" },
                { value: "international", label: "International", desc: "G-series, 0% tax" },
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
                  type="text"
                  required
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
                <select
                  className="glass-input"
                  value={clientForm.region}
                  onChange={(e) => updateClient("region", e.target.value)}
                >
                  <option value="india">India</option>
                  <option value="usa">USA</option>
                  <option value="uae">UAE</option>
                  <option value="uk">UK</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Currency *</label>
                <select
                  className="glass-input"
                  value={clientForm.currency}
                  onChange={(e) => updateClient("currency", e.target.value)}
                >
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="AED">AED - UAE Dirham</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
              {clientForm.client_type === "indian_gst" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted uppercase tracking-wider">GSTIN</label>
                  <input
                    type="text"
                    value={clientForm.gstin}
                    onChange={(e) => updateClient("gstin", e.target.value)}
                    className="glass-input font-sans"
                    placeholder="29AADCW8591N1ZA"
                  />
                </div>
              )}
              <div className="space-y-1.5">
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
                  onChange={(e) => updateClient("contact_phone", e.target.value)}
                  className="glass-input"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Billing Email</label>
                <input
                  type="email"
                  value={clientForm.contact_email}
                  onChange={(e) => updateClient("contact_email", e.target.value)}
                  className="glass-input"
                  placeholder="accounts@company.com"
                />
              </div>
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              Next: Project Setup
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 2: Project Setup */}
      {step === 2 && (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
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
                Client ready
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
                  type="text"
                  required
                  value={projectForm.project_name}
                  onChange={(e) => updateProject("project_name", e.target.value)}
                  className="glass-input"
                  placeholder="e.g. SEO Management, Performance Marketing"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Engagement Type</label>
                <select
                  className="glass-input"
                  value={projectForm.engagement_type}
                  onChange={(e) => updateProject("engagement_type", e.target.value)}
                >
                  <option value="retainer">Monthly Retainer</option>
                  <option value="project">Fixed Project</option>
                  <option value="hourly">Hourly Billing</option>
                  <option value="performance">Performance Based</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={projectForm.start_date}
                  onChange={(e) => updateProject("start_date", e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Description</label>
                <textarea
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => updateProject("description", e.target.value)}
                  className="glass-input resize-none"
                  placeholder="Brief description of the project scope..."
                />
              </div>
            </div>
          </GlassCard>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-DEFAULT hover:bg-surface-hover border border-black/[0.05] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
              >
                Save Project
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
                href: "/contracts/new",
                color: "#6366f1",
                bg: "rgba(99,102,241,0.08)",
                border: "rgba(99,102,241,0.2)",
              },
              {
                icon: FileText,
                label: "Create Invoice",
                description: "Send your first invoice",
                href: "/invoices/new",
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
