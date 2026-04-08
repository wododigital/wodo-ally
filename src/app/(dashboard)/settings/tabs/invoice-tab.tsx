"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/shared/glass-card";
import { FieldLabel, SaveButton } from "./company-tab";
import { lsGetJson, lsSetJson } from "./company-tab";
import { useUserSetting, useSaveUserSetting } from "@/lib/hooks/use-user-settings";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const INVOICE_DEFAULTS = {
  prefix_gst:     "G",
  prefix_non_gst: "NG",
  due_days:       "30",
  gst_rate:       "18",
  footer:         "Payment due within 30 days of invoice date. Late payments attract 2% per month interest. All disputes subject to Bangalore jurisdiction.",
};

// ---------------------------------------------------------------------------
// Tab: Invoice
// ---------------------------------------------------------------------------

export function InvoiceTab() {
  const [saved, setSaved] = useState(false);
  const [fields, setFields] = useState(INVOICE_DEFAULTS);

  const { data: dbInvoice } = useUserSetting("invoice", INVOICE_DEFAULTS);
  const saveInvoice = useSaveUserSetting("invoice");

  useEffect(() => {
    if (dbInvoice) setFields(dbInvoice);
  }, [dbInvoice]);

  function set(key: keyof typeof INVOICE_DEFAULTS, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    saveInvoice.mutate(fields);
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
