import { pdf } from "@react-pdf/renderer";
import React from "react";
import { InvoicePdf } from "./invoice-pdf";
import type { InvoicePdfProps } from "./invoice-pdf";
import type { DocumentProps } from "@react-pdf/renderer";

// Re-export for convenience
export type { InvoicePdfProps } from "./invoice-pdf";
export { InvoicePdf } from "./invoice-pdf";

/**
 * Generate a PDF blob from invoice data.
 * Can be used server-side or client-side.
 */
export async function generateInvoicePdf(props: InvoicePdfProps): Promise<Blob> {
  // Cast through unknown because @react-pdf/renderer's pdf() expects a Document element
  // but React.createElement returns a generic ReactElement
  const element = React.createElement(
    InvoicePdf,
    props
  ) as unknown as React.ReactElement<DocumentProps>;
  return pdf(element).toBlob();
}

/**
 * Trigger a browser download for a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
