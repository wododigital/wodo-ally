"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { SaveButton } from "./company-tab";
import { lsGetJson, lsSetJson } from "./company-tab";
import { useUserSetting, useSaveUserSetting } from "@/lib/hooks/use-user-settings";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NOTIFICATION_ITEMS = [
  { id: "invoice_viewed",   label: "Email on invoice viewed",            desc: "Get notified when a client opens your invoice",        default: true  },
  { id: "payment_received", label: "Email on payment received",          desc: "Confirmation when a payment is recorded",              default: true  },
  { id: "overdue_7",        label: "Email on invoice overdue (7 days)",  desc: "Alert when an invoice is 7 days past due",             default: true  },
  { id: "overdue_30",       label: "Email on invoice overdue (30 days)", desc: "Escalation when an invoice is 30 days past due",       default: true  },
  { id: "weekly_summary",   label: "Weekly financial summary",           desc: "A digest of all transactions and outstanding amounts",  default: false },
  { id: "monthly_report",   label: "Monthly investor report reminder",   desc: "Reminder to generate and send the monthly report",     default: true  },
];

// ---------------------------------------------------------------------------
// Tab: Notifications
// ---------------------------------------------------------------------------

export function NotificationsTab() {
  const defaultEnabled = Object.fromEntries(NOTIFICATION_ITEMS.map((item) => [item.id, item.default]));
  const [enabled, setEnabled] = useState<Record<string, boolean>>(defaultEnabled);
  const [saved, setSaved] = useState(false);

  const { data: dbNotifs } = useUserSetting("notifications", defaultEnabled);
  const saveNotifs = useSaveUserSetting("notifications");

  useEffect(() => {
    if (dbNotifs && Object.keys(dbNotifs).length > 0) setEnabled(dbNotifs);
  }, [dbNotifs]);

  function toggle(id: string) {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSave() {
    saveNotifs.mutate(enabled);
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
