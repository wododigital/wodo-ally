import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import type { ReportData } from "@/lib/hooks/use-reports";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface InvestorReportWithData {
  id: string;
  title: string;
  report_month: number;
  report_year: number;
  financial_year: string;
  report_data: ReportData;
  status: "draft" | "generated" | "sent";
  pdf_url: string | null;
  sent_to: string[] | null;
  sent_at: string | null;
  generated_at: string;
  created_by: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (safe >= 10000000) {
    return `Rs.${(safe / 10000000).toFixed(2)}Cr`;
  }
  if (safe >= 100000) {
    return `Rs.${(safe / 100000).toFixed(2)}L`;
  }
  return `Rs.${safe.toLocaleString("en-IN")}`;
}

function getProfitMargin(revenue: number, netProfit: number): string {
  if (revenue === 0) return "0%";
  return `${((netProfit / revenue) * 100).toFixed(1)}%`;
}

// ─── Colors ────────────────────────────────────────────────────────────────────

const ORANGE = "#fd7e14";
const DARK = "#1a1a1a";
const DARK_BG = "#0f0f1a";
const GRAY = "#555555";
const LIGHT_GRAY = "#888888";
const BORDER_COLOR = "#e0e0e0";
const SECTION_BG = "#f8f8fc";

// ─── Styles ────────────────────────────────────────────────────────────────────

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

  // Cover header bar
  coverBar: {
    backgroundColor: DARK_BG,
    marginHorizontal: -40,
    paddingHorizontal: 40,
    paddingVertical: 28,
    marginBottom: 28,
  },
  coverTagline: {
    color: ORANGE,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    marginBottom: 8,
  },
  coverTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  coverSubtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    marginBottom: 8,
  },
  coverBadge: {
    backgroundColor: ORANGE,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  coverBadgeText: {
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },

  // Section heading
  sectionHeading: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 18,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e8ff",
  },

  // Metric cards grid
  metricsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  metricCard: {
    flex: 1,
    backgroundColor: SECTION_BG,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  metricLabel: {
    fontSize: 7.5,
    color: LIGHT_GRAY,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  metricSub: {
    fontSize: 7,
    color: GRAY,
    marginTop: 2,
  },
  metricValueGreen: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
  },
  metricValueOrange: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: ORANGE,
  },
  metricValueBlue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#3b82f6",
  },

  // Summary table
  table: {
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: ORANGE,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  tableRowAlt: {
    backgroundColor: SECTION_BG,
  },
  colLabel: {
    flex: 3,
  },
  colValue: {
    flex: 2,
    textAlign: "right",
  },
  rowLabel: {
    fontSize: 8.5,
    color: DARK,
  },
  rowValue: {
    fontSize: 8.5,
    color: DARK,
    textAlign: "right",
    fontFamily: "Helvetica",
  },
  rowValueGreen: {
    fontSize: 8.5,
    color: "#16a34a",
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },

  // Client summary
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  clientRank: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  clientRankText: {
    color: "#ffffff",
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },
  clientName: {
    flex: 3,
    fontSize: 8.5,
    color: DARK,
  },
  clientRevenue: {
    flex: 2,
    fontSize: 8.5,
    color: DARK,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: SECTION_BG,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 7.5,
    color: GRAY,
    textAlign: "center",
  },

  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    marginVertical: 12,
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
  },
  footerText: {
    fontSize: 7,
    color: LIGHT_GRAY,
    textAlign: "center",
    lineHeight: 1.5,
  },
  footerBold: {
    fontSize: 7,
    color: GRAY,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
});

// ─── Component ─────────────────────────────────────────────────────────────────

export function ReportPdfDocument({ report }: { report: InvestorReportWithData }) {
  const d = report.report_data as ReportData;
  const monthYear = `${d.month} ${d.year}`;
  const profitMargin = getProfitMargin(d.revenue, d.netProfit);
  const isProfitable = d.netProfit >= 0;

  const financialRows = [
    { label: "Total Revenue", value: formatINR(d.revenue ?? 0), isPositive: true },
    { label: "Total Expenses", value: formatINR(d.expenses ?? 0), isPositive: false },
    { label: "Net Profit / Loss", value: formatINR(d.netProfit ?? 0), isPositive: isProfitable },
    { label: "Profit Margin", value: profitMargin, isPositive: isProfitable },
    { label: "Outstanding Receivables", value: formatINR(d.outstandingInvoices ?? 0), isPositive: false },
  ];

  return (
    <Document
      title={`Monthly Investor Report - ${monthYear}`}
      author="WODO Digital Private Limited"
    >
      <Page size="A4" style={styles.page}>

        {/* Cover header */}
        <View style={styles.coverBar}>
          <Text style={styles.coverTagline}>
            DESIGN  |  DEVELOPMENT  |  DIGITAL GROWTH
          </Text>
          <Text style={styles.coverTitle}>Monthly Performance Report</Text>
          <Text style={styles.coverSubtitle}>
            {monthYear}  -  FY {d.financialYear}  -  WODO Digital Private Limited
          </Text>
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>CONFIDENTIAL</Text>
          </View>
        </View>

        {/* Key Metrics */}
        <Text style={styles.sectionHeading}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Revenue</Text>
            <Text style={styles.metricValueGreen}>{formatINR(d.revenue)}</Text>
            <Text style={styles.metricSub}>Total received this month</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Expenses</Text>
            <Text style={styles.metricValue}>{formatINR(d.expenses)}</Text>
            <Text style={styles.metricSub}>Total debit transactions</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Net Profit</Text>
            <Text style={isProfitable ? styles.metricValueOrange : styles.metricValue}>
              {formatINR(d.netProfit)}
            </Text>
            <Text style={styles.metricSub}>Margin: {profitMargin}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>MRR</Text>
            <Text style={styles.metricValueBlue}>{formatINR(d.mrr)}</Text>
            <Text style={styles.metricSub}>Active retainer revenue</Text>
          </View>
        </View>

        {/* Client Summary */}
        <Text style={styles.sectionHeading}>Client Summary</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{d.activeClients}</Text>
            <Text style={styles.statLabel}>Active Clients</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{d.newClients}</Text>
            <Text style={styles.statLabel}>New This Month</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{d.activeProjects}</Text>
            <Text style={styles.statLabel}>Active Projects</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatINR(d.outstandingInvoices)}</Text>
            <Text style={styles.statLabel}>Outstanding</Text>
          </View>
        </View>

        {/* Top Clients */}
        {d.topClients && d.topClients.length > 0 && (
          <>
            <Text style={[styles.sectionHeading, { marginTop: 16 }]}>Top Clients by Revenue</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>#</Text>
                <Text style={[styles.tableHeaderText, styles.colLabel]}>Client</Text>
                <Text style={[styles.tableHeaderText, styles.colValue]}>Revenue</Text>
              </View>
              {d.topClients.map((client, idx) => (
                <View key={idx} style={[styles.clientRow, idx % 2 !== 0 ? styles.tableRowAlt : {}]}>
                  <View style={[styles.clientRank, { flex: 1 }]}>
                    <Text style={styles.clientRankText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <Text style={styles.clientRevenue}>{formatINR(client.revenue)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Financial Snapshot */}
        <Text style={styles.sectionHeading}>Financial Snapshot</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderText, styles.colLabel]}>Metric</Text>
            <Text style={[styles.tableHeaderText, styles.colValue]}>Amount</Text>
          </View>
          {financialRows.map((row, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 !== 0 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.rowLabel, styles.colLabel]}>{row.label}</Text>
              <Text
                style={
                  row.label === "Total Revenue" || (row.label === "Net Profit / Loss" && row.isPositive)
                    ? [styles.rowValueGreen, styles.colValue]
                    : [styles.rowValue, styles.colValue]
                }
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBold}>
            Confidential - WODO Digital Private Limited
          </Text>
          <Text style={styles.footerText}>
            accounts@wodo.digital  |  +91 63621 80633  |  www.wodo.digital
          </Text>
          <Text style={styles.footerText}>
            #1, First Floor, Shree Lakshmi Arcade, BDA Layout, Nagarbhavi, Bangalore - 560091
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Generator function ────────────────────────────────────────────────────────

export async function generateReportPdf(report: InvestorReportWithData): Promise<Uint8Array> {
  const element = React.createElement(
    ReportPdfDocument,
    { report }
  );
  const blob = await pdf(element as unknown as React.ReactElement).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
