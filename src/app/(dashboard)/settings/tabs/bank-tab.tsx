"use client";

import { useState, useEffect } from "react";
import { Edit2, Save, Check, Copy } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { FieldLabel } from "./company-tab";
import { lsGetJson, lsSetJson } from "./company-tab";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tab: Bank Details
// ---------------------------------------------------------------------------

export function BankTab() {
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
