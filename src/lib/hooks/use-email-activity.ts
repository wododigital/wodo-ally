"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailActionType =
  | "sent"
  | "resent"
  | "viewed"
  | "downloaded"
  | "bounced"
  | "failed";

export type EmailTemplate =
  | "invoice_send"
  | "invoice_reminder"
  | "invoice_overdue"
  | "proforma_send"
  | "payment_receipt"
  | "custom";

export interface EmailActivityRecord {
  id: string;
  invoice_id: string;
  action_type: EmailActionType;
  email_recipient: string;
  email_template: EmailTemplate | string;
  sent_at: string;
  resent_count: number;
  subject: string | null;
  error_message: string | null;
  created_at: string;
}

export interface EmailActivityResponse {
  activities: EmailActivityRecord[];
}

export interface RecordEmailActivityParams {
  invoiceId: string;
  action_type: EmailActionType | string;
  email_recipient: string;
  email_template: EmailTemplate | string;
  subject?: string;
}

// ─── useInvoiceEmailActivity ──────────────────────────────────────────────────

/**
 * Fetches the full email activity log for a specific invoice.
 * Results are stale after 30 seconds to keep the activity feed fresh
 * without hammering the API on every render.
 */
export function useInvoiceEmailActivity(invoiceId: string) {
  return useQuery<EmailActivityResponse, Error>({
    queryKey: ["invoice-email-activity", invoiceId],
    queryFn: async (): Promise<EmailActivityResponse> => {
      const response = await fetch(
        `/api/invoices/${invoiceId}/email-activity`
      );
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body?.error ?? `Failed to fetch email activity (${response.status})`
        );
      }
      return response.json();
    },
    enabled: !!invoiceId,
    staleTime: 30_000, // 30 seconds
  });
}

// ─── useRecordEmailActivity ───────────────────────────────────────────────────

/**
 * Records a new email activity event for an invoice (send, resend, etc.).
 * On success, invalidates the email activity query for that invoice so the
 * activity feed refreshes automatically.
 */
export function useRecordEmailActivity() {
  const queryClient = useQueryClient();

  return useMutation<EmailActivityRecord, Error, RecordEmailActivityParams>({
    mutationFn: async (
      params: RecordEmailActivityParams
    ): Promise<EmailActivityRecord> => {
      const { invoiceId, ...body } = params;
      const response = await fetch(
        `/api/invoices/${invoiceId}/email-activity`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        const resBody = await response.json().catch(() => ({}));
        throw new Error(
          resBody?.error ??
            `Failed to record email activity (${response.status})`
        );
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["invoice-email-activity", variables.invoiceId],
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to record email: ${error.message}`);
    },
  });
}
