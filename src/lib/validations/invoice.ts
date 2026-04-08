import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be greater than zero").max(999999999, "Amount too large"),
  quantity: z.number().int().positive("Quantity must be at least 1").max(9999, "Quantity too large"),
});

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid("Please select a client"),
  invoice_type: z.enum(["gst", "international", "non_gst", "proforma"]),
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().nullable(),
  currency: z.enum(["INR", "USD", "AED", "GBP", "EUR"]),
  notes: z.string().max(5000, "Notes must be under 5000 characters").nullable(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export const paymentSchema = z.object({
  amount_received: z.number().positive("Payment amount must be greater than zero"),
  amount_received_inr: z.number().positive("INR amount must be greater than zero").nullable().optional(),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  tds_deducted: z.number().min(0, "TDS cannot be negative").optional(),
  notes: z.string().max(2000, "Notes must be under 2000 characters").nullable().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;
