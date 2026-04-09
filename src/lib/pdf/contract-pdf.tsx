import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ContractWithDetails } from "@/lib/hooks/use-contracts";
import type { Json } from "@/types/database";
import { registerPdfFonts } from "./register-fonts";

// Register Unicode-capable fonts (Noto Sans) for currency symbols and extended chars
registerPdfFonts();

// Re-export the type for external consumers
export type { ContractWithDetails };

// ─── Company constants ────────────────────────────────────────────────────────

const WODO_COMPANY = "WODO Digital Private Limited";
const WODO_ADDRESS_LINE1 = "#1, First Floor, Shree Lakshmi Arcade, BDA Layout";
const WODO_ADDRESS_LINE2 = "Nagarbhavi, Bangalore, India - 560091";
const WODO_GSTIN = "29AADCW8591N1ZA";
const WODO_CEO = "Shyam Singh Bhati";
const WODO_EMAIL = "accounts@wodo.digital";
const WODO_PHONE = "+91 63621 80633";
const WODO_WEBSITE = "www.wodo.digital";

// ─── Static boilerplate sections ─────────────────────────────────────────────

const BOILERPLATE_SECTIONS = [
  {
    title: "2. Ownership",
    body:
      "Upon receipt of full payment, WODO transfers all intellectual property rights, " +
      "including copyrights, to the Client for the deliverables created under this contract. " +
      "WODO retains the right to display the work in its portfolio unless otherwise agreed in writing.",
  },
  {
    title: "3. Confidentiality",
    body:
      "Both parties agree to keep all project details, pricing, and proprietary information " +
      "confidential during and after the engagement. Neither party shall disclose such information " +
      "to third parties without prior written consent.",
  },
  {
    title: "4. Revisions",
    body:
      "This contract includes a reasonable number of revisions as agreed in the scope. " +
      "Additional revisions beyond the agreed scope will be billed at WODO's prevailing hourly rate. " +
      "Revision requests must be submitted in writing within 7 days of delivery.",
  },
  {
    title: "5. Delays and Cancellations",
    body:
      "If the Client delays the project by more than 30 days from the agreed schedule, WODO reserves " +
      "the right to reschedule the project at its earliest availability. If the Client cancels the project, " +
      "all payments made are non-refundable, and any outstanding milestone payments become immediately due.",
  },
  {
    title: "6. Warranties",
    body:
      "WODO warrants that the services will be performed in a professional manner consistent with " +
      "industry standards. WODO does not guarantee specific business outcomes such as sales, rankings, " +
      "or traffic. WODO is not liable for changes in third-party platforms (e.g. Google algorithm updates).",
  },
  {
    title: "7. Limitation of Liability",
    body:
      "WODO's total liability under this agreement shall not exceed the total amount paid by the " +
      "Client in the three months preceding the claim. Neither party shall be liable for indirect, " +
      "incidental, or consequential damages arising from this agreement.",
  },
  {
    title: "8. Governing Law",
    body:
      "This agreement shall be governed by and construed in accordance with the laws of India. " +
      "Any disputes shall be resolved by arbitration in Bangalore, Karnataka, India, in accordance " +
      "with the Arbitration and Conciliation Act, 1996.",
  },
  {
    title: "9. Force Majeure",
    body:
      "Neither party shall be liable for delays or failures caused by circumstances beyond their " +
      "reasonable control, including but not limited to natural disasters, government actions, " +
      "pandemics, internet outages, or third-party service disruptions.",
  },
  {
    title: "10. Entire Agreement",
    body:
      "This contract constitutes the entire agreement between the parties with respect to its " +
      "subject matter and supersedes all prior discussions, representations, or agreements. " +
      "Amendments must be agreed in writing and signed by both parties.",
  },
  {
    title: "11. Acceptance",
    body:
      "By signing this agreement, both parties confirm that they have read, understood, and agree " +
      "to be bound by the terms and conditions set forth in this contract.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getContractTypeLabel(
  contractType: ContractWithDetails["contract_type"]
): string {
  if (contractType === "design_development") return "Design & Development Project Contract";
  if (contractType === "seo_retainer") return "SEO & Digital Services Retainer Contract";
  return "Service Agreement";
}

function renderContractDataFields(
  contractData: Json
): Array<{ label: string; value: string }> {
  if (!contractData || typeof contractData !== "object" || Array.isArray(contractData)) {
    return [];
  }

  return Object.entries(contractData as Record<string, Json>)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([key, value]) => {
      // Convert snake_case / camelCase keys to readable labels
      const label = key
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        label,
        value: typeof value === "object" ? JSON.stringify(value) : String(value),
      };
    });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ORANGE = "#fd7e14";
const DARK = "#1a1a1a";
const GRAY = "#555555";
const LIGHT_GRAY = "#888888";
const BORDER_COLOR = "#e0e0e0";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    backgroundColor: "#ffffff",
    paddingTop: 0,
    paddingBottom: 50,
    paddingHorizontal: 44,
    fontSize: 9,
    color: DARK,
  },

  // Top orange bar
  taglineBar: {
    backgroundColor: ORANGE,
    marginHorizontal: -44,
    paddingHorizontal: 44,
    paddingVertical: 6,
    marginBottom: 22,
  },
  taglineText: {
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "NotoSans", fontWeight: 700,
    letterSpacing: 1.5,
  },

  // Header row
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 13,
    fontFamily: "NotoSans", fontWeight: 700,
    color: ORANGE,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  companyDetail: {
    fontSize: 7.5,
    color: GRAY,
    marginBottom: 1.5,
  },
  headerRight: {
    alignItems: "flex-end",
    minWidth: 160,
  },
  contractTitle: {
    fontSize: 9,
    fontFamily: "NotoSans", fontWeight: 700,
    color: LIGHT_GRAY,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  contractId: {
    fontSize: 7.5,
    color: GRAY,
    marginBottom: 2,
  },
  contractDate: {
    fontSize: 7.5,
    color: GRAY,
  },

  // Document title
  docTitleSection: {
    backgroundColor: "#fff9f4",
    borderLeftWidth: 4,
    borderLeftColor: ORANGE,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  docTitle: {
    fontSize: 14,
    fontFamily: "NotoSans", fontWeight: 700,
    color: DARK,
    marginBottom: 3,
  },
  docSubtitle: {
    fontSize: 8.5,
    color: GRAY,
  },

  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    marginBottom: 14,
  },

  // Party section
  partyRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  partyBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 4,
    padding: 10,
  },
  partyLabel: {
    fontSize: 7,
    fontFamily: "NotoSans", fontWeight: 700,
    color: ORANGE,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  partyName: {
    fontSize: 9.5,
    fontFamily: "NotoSans", fontWeight: 700,
    color: DARK,
    marginBottom: 3,
  },
  partyDetail: {
    fontSize: 7.5,
    color: GRAY,
    marginBottom: 1.5,
  },

  // Section heading
  sectionHeading: {
    fontSize: 9.5,
    fontFamily: "NotoSans", fontWeight: 700,
    color: DARK,
    marginBottom: 5,
    marginTop: 14,
  },
  sectionLabel: {
    fontSize: 7.5,
    fontFamily: "NotoSans", fontWeight: 700,
    color: ORANGE,
    letterSpacing: 1.0,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  sectionBody: {
    fontSize: 8.5,
    color: GRAY,
    lineHeight: 1.55,
    marginBottom: 8,
  },

  // Contract data fields (key-value)
  kvSection: {
    marginBottom: 16,
  },
  kvRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  kvLabel: {
    fontSize: 8,
    fontFamily: "NotoSans", fontWeight: 700,
    color: GRAY,
    width: 130,
    flexShrink: 0,
  },
  kvValue: {
    fontSize: 8.5,
    color: DARK,
    flex: 1,
    lineHeight: 1.4,
  },

  // Boilerplate sections
  boilerplateSection: {
    marginBottom: 8,
  },
  boilerplateTitle: {
    fontSize: 8.5,
    fontFamily: "NotoSans", fontWeight: 700,
    color: DARK,
    marginBottom: 3,
  },
  boilerplateBody: {
    fontSize: 8,
    color: GRAY,
    lineHeight: 1.5,
  },

  // Signature block
  signatureSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 16,
    flexDirection: "row",
    gap: 20,
  },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 4,
    padding: 12,
  },
  signaturePartyLabel: {
    fontSize: 7,
    fontFamily: "NotoSans", fontWeight: 700,
    color: ORANGE,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  signaturePartyName: {
    fontSize: 9,
    fontFamily: "NotoSans", fontWeight: 700,
    color: DARK,
    marginBottom: 24,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: DARK,
    marginBottom: 4,
  },
  signatureFieldLabel: {
    fontSize: 7.5,
    color: LIGHT_GRAY,
    marginBottom: 8,
  },
  signatureNote: {
    fontSize: 7,
    color: LIGHT_GRAY,
    marginTop: 8,
    lineHeight: 1.4,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 18,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 7,
    color: LIGHT_GRAY,
  },
  footerRight: {
    fontSize: 7,
    color: LIGHT_GRAY,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function ContractPdfDocument({
  contract,
}: {
  contract: ContractWithDetails;
}) {
  const contractTypeLabel = getContractTypeLabel(contract.contract_type);
  const contractDataFields = renderContractDataFields(contract.contract_data);

  // Split contract_data into known sections and custom fields
  const deliverables =
    typeof contract.contract_data === "object" &&
    !Array.isArray(contract.contract_data) &&
    contract.contract_data !== null
      ? (contract.contract_data as Record<string, Json>)["deliverables"]
      : undefined;

  const paymentTerms =
    typeof contract.contract_data === "object" &&
    !Array.isArray(contract.contract_data) &&
    contract.contract_data !== null
      ? (contract.contract_data as Record<string, Json>)["payment_terms"]
      : undefined;

  // Custom fields - everything except deliverables and payment_terms
  const customFields = contractDataFields.filter(
    (f) =>
      f.label.toLowerCase() !== "deliverables" &&
      f.label.toLowerCase() !== "payment terms"
  );

  return (
    <Document
      title={`${contract.title} - ${contract.client.company_name}`}
      author={WODO_COMPANY}
    >
      <Page size="A4" style={styles.page}>

        {/* Top tagline bar */}
        <View style={styles.taglineBar}>
          <Text style={styles.taglineText}>
            DESIGN  |  DEVELOPMENT  |  DIGITAL GROWTH
          </Text>
        </View>

        {/* Header: company info + contract meta */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>WODO Digital</Text>
            <Text style={styles.companyDetail}>{WODO_COMPANY}</Text>
            <Text style={styles.companyDetail}>GSTIN: {WODO_GSTIN}</Text>
            <Text style={styles.companyDetail}>{WODO_ADDRESS_LINE1},</Text>
            <Text style={styles.companyDetail}>{WODO_ADDRESS_LINE2}</Text>
            <Text style={styles.companyDetail}>{WODO_EMAIL}  |  {WODO_PHONE}</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.contractTitle}>Contract</Text>
            <Text style={styles.contractId}>
              Ref: {contract.id.slice(0, 8).toUpperCase()}
            </Text>
            {contract.contract_date && (
              <Text style={styles.contractDate}>
                Date: {formatDate(contract.contract_date)}
              </Text>
            )}
            {contract.signed_date && (
              <Text style={styles.contractDate}>
                Signed: {formatDate(contract.signed_date)}
              </Text>
            )}
          </View>
        </View>

        {/* Document title */}
        <View style={styles.docTitleSection}>
          <Text style={styles.docTitle}>{contract.title}</Text>
          <Text style={styles.docSubtitle}>{contractTypeLabel}</Text>
        </View>

        <View style={styles.divider} />

        {/* Party details */}
        <Text style={styles.sectionLabel}>Parties to this Agreement</Text>
        <View style={styles.partyRow}>
          {/* WODO as Service Provider */}
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Service Provider</Text>
            <Text style={styles.partyName}>{WODO_COMPANY}</Text>
            <Text style={styles.partyDetail}>{WODO_ADDRESS_LINE1}</Text>
            <Text style={styles.partyDetail}>{WODO_ADDRESS_LINE2}</Text>
            <Text style={styles.partyDetail}>GSTIN: {WODO_GSTIN}</Text>
            <Text style={styles.partyDetail}>{WODO_EMAIL}</Text>
            <Text style={styles.partyDetail}>{WODO_PHONE}</Text>
          </View>

          {/* Client */}
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Client</Text>
            <Text style={styles.partyName}>{contract.client.company_name}</Text>
            <Text style={styles.partyDetail}>
              Currency: {contract.client.currency}
            </Text>
            {contract.project && (
              <Text style={styles.partyDetail}>
                Project: {contract.project.name}
              </Text>
            )}
          </View>
        </View>

        {/* Section 1: Work and Payment */}
        <Text style={styles.sectionHeading}>1. Work and Payment</Text>

        {/* Section 1.1: Deliverables */}
        <Text style={styles.sectionLabel}>1.1 Deliverables</Text>
        {deliverables ? (
          <Text style={styles.sectionBody}>{String(deliverables)}</Text>
        ) : (
          <Text style={styles.sectionBody}>
            As agreed between the parties and detailed in the project brief.
          </Text>
        )}

        {/* Section 1.2: Payment Terms */}
        <Text style={styles.sectionLabel}>1.2 Payment Terms</Text>
        {paymentTerms ? (
          <Text style={styles.sectionBody}>{String(paymentTerms)}</Text>
        ) : (
          <Text style={styles.sectionBody}>
            As per the agreed invoice schedule. All payments are due within the
            timeframe specified on each invoice.
          </Text>
        )}

        {/* Additional contract data fields */}
        {customFields.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Additional Terms</Text>
            <View style={styles.kvSection}>
              {customFields.map((field, idx) => (
                <View key={idx} style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{field.label}</Text>
                  <Text style={styles.kvValue}>{field.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Notes */}
        {contract.notes && (
          <>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.sectionBody}>{contract.notes}</Text>
          </>
        )}

        {/* Boilerplate sections 2-11 */}
        <View style={[styles.divider, { marginTop: 12 }]} />
        <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>
          General Terms and Conditions
        </Text>
        {BOILERPLATE_SECTIONS.map((section, idx) => (
          <View key={idx} style={styles.boilerplateSection} wrap={false}>
            <Text style={styles.boilerplateTitle}>{section.title}</Text>
            <Text style={styles.boilerplateBody}>{section.body}</Text>
          </View>
        ))}

        {/* Signature block */}
        <View style={styles.signatureSection} wrap={false}>
          {/* WODO signature */}
          <View style={styles.signatureBox}>
            <Text style={styles.signaturePartyLabel}>For Service Provider</Text>
            <Text style={styles.signaturePartyName}>{WODO_COMPANY}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureFieldLabel}>Signature</Text>
            <Text style={styles.signatureFieldLabel}>
              Name: {WODO_CEO}
            </Text>
            <Text style={styles.signatureFieldLabel}>
              Designation: Chief Executive Officer
            </Text>
            <Text style={styles.signatureFieldLabel}>Date:</Text>
            <Text style={styles.signatureNote}>
              Stamp / Seal of {WODO_COMPANY}
            </Text>
          </View>

          {/* Client signature */}
          <View style={styles.signatureBox}>
            <Text style={styles.signaturePartyLabel}>For Client</Text>
            <Text style={styles.signaturePartyName}>
              {contract.client.company_name}
            </Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureFieldLabel}>Signature</Text>
            <Text style={styles.signatureFieldLabel}>Name:</Text>
            <Text style={styles.signatureFieldLabel}>Designation:</Text>
            <Text style={styles.signatureFieldLabel}>Date:</Text>
            <Text style={styles.signatureNote}>
              Stamp / Seal of {contract.client.company_name}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text
            style={styles.footerLeft}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
          <Text style={styles.footerRight}>{WODO_WEBSITE}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── generateContractPdf ──────────────────────────────────────────────────────

export async function generateContractPdf(
  contract: ContractWithDetails
): Promise<Uint8Array> {
  const element = React.createElement(
    ContractPdfDocument,
    { contract }
  ) as unknown as React.ReactElement<DocumentProps>;

  const blob = await pdf(element).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
