import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoicePdfProps {
  invoice: {
    invoice_number: string | null;
    proforma_ref: string | null;
    invoice_type: "gst" | "international" | "non_gst" | "proforma";
    invoice_date: string;
    due_date: string | null;
    currency: string;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total_amount: number;
    notes: string | null;
    billing_period_start: string | null;
    billing_period_end: string | null;
  };
  client: {
    company_name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    country: string;
    gstin: string | null;
    tax_number: string | null;
    tax_number_label: string | null;
  };
  lineItems: Array<{ description: string; amount: number; quantity: number }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string): string {
  const sym =
    currency === "USD"
      ? "$"
      : currency === "AED"
      ? "AED "
      : currency === "GBP"
      ? "GBP "
      : "Rs.";
  return `${sym}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getInvoiceTitle(
  invoiceType: InvoicePdfProps["invoice"]["invoice_type"]
): string {
  if (invoiceType === "proforma") return "PROFORMA INVOICE";
  if (invoiceType === "gst") return "TAX INVOICE";
  return "INVOICE";
}

function getInvoiceRef(invoice: InvoicePdfProps["invoice"]): string {
  if (invoice.invoice_type === "proforma") {
    return invoice.proforma_ref ?? "PF-PENDING";
  }
  return invoice.invoice_number ?? "DRAFT";
}

function getBankDetails(
  invoiceType: InvoicePdfProps["invoice"]["invoice_type"],
  currency: string
): Array<{ label: string; value: string }> {
  if (invoiceType === "gst") {
    return [
      { label: "Bank", value: "IDFC FIRST Bank" },
      { label: "Account Number", value: "10113982735" },
      { label: "IFSC Code", value: "IDFB0080181" },
      { label: "Account Name", value: "WODO Digital Private Limited" },
      { label: "Account Type", value: "Current Account" },
    ];
  }

  if (invoiceType === "non_gst") {
    return [
      { label: "Bank", value: "IDFC FIRST Bank" },
      { label: "Account Number", value: "10113982735" },
      { label: "IFSC Code", value: "IDFB0080181" },
      { label: "Account Name", value: "WODO Digital Private Limited" },
      { label: "Account Type", value: "Current Account" },
    ];
  }

  // International - based on currency
  if (currency === "USD") {
    return [
      { label: "Account Holder", value: "WODO DIGITAL PRIVATE LIMITED" },
      { label: "Payment Method", value: "ACH" },
      { label: "ACH Routing No.", value: "026073150" },
      { label: "Account Number", value: "8335312671" },
      { label: "Bank Name", value: "Community Federal Savings Bank" },
      { label: "Bank Address", value: "5 Penn Plaza, 14th Floor, New York, NY 10001, US" },
      { label: "Account Currency", value: "USD" },
    ];
  }

  if (currency === "AED") {
    return [
      { label: "Account Holder", value: "WODO DIGITAL PRIVATE LIMITED" },
      { label: "Payment Method", value: "IPP / FTS" },
      { label: "IBAN", value: "AE190960000691060009302" },
      { label: "BIC / SWIFT", value: "ZANDAEAAXXX" },
      { label: "Bank Name", value: "Zand Bank PJSC" },
      { label: "Bank Address", value: "1st Floor, Emaar Square, Building 6, Dubai, UAE" },
      { label: "Account Currency", value: "AED" },
    ];
  }

  if (currency === "GBP") {
    return [
      { label: "Beneficiary", value: "WODO DIGITAL PRIVATE LIMITED" },
      { label: "Payment Method", value: "BACS / SWIFT" },
      { label: "Note", value: "GBP transfer details - contact accounts@wodo.digital" },
    ];
  }

  return [
    { label: "Beneficiary", value: "WODO DIGITAL PRIVATE LIMITED" },
    { label: "Note", value: "Transfer details - contact accounts@wodo.digital" },
  ];
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ORANGE = "#fd7e14";
const DARK = "#1a1a1a";
const GRAY = "#555555";
const LIGHT_GRAY = "#888888";
const TABLE_HEADER_BG = "#fd7e14";
const SUBTOTAL_BG = "#f9f9f9";
const BORDER_COLOR = "#e0e0e0";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 9,
    color: DARK,
  },

  // Tagline bar
  taglineBar: {
    backgroundColor: ORANGE,
    marginHorizontal: -40,
    paddingHorizontal: 40,
    paddingVertical: 6,
    marginBottom: 24,
  },
  taglineText: {
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
  },

  // Header row
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    width: 120,
    height: 36,
    objectFit: "contain",
    marginBottom: 8,
  },
  companyName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 7.5,
    color: GRAY,
    marginBottom: 1,
  },
  headerRight: {
    alignItems: "flex-end",
    minWidth: 180,
  },
  invoiceTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    marginBottom: 6,
  },
  invoiceRef: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 3,
  },
  invoiceMeta: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 2,
  },

  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    marginBottom: 16,
  },

  // Bill To
  billToSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  billToName: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 2,
  },
  billToDetail: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 1,
  },

  // Billing period
  billingPeriodRow: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#fff9f4",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#fde8cf",
  },
  billingPeriodLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    letterSpacing: 0.8,
    marginRight: 8,
  },
  billingPeriodValue: {
    fontSize: 8,
    color: GRAY,
  },

  // Line items table
  table: {
    marginBottom: 0,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: TABLE_HEADER_BG,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  tableRowAlt: {
    backgroundColor: SUBTOTAL_BG,
  },
  colDescription: {
    flex: 7,
    paddingRight: 8,
  },
  colAmount: {
    flex: 3,
    textAlign: "right",
  },
  rowDescription: {
    fontSize: 8.5,
    color: DARK,
    lineHeight: 1.4,
  },
  rowAmount: {
    fontSize: 8.5,
    color: DARK,
    textAlign: "right",
    fontFamily: "Helvetica",
  },

  // Totals
  totalsSection: {
    marginTop: 0,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 220,
  },
  totalLabel: {
    fontSize: 8.5,
    color: GRAY,
  },
  totalValue: {
    fontSize: 8.5,
    color: DARK,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 220,
    borderTopWidth: 2,
    borderTopColor: ORANGE,
    marginTop: 2,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  grandTotalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    textAlign: "right",
  },

  // Bank details
  bankSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 14,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bankLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    width: 90,
  },
  bankValue: {
    fontSize: 7.5,
    color: DARK,
    flex: 1,
  },

  // Stamp and signature
  stampSection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    minHeight: 80,
  },
  stampBox: {
    alignItems: "center",
    minWidth: 130,
  },
  stampImage: {
    width: 70,
    height: 70,
    objectFit: "contain",
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 1,
  },
  signatureTitle: {
    fontSize: 7.5,
    color: GRAY,
  },

  // Notes
  notesSection: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
  },
  notesText: {
    fontSize: 8,
    color: GRAY,
    lineHeight: 1.5,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 8,
    textAlign: "center",
  },
  footerText: {
    fontSize: 7,
    color: LIGHT_GRAY,
    textAlign: "center",
    lineHeight: 1.5,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoicePdf({ invoice, client, lineItems }: InvoicePdfProps) {
  const invoiceTitle = getInvoiceTitle(invoice.invoice_type);
  const invoiceRef = getInvoiceRef(invoice);
  const bankDetails = getBankDetails(invoice.invoice_type, invoice.currency);
  const hasBillingPeriod = invoice.billing_period_start && invoice.billing_period_end;

  return (
    <Document
      title={`${invoiceTitle} ${invoiceRef}`}
      author="WODO Digital Private Limited"
    >
      <Page size="A4" style={styles.page}>

        {/* Tagline bar */}
        <View style={styles.taglineBar}>
          <Text style={styles.taglineText}>
            DESIGN  |  DEVELOPMENT  |  DIGITAL GROWTH
          </Text>
        </View>

        {/* Header row: logo + company info | invoice title + ref */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src="/public/wodo-logo.png"
              style={styles.logo}
            />
            <Text style={styles.companyName}>WODO Digital Private Limited</Text>
            <Text style={styles.companyDetail}>GSTIN: 29AADCW8591N1ZA</Text>
            <Text style={styles.companyDetail}>CIN: U72900KA2021PTC153659</Text>
            <Text style={styles.companyDetail}>
              #1, First Floor, Shree Lakshmi Arcade, BDA Layout,
            </Text>
            <Text style={styles.companyDetail}>
              Nagarbhavi, Bangalore - 560091
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>{invoiceTitle}</Text>
            <Text style={styles.invoiceRef}>{invoiceRef}</Text>
            <Text style={styles.invoiceMeta}>
              Date: {formatDate(invoice.invoice_date)}
            </Text>
            {invoice.due_date && (
              <Text style={styles.invoiceMeta}>
                Due: {formatDate(invoice.due_date)}
              </Text>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bill To */}
        <View style={styles.billToSection}>
          <Text style={styles.sectionLabel}>BILL TO</Text>
          <Text style={styles.billToName}>{client.company_name}</Text>
          {client.address && (
            <Text style={styles.billToDetail}>{client.address}</Text>
          )}
          {(client.city || client.state || client.pincode) && (
            <Text style={styles.billToDetail}>
              {[client.city, client.state, client.pincode]
                .filter(Boolean)
                .join(", ")}
            </Text>
          )}
          <Text style={styles.billToDetail}>{client.country}</Text>
          {client.gstin && (
            <Text style={styles.billToDetail}>GSTIN: {client.gstin}</Text>
          )}
          {client.tax_number && (
            <Text style={styles.billToDetail}>
              {client.tax_number_label ?? "Tax No"}: {client.tax_number}
            </Text>
          )}
        </View>

        {/* Billing period (if set) */}
        {hasBillingPeriod && (
          <View style={styles.billingPeriodRow}>
            <Text style={styles.billingPeriodLabel}>BILLING PERIOD</Text>
            <Text style={styles.billingPeriodValue}>
              {formatDate(invoice.billing_period_start!)} to{" "}
              {formatDate(invoice.billing_period_end!)}
            </Text>
          </View>
        )}

        {/* Line items table */}
        <View style={styles.table}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>
              PARTICULARS
            </Text>
            <Text
              style={[
                styles.tableHeaderText,
                styles.colAmount,
                { textAlign: "right" },
              ]}
            >
              AMOUNT
            </Text>
          </View>

          {/* Line items */}
          {lineItems.map((item, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 !== 0 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.rowDescription, styles.colDescription]}>
                {item.description}
                {item.quantity > 1 ? ` (x${item.quantity})` : ""}
              </Text>
              <Text style={[styles.rowAmount, styles.colAmount]}>
                {formatCurrency(item.amount * item.quantity, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal, invoice.currency)}
            </Text>
          </View>

          {invoice.invoice_type === "gst" && invoice.tax_rate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                GST @ {invoice.tax_rate}%
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.tax_amount, invoice.currency)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total_amount, invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>NOTES</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Bank details */}
        <View style={styles.bankSection}>
          <Text style={styles.sectionLabel}>BANK DETAILS</Text>
          {bankDetails.map((row, idx) => (
            <View key={idx} style={styles.bankRow}>
              <Text style={styles.bankLabel}>{row.label}:</Text>
              <Text style={styles.bankValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Stamp and signature */}
        <View style={styles.stampSection}>
          <View style={styles.stampBox}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src="/public/wodo-stamp.png"
              style={styles.stampImage}
            />
            <Text style={styles.signatureName}>Shyam Singh Bhati</Text>
            <Text style={styles.signatureTitle}>Authorized Signatory</Text>
            <Text style={styles.signatureTitle}>WODO Digital Private Limited</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Questions? Email us at accounts@wodo.digital or call +91 63621 80633
          </Text>
          <Text style={styles.footerText}>
            #1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore - 560091
          </Text>
        </View>
      </Page>
    </Document>
  );
}
