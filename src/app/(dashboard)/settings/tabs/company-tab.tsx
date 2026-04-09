"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, Save, Check, Upload, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { useUserSetting, useSaveUserSetting } from "@/lib/hooks/use-user-settings";
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// localStorage helpers (shared)
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

export { lsGet, lsSet, lsGetJson, lsSetJson };

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-text-muted uppercase tracking-wider">
      {children}
    </label>
  );
}

export function SaveButton({
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
        <span className="w-4 h-4 animate-spin border-2 border-white/30 border-t-white rounded-full" />
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
export function UploadBox({
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

// ---------------------------------------------------------------------------
// Tab: Company
// ---------------------------------------------------------------------------

export function CompanyTab() {
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [fields, setFields] = useState(COMPANY_DEFAULTS);
  const [logoLight, setLogoLight] = useState("");
  const [logoDark, setLogoDark] = useState("");
  const [stamp, setStamp] = useState("");

  useUnsavedChanges(isDirty);

  // DB-backed settings with localStorage fallback
  const { data: dbCompany, isLoading } = useUserSetting("company", COMPANY_DEFAULTS);
  const saveCompany = useSaveUserSetting("company");
  const saveBrandAssets = useSaveUserSetting("brand_assets");

  useEffect(() => {
    if (dbCompany) {
      setFields(dbCompany);
    }
    // Brand assets - still use localStorage as backup for base64 (too large for DB)
    setLogoLight(lsGet("wodo_logo_light"));
    setLogoDark(lsGet("wodo_logo_dark"));
    setStamp(lsGet("wodo_stamp"));
  }, [dbCompany]);

  function set(key: keyof typeof COMPANY_DEFAULTS, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Save to DB and localStorage
    saveCompany.mutate(fields);
    lsSetJson("wodo_company", fields);
    lsSet("wodo_logo_light", logoLight);
    lsSet("wodo_logo_dark", logoDark);
    lsSet("wodo_stamp", stamp);
    setIsDirty(false);
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
            onChange={(v) => { setLogoLight(v); setIsDirty(true); }}
          />
          <UploadBox
            label="Logo - Dark Version"
            hint="Upload for light backgrounds (used on PDF)"
            value={logoDark}
            onChange={(v) => { setLogoDark(v); setIsDirty(true); }}
            darkBg={false}
          />
          <UploadBox
            label="Company Stamp"
            hint="Stamp/seal image for invoices"
            value={stamp}
            onChange={(v) => { setStamp(v); setIsDirty(true); }}
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => {
              lsSet("wodo_logo_light", logoLight);
              lsSet("wodo_logo_dark", logoDark);
              lsSet("wodo_stamp", stamp);
              setIsDirty(false);
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
