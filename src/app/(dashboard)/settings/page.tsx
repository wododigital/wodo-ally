"use client";

import { useState, useEffect, useRef } from "react";
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
  Loader2,
  Upload,
  Mail,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useAllServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@/lib/hooks/use-services";
import { GlassCard } from "@/components/shared/glass-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = "company" | "bank" | "invoice" | "services" | "users" | "notifications" | "email" | "contracts";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "company",       label: "Company",          icon: Building2  },
  { id: "bank",          label: "Bank Details",     icon: CreditCard },
  { id: "invoice",       label: "Invoice",          icon: Tag        },
  { id: "services",      label: "Services",         icon: Layers     },
  { id: "email",         label: "Email Templates",  icon: Mail       },
  { id: "contracts",     label: "Contracts",        icon: FileText   },
  { id: "users",         label: "Users",            icon: User       },
  { id: "notifications", label: "Notifications",    icon: Bell       },
];

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function lsGet(key: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}
function lsSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}
function lsGetJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function lsSetJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

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
  fields: { key: string; label: string; value: string; mono?: boolean; span?: boolean }[];
}

const BANK_ACCOUNTS: BankAccount[] = [
  {
    id: "gst",
    title: "Indian GST Account",
    fields: [
      { key: "beneficiary", label: "Beneficiary Name",  value: "WODO Digital Private Limited" },
      { key: "bank",        label: "Bank",              value: "IDFC FIRST Bank" },
      { key: "account",     label: "Account Number",    value: "10213871315",      mono: true },
      { key: "ifsc",        label: "IFSC Code",         value: "IDFB0081105",      mono: true },
    ],
  },
  {
    id: "usa",
    title: "USA Account (Community Federal Savings Bank)",
    fields: [
      { key: "holder",   label: "Account Holder Name",   value: "WODO DIGITAL PRIVATE LIMITED" },
      { key: "method",   label: "Payment Method",         value: "ACH" },
      { key: "routing",  label: "ACH Routing Number",     value: "026073150",     mono: true },
      { key: "account",  label: "Account Number",         value: "8335312671",    mono: true },
      { key: "bank",     label: "Bank Name",              value: "Community Federal Savings Bank" },
      { key: "address",  label: "Beneficiary Address",    value: "5 Penn Plaza, 14th Floor, New York, NY 10001, US", span: true },
      { key: "currency", label: "Account Currency",       value: "USD" },
    ],
  },
  {
    id: "uae",
    title: "UAE Account (Zand Bank PJSC)",
    fields: [
      { key: "holder",   label: "Account Holder Name",   value: "WODO DIGITAL PRIVATE LIMITED" },
      { key: "method",   label: "Payment Method",         value: "IPP / FTS" },
      { key: "iban",     label: "IBAN (Account Number)",  value: "AE190960000691060009302", mono: true },
      { key: "bic",      label: "BIC / SWIFT Code",       value: "ZANDAEAAXXX",             mono: true },
      { key: "bank",     label: "Bank Name",              value: "Zand Bank PJSC" },
      { key: "address",  label: "Beneficiary Address",    value: "1st Floor, Emaar Square, Building 6, Dubai, UAE", span: true },
      { key: "currency", label: "Account Currency",       value: "AED" },
    ],
  },
  {
    id: "nongst",
    title: "Non-GST Account",
    fields: [
      { key: "name",    label: "Account Holder", value: "Shyam Singh Bhati" },
      { key: "bank",    label: "Bank",           value: "IDFC FIRST Bank" },
      { key: "account", label: "Account Number", value: "10221086461",   mono: true },
      { key: "ifsc",    label: "IFSC Code",      value: "IDFB0081105",   mono: true },
      { key: "swift",   label: "SWIFT Code",     value: "IDFBINBBMUM",   mono: true },
      { key: "branch",  label: "Branch",         value: "Bangalore - JP Nagar 5th Phase Branch" },
      { key: "gpay",    label: "G-Pay Number",   value: "9535743993",    mono: true },
    ],
  },
];

const INVOICE_DEFAULTS = {
  prefix_gst:     "G",
  prefix_non_gst: "NG",
  due_days:       "30",
  gst_rate:       "18",
  footer:         "Payment due within 30 days of invoice date. Late payments attract 2% per month interest. All disputes subject to Bangalore jurisdiction.",
};

const NOTIFICATION_ITEMS = [
  { id: "invoice_viewed",   label: "Email on invoice viewed",            desc: "Get notified when a client opens your invoice",        default: true  },
  { id: "payment_received", label: "Email on payment received",          desc: "Confirmation when a payment is recorded",              default: true  },
  { id: "overdue_7",        label: "Email on invoice overdue (7 days)",  desc: "Alert when an invoice is 7 days past due",             default: true  },
  { id: "overdue_30",       label: "Email on invoice overdue (30 days)", desc: "Escalation when an invoice is 30 days past due",       default: true  },
  { id: "weekly_summary",   label: "Weekly financial summary",           desc: "A digest of all transactions and outstanding amounts",  default: false },
  { id: "monthly_report",   label: "Monthly investor report reminder",   desc: "Reminder to generate and send the monthly report",     default: true  },
];

const PRESET_COLORS = [
  "#fd7e14", "#f59e0b", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
  "#f97316", "#6366f1", "#ef4444", "#9ca3af",
];

// ---------------------------------------------------------------------------
// Email template defaults
// ---------------------------------------------------------------------------

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "invoice_sent",
    name: "Invoice Sent",
    subject: "Invoice {{invoice_number}} from WODO Digital",
    body: `Hi {{client_name}},

Please find attached your invoice {{invoice_number}} for {{amount}} dated {{invoice_date}}.

Payment is due by {{due_date}}.

You can make payment via the bank details mentioned on the invoice.

Thank you for your business!

Best regards,
WODO Digital Private Limited
accounts@wodo.digital | +91 63621 80633`,
  },
  {
    id: "payment_reminder",
    name: "Payment Reminder",
    subject: "Reminder: Invoice {{invoice_number}} due on {{due_date}}",
    body: `Hi {{client_name}},

This is a friendly reminder that invoice {{invoice_number}} for {{amount}} is due on {{due_date}}.

Please process payment at your earliest convenience. If you have already made the payment, please disregard this email.

Best regards,
WODO Digital Private Limited
accounts@wodo.digital`,
  },
  {
    id: "payment_received",
    name: "Payment Received",
    subject: "Payment Received - Invoice {{invoice_number}}",
    body: `Hi {{client_name}},

We have received your payment of {{amount}} for invoice {{invoice_number}}. Thank you!

This email serves as confirmation of your payment. A receipt will be sent separately if applicable.

Best regards,
WODO Digital Private Limited
accounts@wodo.digital`,
  },
  {
    id: "payment_overdue",
    name: "Payment Overdue",
    subject: "OVERDUE: Invoice {{invoice_number}} - {{days_overdue}} days past due",
    body: `Hi {{client_name}},

Your invoice {{invoice_number}} for {{amount}} was due on {{due_date}} and is now {{days_overdue}} days overdue.

Please make payment immediately to avoid late payment charges of 2% per month.

If you have any questions or require a payment plan, please contact us at accounts@wodo.digital.

Best regards,
WODO Digital Private Limited
accounts@wodo.digital | +91 63621 80633`,
  },
  {
    id: "contract_sent",
    name: "Contract Sent",
    subject: "Project Contract - {{project_name}} | WODO Digital",
    body: `Hi {{client_name}},

We are excited to move forward with {{project_name}}!

Please find attached the project contract for your review. The agreement covers the scope of work, deliverables, payment terms, and timeline as discussed.

Kindly review, sign, and return the contract at your earliest convenience so we can begin work.

If you have any questions or need any clarification, feel free to reach out.

Best regards,
WODO Digital Private Limited
accounts@wodo.digital | +91 63621 80633`,
  },
  {
    id: "contract_reminder",
    name: "Contract Reminder",
    subject: "Reminder: Project Contract Pending - {{project_name}}",
    body: `Hi {{client_name}},

This is a gentle reminder that the project contract for {{project_name}} sent on {{contract_date}} is still pending your signature.

Once the signed contract is received, we can proceed with the project kick-off immediately.

Please sign and return the contract at your earliest convenience. If you have any questions or concerns, do not hesitate to reach out.

Best regards,
WODO Digital Private Limited
accounts@wodo.digital | +91 63621 80633`,
  },
  {
    id: "contract_receipt",
    name: "Contract Receipt",
    subject: "Contract Received - {{project_name}} | WODO Digital",
    body: `Hi {{client_name}},

Thank you! We have received the signed contract for {{project_name}}.

We are now ready to kick off the project. Our team will reach out shortly to schedule an onboarding call and share the project plan.

We look forward to building something great together!

Best regards,
WODO Digital Private Limited
accounts@wodo.digital | +91 63621 80633`,
  },
];

// ---------------------------------------------------------------------------
// Contract template defaults (multi-template)
// ---------------------------------------------------------------------------

interface ContractTemplate {
  id: string;
  name: string;
  type: "design_development" | "seo_retainer" | "custom";
  body: string;
}

const CONTRACT_TYPE_LABELS: Record<ContractTemplate["type"], string> = {
  design_development: "Design & Development",
  seo_retainer: "SEO & Retainer",
  custom: "Custom",
};

const CONTRACT_TYPE_COLORS: Record<ContractTemplate["type"], string> = {
  design_development: "text-blue-500 bg-blue-500/[0.08] border-blue-500/20",
  seo_retainer: "text-purple-500 bg-purple-500/[0.08] border-purple-500/20",
  custom: "text-text-muted bg-surface-DEFAULT border-black/[0.08]",
};

const DEFAULT_CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "design_development",
    name: "Design & Development Project",
    type: "design_development",
    body: `DESIGN & DEVELOPMENT PROJECT CONTRACT

This Agreement is entered into as of {{date}} between WODO Digital Private Limited, having its registered office at #1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore - 560091, Karnataka, India (hereinafter "Service Provider") and {{client_name}}, {{client_address}} (hereinafter "Client").

You, {{client_name}}, are hiring WODO Digital for {{services}} of {{project_name}} at an estimated cost of {{amount}} + 18% GST.

1. WORK AND PAYMENT

1.1 Project Deliverables
{{deliverables}}

1.2 Payment Terms
{{payment_terms}}

1.3 Project Timeline
{{timeline}}

2. OWNERSHIP
All work product, designs, code, content, and deliverables created under this Agreement shall become the exclusive property of the Client upon receipt of full payment. The Service Provider retains the right to display the work in their portfolio unless otherwise agreed in writing.

3. CONFIDENTIALITY
Both parties agree to maintain strict confidentiality of all proprietary information, trade secrets, and business data shared during the course of this engagement.

4. TERM AND TERMINATION
a) This Agreement commences on {{start_date}} and continues until project completion or termination by either party with 30 days written notice.
b) The Client shall pay for all work completed up to the termination date.

5. REVISIONS AND SCOPE
Any additions or changes to the scope of work will require a written change order and may result in additional charges.

6. LIMITATION OF LIABILITY
The Service Provider's liability shall not exceed the total fees paid under this Agreement.

7. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Karnataka, India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, India.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

WODO DIGITAL PRIVATE LIMITED          {{client_name}}

_______________________               _______________________
Authorized Signatory                  Authorized Signatory

Date: _______________                 Date: _______________`,
  },
  {
    id: "seo_retainer",
    name: "SEO & Digital Marketing Retainer",
    type: "seo_retainer",
    body: `SEO & DIGITAL MARKETING RETAINER CONTRACT

This Agreement is entered into as of {{date}} between WODO Digital Private Limited, having its registered office at #1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore - 560091, Karnataka, India (hereinafter "Service Provider") and {{client_name}}, {{client_address}} (hereinafter "Client").

{{client_name}} is hiring WODO Digital for {{services}} of {{client_name}} at an estimated retainer cost of {{amount}} per month.

1. WORK AND PAYMENT

1.1 Monthly Deliverables
{{deliverables}}

1.2 Payment Terms
{{payment_terms}}

Minimum contract period: {{duration}} months. Invoices are raised on the {{billing_day}} of each month.

{{ad_spend_terms}}

2. REPORTING
The Service Provider will deliver monthly reports covering performance metrics, rankings, and campaign updates.

3. CONFIDENTIALITY
Both parties agree to maintain strict confidentiality of all proprietary information and business data.

4. TERM AND TERMINATION
a) This Agreement commences on {{start_date}} and runs for a minimum period of {{duration}} months.
b) After the minimum period, either party may terminate with 30 days written notice.
c) The Client shall pay for all services rendered up to the termination date.

5. LIMITATION OF LIABILITY
The Service Provider does not guarantee specific ranking positions or ad performance outcomes. Results depend on market conditions and search engine algorithm changes beyond our control.

6. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Karnataka, India.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

WODO DIGITAL PRIVATE LIMITED          {{client_name}}

_______________________               _______________________
Authorized Signatory                  Authorized Signatory

Date: _______________                 Date: _______________`,
  },
  {
    id: "general_services",
    name: "General Services Agreement",
    type: "custom",
    body: `GENERAL SERVICES AGREEMENT

This Agreement is entered into as of {{date}} between WODO Digital Private Limited, having its registered office at #1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore - 560091, Karnataka, India (hereinafter "Service Provider") and {{client_name}}, {{client_address}} (hereinafter "Client").

1. SCOPE OF SERVICES
The Service Provider agrees to provide the following services: {{services}}

This engagement is on a {{engagement_type}} basis commencing on {{start_date}}.

2. FEES AND PAYMENT TERMS
a) The Client agrees to pay {{amount}} for the services described above.
b) {{payment_terms}}
c) Late payments shall attract interest at 2% per month on the outstanding amount.
d) All prices are exclusive of applicable taxes.

3. INTELLECTUAL PROPERTY
All deliverables created under this Agreement become the exclusive property of the Client upon receipt of full payment.

4. CONFIDENTIALITY
Both parties agree to maintain strict confidentiality of all proprietary information shared during this engagement.

5. TERM AND TERMINATION
a) This Agreement commences on {{start_date}} and continues until terminated by either party with 30 days written notice.
b) The Client shall pay for all work completed up to the termination date.

6. LIMITATION OF LIABILITY
The Service Provider's liability shall not exceed the total fees paid in the preceding 3 months.

7. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Karnataka, India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, India.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

WODO DIGITAL PRIVATE LIMITED          {{client_name}}

_______________________               _______________________
Authorized Signatory                  Authorized Signatory

Date: _______________                 Date: _______________`,
  },
  {
    id: "branding_creative",
    name: "Branding & Creative Project",
    type: "design_development",
    body: `BRANDING & CREATIVE PROJECT CONTRACT

This Agreement is entered into as of {{date}} between WODO Digital Private Limited, having its registered office at #1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore - 560091, Karnataka, India (hereinafter "Service Provider") and {{client_name}}, {{client_address}} (hereinafter "Client").

You, {{client_name}}, are hiring WODO Digital for branding and creative services for {{project_name}} at an estimated cost of {{amount}}.

1. CREATIVE DELIVERABLES AND PAYMENT

1.1 Deliverables
{{deliverables}}

1.2 Payment Schedule
{{payment_terms}}

1.3 Timeline
{{timeline}}

2. CREATIVE RIGHTS AND OWNERSHIP
Upon receipt of full and final payment, all creative work, designs, brand assets, and materials produced under this Agreement become the exclusive property of the Client. WODO Digital retains the right to showcase the work in its portfolio and marketing materials.

3. REVISIONS
The project includes {{revision_rounds}} rounds of revisions per deliverable. Additional revisions will be billed separately.

4. CONFIDENTIALITY
Both parties agree to maintain strict confidentiality of all brand strategies, business information, and creative briefs.

5. TERM AND APPROVAL
Creative work shall be considered approved and final if no written feedback is received within 5 business days of delivery.

6. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Karnataka, India.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

WODO DIGITAL PRIVATE LIMITED          {{client_name}}

_______________________               _______________________
Authorized Signatory                  Authorized Signatory

Date: _______________                 Date: _______________`,
  },
];

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
      {children}
    </label>
  );
}

function SaveButton({
  saved,
  loading,
  onClick,
}: {
  saved: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-300 disabled:opacity-60"
      style={{ background: saved ? "#16a34a" : "linear-gradient(135deg, #fd7e14, #e8720f)" }}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : saved ? (
        <Check className="w-4 h-4" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {saved ? "Saved!" : "Save Changes"}
    </button>
  );
}

// UploadBox - base64 file upload with preview
function UploadBox({
  label,
  hint,
  value,
  onChange,
  darkBg,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (base64: string) => void;
  darkBg?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors cursor-pointer min-h-[110px] p-4 group",
          value
            ? "border-accent/30 hover:border-accent/60"
            : "border-black/[0.10] hover:border-accent/40",
          darkBg ? "bg-gray-900" : "bg-surface-DEFAULT"
        )}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className="max-h-16 max-w-full object-contain"
          />
        ) : (
          <div className="text-center">
            <Upload className={cn("w-5 h-5 mx-auto mb-2", darkBg ? "text-white/30" : "text-text-muted")} />
            <p className={cn("text-xs", darkBg ? "text-white/40" : "text-text-muted")}>{hint}</p>
            <p className={cn("text-[10px] mt-0.5", darkBg ? "text-white/20" : "text-text-muted/60")}>PNG or SVG recommended - max 2 MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-xs text-red-400 hover:text-red-500 transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Company
// ---------------------------------------------------------------------------

function CompanyTab() {
  const [saved, setSaved] = useState(false);
  const [fields, setFields] = useState(COMPANY_DEFAULTS);
  const [logoLight, setLogoLight] = useState("");
  const [logoDark, setLogoDark] = useState("");
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    const saved = lsGetJson("wodo_company", COMPANY_DEFAULTS);
    setFields(saved);
    setLogoLight(lsGet("wodo_logo_light"));
    setLogoDark(lsGet("wodo_logo_dark"));
    setStamp(lsGet("wodo_stamp"));
  }, []);

  function set(key: keyof typeof COMPANY_DEFAULTS, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    lsSetJson("wodo_company", fields);
    lsSet("wodo_logo_light", logoLight);
    lsSet("wodo_logo_dark", logoDark);
    lsSet("wodo_stamp", stamp);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5">
      <GlassCard padding="lg">
        <h3 className="text-sm font-semibold text-text-primary mb-6">Company Information</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Company Name</FieldLabel>
            <input
              type="text"
              value={fields.name}
              onChange={(e) => set("name", e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <FieldLabel>PAN</FieldLabel>
              <input
                type="text"
                value={fields.pan}
                onChange={(e) => set("pan", e.target.value)}
                className="glass-input font-sans tracking-widest"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>GSTIN</FieldLabel>
              <input
                type="text"
                value={fields.gstin}
                onChange={(e) => set("gstin", e.target.value)}
                className="glass-input font-sans tracking-widest"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Address Line 1</FieldLabel>
              <input
                type="text"
                value={fields.address1}
                onChange={(e) => set("address1", e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Address Line 2</FieldLabel>
              <input
                type="text"
                value={fields.address2}
                onChange={(e) => set("address2", e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>City</FieldLabel>
              <input
                type="text"
                value={fields.city}
                onChange={(e) => set("city", e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>State</FieldLabel>
              <input
                type="text"
                value={fields.state}
                onChange={(e) => set("state", e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Pincode</FieldLabel>
              <input
                type="text"
                value={fields.pincode}
                onChange={(e) => set("pincode", e.target.value)}
                className="glass-input font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Country</FieldLabel>
              <input
                type="text"
                value={fields.country}
                onChange={(e) => set("country", e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Phone</FieldLabel>
              <input
                type="tel"
                value={fields.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="glass-input font-sans"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Email</FieldLabel>
              <input
                type="email"
                value={fields.email}
                onChange={(e) => set("email", e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <FieldLabel>Website</FieldLabel>
              <input
                type="text"
                value={fields.website}
                onChange={(e) => set("website", e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <SaveButton saved={saved} />
          </div>
        </form>
      </GlassCard>

      {/* Brand Assets */}
      <GlassCard padding="lg">
        <h3 className="text-sm font-semibold text-text-primary mb-1.5">Brand Assets</h3>
        <p className="text-xs text-text-muted mb-5">
          Upload logos and stamp used on invoices and documents. Assets are stored locally in your browser.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <UploadBox
            label="Logo - Light Version"
            hint="Upload for dark backgrounds"
            value={logoLight}
            onChange={setLogoLight}
          />
          <UploadBox
            label="Logo - Dark Version"
            hint="Upload for light backgrounds (used on PDF)"
            value={logoDark}
            onChange={setLogoDark}
            darkBg={false}
          />
          <UploadBox
            label="Company Stamp"
            hint="Stamp/seal image for invoices"
            value={stamp}
            onChange={setStamp}
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => {
              lsSet("wodo_logo_light", logoLight);
              lsSet("wodo_logo_dark", logoDark);
              lsSet("wodo_stamp", stamp);
              setSaved(true);
              setTimeout(() => setSaved(false), 2500);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-300"
            style={{ background: saved ? "#16a34a" : "linear-gradient(135deg, #fd7e14, #e8720f)" }}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Assets"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Bank Details
// ---------------------------------------------------------------------------

function BankTab() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedId,   setSavedId]   = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    const stored = lsGetJson<Record<string, Record<string, string>>>("wodo_bank_accounts", {});
    setFieldValues(stored);
  }, []);

  function getVal(accountId: string, key: string, defaultValue: string) {
    return fieldValues[accountId]?.[key] ?? defaultValue;
  }

  function setVal(accountId: string, key: string, value: string) {
    setFieldValues((prev) => ({
      ...prev,
      [accountId]: { ...(prev[accountId] ?? {}), [key]: value },
    }));
  }

  function handleSave(id: string) {
    lsSetJson("wodo_bank_accounts", fieldValues);
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary border border-black/[0.05] bg-surface-DEFAULT hover:text-text-primary transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(account.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-white transition-colors"
                      style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {account.fields.map((field) => {
                const currentVal = getVal(account.id, field.key, field.value);
                return (
                  <div
                    key={field.key}
                    className={cn("space-y-1.5", field.span && "sm:col-span-2")}
                  >
                    <FieldLabel>{field.label}</FieldLabel>
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={currentVal}
                        onChange={(e) => setVal(account.id, field.key, e.target.value)}
                        className={cn("glass-input text-sm", field.mono && "font-sans tracking-wide")}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "flex-1 text-sm text-text-primary py-2 px-3 rounded-button bg-surface-DEFAULT border border-black/[0.05] break-all",
                            field.mono && "font-sans tracking-wide"
                          )}
                        >
                          {currentVal}
                        </p>
                        {field.mono && (
                          <button
                            type="button"
                            title="Copy"
                            onClick={() => navigator.clipboard.writeText(currentVal)}
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT rounded-button transition-all shrink-0"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
  const [fields, setFields] = useState(INVOICE_DEFAULTS);

  useEffect(() => {
    const stored = lsGetJson("wodo_invoice_settings", INVOICE_DEFAULTS);
    setFields(stored);
  }, []);

  function set(key: keyof typeof INVOICE_DEFAULTS, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    lsSetJson("wodo_invoice_settings", fields);
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
            <input
              type="text"
              value={fields.prefix_gst}
              onChange={(e) => set("prefix_gst", e.target.value)}
              className="glass-input font-sans w-24"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Invoice Prefix - Non-GST</FieldLabel>
            <input
              type="text"
              value={fields.prefix_non_gst}
              onChange={(e) => set("prefix_non_gst", e.target.value)}
              className="glass-input font-sans w-24"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Starting Sequence - GST</FieldLabel>
            <input
              type="text"
              value="G00113"
              readOnly
              className="glass-input font-sans tabular-nums opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-text-muted">Read-only - auto-incremented</p>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Starting Sequence - Non-GST</FieldLabel>
            <input
              type="text"
              value="NG00202"
              readOnly
              className="glass-input font-sans tabular-nums opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-text-muted">Read-only - auto-incremented</p>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Default Due Days</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={fields.due_days}
                onChange={(e) => set("due_days", e.target.value)}
                min={1}
                className="glass-input font-sans tabular-nums w-28"
              />
              <span className="text-xs text-text-muted">days after invoice date</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Default GST Rate (%)</FieldLabel>
            <input
              type="number"
              value={fields.gst_rate}
              onChange={(e) => set("gst_rate", e.target.value)}
              className="glass-input font-sans tabular-nums"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Invoice Footer Text</FieldLabel>
          <textarea
            rows={3}
            value={fields.footer}
            onChange={(e) => set("footer", e.target.value)}
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
  const { data: services = [], isLoading } = useAllServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [adding,       setAdding]       = useState(false);
  const [editingSvc,   setEditingSvc]   = useState<typeof services[0] | null>(null);
  const [newName,      setNewName]      = useState("");
  const [newDesc,      setNewDesc]      = useState("");
  const [newHsn,       setNewHsn]       = useState("");
  const [newColor,     setNewColor]     = useState(PRESET_COLORS[0]);
  const [confirmSvcId, setConfirmSvcId] = useState<string | null>(null);
  const confirmSvc = services.find((s) => s.id === confirmSvcId) ?? null;

  // Edit form state
  const [editName,  setEditName]  = useState("");
  const [editDesc,  setEditDesc]  = useState("");
  const [editHsn,   setEditHsn]   = useState("");
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);

  function openEdit(svc: typeof services[0]) {
    setEditingSvc(svc);
    setEditName(svc.name);
    setEditDesc(svc.description ?? "");
    setEditHsn(svc.hsn_code ?? "");
    setEditColor(svc.color ?? PRESET_COLORS[0]);
  }

  function handleAdd() {
    if (!newName.trim()) return;
    createService.mutate(
      {
        name: newName.trim(),
        description: newDesc.trim() || null,
        hsn_code: newHsn.trim() || null,
        color: newColor,
        is_active: true,
      },
      {
        onSuccess: () => {
          setNewName(""); setNewDesc(""); setNewHsn(""); setNewColor(PRESET_COLORS[0]); setAdding(false);
        },
      }
    );
  }

  function handleEditSave() {
    if (!editingSvc || !editName.trim()) return;
    updateService.mutate(
      {
        id: editingSvc.id,
        data: {
          name: editName.trim(),
          description: editDesc.trim() || null,
          hsn_code: editHsn.trim() || null,
          color: editColor,
        },
      },
      { onSuccess: () => setEditingSvc(null) }
    );
  }

  function closeAddModal() {
    setAdding(false); setNewName(""); setNewDesc(""); setNewHsn(""); setNewColor(PRESET_COLORS[0]);
  }

  return (
    <div className="space-y-4">
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

        {isLoading ? (
          <div className="space-y-3 py-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-black/[0.04] animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">No services yet. Add your first service above.</p>
        ) : (
          <div className="divide-y divide-black/[0.05]">
            {services.map((svc) => (
              <div key={svc.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ background: svc.color ?? "#fd7e14" }}
                >
                  {svc.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn("text-sm font-medium", svc.is_active ? "text-text-primary" : "text-text-muted line-through")}>
                      {svc.name}
                    </p>
                    {svc.hsn_code && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        HSN {svc.hsn_code}
                      </span>
                    )}
                  </div>
                  {svc.description && (
                    <p className="text-xs text-text-muted mt-0.5 truncate">{svc.description}</p>
                  )}
                </div>

                {/* Edit */}
                <button
                  onClick={() => openEdit(svc)}
                  title="Edit service"
                  className="p-1.5 rounded-button text-text-muted hover:text-accent hover:bg-accent/[0.08] transition-all shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Active toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={svc.is_active}
                  onClick={() => updateService.mutate({ id: svc.id, data: { is_active: !svc.is_active } })}
                  disabled={updateService.isPending}
                  className={cn(
                    "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 focus:outline-none disabled:opacity-60",
                    svc.is_active ? "bg-accent" : "bg-black/[0.10]"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                      svc.is_active ? "right-0.5" : "left-0.5"
                    )}
                  />
                </button>

                {/* Delete */}
                <button
                  onClick={() => setConfirmSvcId(svc.id)}
                  disabled={deleteService.isPending}
                  title="Delete service"
                  className="p-1.5 rounded-button text-text-muted hover:text-red-400 hover:bg-red-400/[0.08] transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmSvcId !== null}
        onOpenChange={(open) => { if (!open) setConfirmSvcId(null); }}
        title="Delete Service"
        description={confirmSvc ? `Are you sure you want to delete "${confirmSvc.name}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        loading={deleteService.isPending}
        onConfirm={() => {
          if (!confirmSvcId) return;
          deleteService.mutate(confirmSvcId, { onSuccess: () => setConfirmSvcId(null) });
        }}
      />

      {/* Add service modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeAddModal} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-card shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-text-primary">New Service</h3>
              <button type="button" onClick={closeAddModal} className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all">
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
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
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
              <div className="space-y-1.5">
                <FieldLabel>HSN / SAC Code</FieldLabel>
                <input
                  type="text"
                  value={newHsn}
                  onChange={(e) => setNewHsn(e.target.value)}
                  placeholder="e.g. 998314"
                  className="glass-input font-sans"
                />
                <p className="text-[10px] text-text-muted">Design & Development: 998314 | Marketing & SEO: 998313</p>
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
                        newColor === c ? "ring-2 ring-offset-2 ring-black/20 scale-110" : "opacity-60 hover:opacity-100 hover:scale-105"
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end pt-1">
                <button type="button" onClick={closeAddModal} className="px-4 py-2 rounded-button text-sm text-text-secondary hover:text-text-primary border border-black/[0.05] bg-surface-DEFAULT transition-all">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!newName.trim() || createService.isPending}
                  className="flex items-center gap-2 px-5 py-2 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  {createService.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit service modal */}
      {editingSvc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditingSvc(null)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-card shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-text-primary">Edit Service</h3>
              <button type="button" onClick={() => setEditingSvc(null)} className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Service Name *</FieldLabel>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="glass-input"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Description</FieldLabel>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Short description (optional)"
                  className="glass-input"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>HSN / SAC Code</FieldLabel>
                <input
                  type="text"
                  value={editHsn}
                  onChange={(e) => setEditHsn(e.target.value)}
                  placeholder="e.g. 998314"
                  className="glass-input font-sans"
                />
                <p className="text-[10px] text-text-muted">Design & Development: 998314 | Marketing & SEO: 998313</p>
              </div>
              <div className="space-y-2">
                <FieldLabel>Colour</FieldLabel>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all duration-150",
                        editColor === c ? "ring-2 ring-offset-2 ring-black/20 scale-110" : "opacity-60 hover:opacity-100 hover:scale-105"
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end pt-1">
                <button type="button" onClick={() => setEditingSvc(null)} className="px-4 py-2 rounded-button text-sm text-text-secondary hover:text-text-primary border border-black/[0.05] bg-surface-DEFAULT transition-all">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={!editName.trim() || updateService.isPending}
                  className="flex items-center gap-2 px-5 py-2 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  {updateService.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
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
// Tab: Email Templates
// ---------------------------------------------------------------------------

function EmailTemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const stored = lsGetJson<EmailTemplate[]>("wodo_email_templates", DEFAULT_EMAIL_TEMPLATES);
    setTemplates(stored);
  }, []);

  function openEdit(tpl: EmailTemplate) {
    setEditing(tpl);
    setEditSubject(tpl.subject);
    setEditBody(tpl.body);
  }

  function saveEdit() {
    if (!editing) return;
    const updated = templates.map((t) =>
      t.id === editing.id ? { ...t, subject: editSubject, body: editBody } : t
    );
    setTemplates(updated);
    lsSetJson("wodo_email_templates", updated);
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const VARIABLES = [
    "{{client_name}}", "{{invoice_number}}", "{{amount}}", "{{invoice_date}}",
    "{{due_date}}", "{{days_overdue}}", "{{project_name}}", "{{contract_date}}",
  ];

  return (
    <div className="space-y-4">
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Email Templates</h3>
            <p className="text-xs text-text-muted mt-0.5">Customise emails sent to clients at each stage</p>
          </div>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <div className="mt-4 mb-3 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider mr-1">Variables:</span>
          {VARIABLES.map((v) => (
            <code key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
              {v}
            </code>
          ))}
        </div>

        <div className="divide-y divide-black/[0.05]">
          {templates.map((tpl) => (
            <div key={tpl.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === tpl.id ? null : tpl.id)}
                  className="flex items-center gap-2 text-left group"
                >
                  <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                    {tpl.name}
                  </span>
                  {expanded === tpl.id ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </button>
                <button
                  onClick={() => openEdit(tpl)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              {expanded === tpl.id && (
                <div className="mt-3 space-y-2 pl-0">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Subject</p>
                    <p className="text-xs text-text-secondary bg-surface-DEFAULT px-3 py-2 rounded-button border border-black/[0.05]">
                      {tpl.subject}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Body Preview</p>
                    <div
                      className="tiptap text-xs text-text-secondary bg-surface-DEFAULT px-3 py-2 rounded-xl border border-black/[0.05] leading-relaxed max-h-40 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: tpl.body }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Edit template modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-card shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{editing.name}</h3>
                <p className="text-xs text-text-muted mt-0.5">Edit the subject and body for this email template</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Subject</FieldLabel>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Body</FieldLabel>
                <RichTextEditor
                  value={editBody}
                  onChange={setEditBody}
                  placeholder="Write your email body here..."
                  variables={VARIABLES}
                  minHeight={280}
                />
              </div>
              <div className="flex items-center gap-3 justify-end pt-1">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-button text-sm text-text-secondary hover:text-text-primary border border-black/[0.05] bg-surface-DEFAULT transition-all">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="flex items-center gap-2 px-5 py-2 rounded-button text-sm font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Template
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
// Tab: Contract Templates
// ---------------------------------------------------------------------------

function ContractsTab() {
  const [templates, setTemplates] = useState<ContractTemplate[]>(DEFAULT_CONTRACT_TEMPLATES);
  const [editing, setEditing] = useState<ContractTemplate | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<ContractTemplate["type"]>("custom");
  const [editBody, setEditBody] = useState("");
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ContractTemplate["type"]>("custom");

  useEffect(() => {
    const stored = lsGetJson<ContractTemplate[]>("wodo_contract_templates", DEFAULT_CONTRACT_TEMPLATES);
    setTemplates(stored);
  }, []);

  function openEdit(tpl: ContractTemplate) {
    setEditing(tpl);
    setEditName(tpl.name);
    setEditType(tpl.type);
    setEditBody(tpl.body);
  }

  function saveEdit() {
    if (!editing) return;
    const updated = templates.map((t) =>
      t.id === editing.id ? { ...t, name: editName, type: editType, body: editBody } : t
    );
    setTemplates(updated);
    lsSetJson("wodo_contract_templates", updated);
    setEditing(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function deleteTemplate(id: string) {
    if (!confirm("Delete this contract template?")) return;
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    lsSetJson("wodo_contract_templates", updated);
  }

  function addTemplate() {
    if (!newName.trim()) return;
    const id = `custom_${Date.now()}`;
    const newTpl: ContractTemplate = {
      id,
      name: newName.trim(),
      type: newType,
      body: DEFAULT_CONTRACT_TEMPLATES.find((t) => t.type === newType)?.body ?? DEFAULT_CONTRACT_TEMPLATES[2].body,
    };
    const updated = [...templates, newTpl];
    setTemplates(updated);
    lsSetJson("wodo_contract_templates", updated);
    setShowAddModal(false);
    setNewName("");
    setNewType("custom");
    openEdit(newTpl);
  }

  function handleReset() {
    if (confirm("Reset all templates to defaults? Your changes will be lost.")) {
      setTemplates(DEFAULT_CONTRACT_TEMPLATES);
      lsSetJson("wodo_contract_templates", DEFAULT_CONTRACT_TEMPLATES);
    }
  }

  const VARIABLES = [
    "{{date}}", "{{client_name}}", "{{client_address}}", "{{project_name}}",
    "{{services}}", "{{deliverables}}", "{{payment_terms}}", "{{amount}}",
    "{{start_date}}", "{{duration}}", "{{timeline}}", "{{engagement_type}}",
    "{{billing_day}}", "{{revision_rounds}}", "{{ad_spend_terms}}",
  ];

  return (
    <div className="space-y-4">
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Contract Templates</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Deliverable-based templates you can choose when sharing contracts with clients for signing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Template
            </button>
          </div>
        </div>

        <div className="mt-4 mb-4 flex flex-wrap gap-1.5">
          <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider mr-1">Variables:</span>
          {VARIABLES.slice(0, 8).map((v) => (
            <code key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
              {v}
            </code>
          ))}
          <span className="text-[10px] text-text-muted self-center">+{VARIABLES.length - 8} more in editor</span>
        </div>

        <div className="divide-y divide-black/[0.05]">
          {templates.map((tpl) => (
            <div key={tpl.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === tpl.id ? null : tpl.id)}
                  className="flex items-center gap-2.5 text-left group flex-1 min-w-0"
                >
                  <span className={cn("text-[10px] px-2 py-0.5 rounded border font-medium shrink-0", CONTRACT_TYPE_COLORS[tpl.type])}>
                    {CONTRACT_TYPE_LABELS[tpl.type]}
                  </span>
                  <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                    {tpl.name}
                  </span>
                  {expanded === tpl.id ? (
                    <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                  )}
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEdit(tpl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium text-text-secondary bg-surface-DEFAULT border border-black/[0.05] hover:border-black/[0.10] hover:text-text-primary transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {!DEFAULT_CONTRACT_TEMPLATES.find((d) => d.id === tpl.id) && (
                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className="p-1.5 rounded-button text-text-muted hover:text-red-500 hover:bg-red-500/[0.06] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {expanded === tpl.id && (
                <div className="mt-3 pl-0">
                  <div
                    className="tiptap text-xs text-text-secondary bg-surface-DEFAULT px-3 py-3 rounded-xl border border-black/[0.05] leading-relaxed max-h-48 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: tpl.body }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Edit template modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative z-10 w-full max-w-3xl bg-white rounded-card shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Edit Contract Template</h3>
                <p className="text-xs text-text-muted mt-0.5">Customise this template. Variables in {"{{double braces}}"} are replaced automatically.</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel>Template Name</FieldLabel>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="glass-input"
                    placeholder="e.g. Design & Development Project"
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Contract Type</FieldLabel>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as ContractTemplate["type"])}
                    className="glass-input"
                  >
                    <option value="design_development">Design & Development</option>
                    <option value="seo_retainer">SEO & Retainer</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>Contract Body</FieldLabel>
                <RichTextEditor
                  value={editBody}
                  onChange={setEditBody}
                  placeholder="Write your contract body here..."
                  variables={VARIABLES}
                  minHeight={360}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 justify-end px-6 py-4 border-t border-black/[0.06] shrink-0">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-button text-sm text-text-secondary hover:text-text-primary border border-black/[0.05] bg-surface-DEFAULT transition-all">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="flex items-center gap-2 px-5 py-2 rounded-button text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
              >
                <Save className="w-3.5 h-3.5" />
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add template modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-card shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">New Contract Template</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 rounded-button text-text-muted hover:text-text-primary hover:bg-surface-DEFAULT transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Template Name</FieldLabel>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="glass-input"
                  placeholder="e.g. E-Commerce Project"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Start From</FieldLabel>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ContractTemplate["type"])}
                  className="glass-input"
                >
                  <option value="design_development">Design & Development template</option>
                  <option value="seo_retainer">SEO & Retainer template</option>
                  <option value="custom">General Services template</option>
                </select>
                <p className="text-xs text-text-muted">The new template will be pre-filled from the selected base.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end pt-1">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-button text-sm text-text-secondary hover:text-text-primary border border-black/[0.05] bg-surface-DEFAULT transition-all">
                Cancel
              </button>
              <button
                type="button"
                onClick={addTemplate}
                disabled={!newName.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-button text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
              >
                <Plus className="w-3.5 h-3.5" />
                Create & Edit
              </button>
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
  { role: "admin",      label: "Admin",      color: "bg-accent/10 text-accent border-accent/20",                 description: "Full access to all features, settings, and user management." },
  { role: "manager",    label: "Manager",    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",           description: "Can manage clients, projects, invoices, and expenses. Cannot manage users or settings." },
  { role: "accountant", label: "Accountant", color: "bg-purple-500/10 text-purple-400 border-purple-500/20",     description: "Read-only access to invoices, payments, and expenses. Can record payments." },
  { role: "viewer",     label: "Viewer",     color: "bg-surface-DEFAULT text-text-muted border-black/[0.08]",    description: "Read-only access to all data. Cannot create or modify any records." },
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = lsGetJson<Record<string, boolean>>("wodo_notifications", {});
    if (Object.keys(stored).length > 0) setEnabled(stored);
  }, []);

  function toggle(id: string) {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSave() {
    lsSetJson("wodo_notifications", enabled);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <GlassCard padding="lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-text-primary">Notification Preferences</h3>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}
      </div>
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
      <div className="flex justify-end pt-4">
        <SaveButton saved={saved} onClick={handleSave} />
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
          {activeTab === "email"         && <EmailTemplatesTab />}
          {activeTab === "contracts"     && <ContractsTab />}
          {activeTab === "users"         && <UsersTab />}
          {activeTab === "notifications" && <NotificationsTab />}
        </div>
      </div>
    </div>
  );
}
