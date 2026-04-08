"use client";

import { useMutation } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditAction =
  | "payment.create"
  | "payment.delete"
  | "invoice.create"
  | "invoice.update"
  | "invoice.status_change"
  | "invoice.send_email"
  | "invoice.delete"
  | "client.create"
  | "client.update"
  | "client.delete"
  | "settings.update"
  | "tds.create"
  | "tds.delete"
  | "report.generate"
  | "report.send"
  | "user.login"
  | "user.logout"
  | "user.password_change";

export interface AuditLogEntry {
  action: AuditAction;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook to log audit entries for sensitive operations.
 * Usage:
 *   const auditLog = useAuditLog();
 *   auditLog.mutate({ action: "payment.create", entity_type: "invoice", entity_id: invoiceId, details: { amount } });
 */
export function useAuditLog() {
  return useMutation({
    mutationFn: async (entry: AuditLogEntry): Promise<void> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await (supabase as any)
        .from("audit_log")
        .insert({
          user_id: user?.id ?? null,
          action: entry.action,
          entity_type: entry.entity_type ?? null,
          entity_id: entry.entity_id ?? null,
          details: entry.details ?? {},
          ip_address: null,  // Not available client-side
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        });

      if (error) {
        // Silently fail audit logging - should not block the main operation
        console.error("Audit log error:", error.message);
      }
    },
    // Never show errors to users for audit logging
    onError: () => {},
  });
}

/**
 * Utility function for one-off audit logging (non-hook context).
 * Use this in API routes or utility functions.
 */
export async function logAudit(entry: AuditLogEntry & { user_id?: string }): Promise<void> {
  try {
    const supabase = createClient();
    await (supabase as any).from("audit_log").insert({
      user_id: entry.user_id ?? null,
      action: entry.action,
      entity_type: entry.entity_type ?? null,
      entity_id: entry.entity_id ?? null,
      details: entry.details ?? {},
      ip_address: null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch {
    console.error("Audit log error");
  }
}
