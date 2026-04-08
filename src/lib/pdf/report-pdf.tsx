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
import { registerPdfFonts } from "./register-fonts";

// Register Unicode-capable fonts (Noto Sans) for rupee symbol and extended chars
registerPdfFonts();

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface InvestorReportWithData {
  id: string;
  title: string;
  report_month: number;
  report_year: number;
  report_type?: "monthly" | "quarterly" | "annual";
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

// ─── Chart Styles ─────────────────────────────────────────────────────────────

const CHART_COLORS = ["#fd7e14", "#3b82f6", "#8b5cf6", "#22c55e", "#ec4899", "#06b6d4", "#f59e0b", "#ef4444"];

const chartStyles = StyleSheet.create({
  barContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  barLabel: {
    width: 80,
    fontSize: 8.5,
    color: DARK,
    fontFamily: "Helvetica-Bold",
  },
  barTrack: {
    flex: 1,
    height: 22,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  barFill: {
    height: 22,
    borderRadius: 4,
    position: "absolute",
    top: 0,
    left: 0,
  },
  barValue: {
    fontSize: 8,
    color: DARK,
    marginLeft: 8,
    width: 70,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  // Client distribution
  clientBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  clientBarLabel: {
    width: 120,
    fontSize: 7.5,
    color: DARK,
    overflow: "hidden",
  },
  clientBarTrack: {
    flex: 1,
    height: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 3,
    overflow: "hidden",
    position: "relative",
  },
  clientBarFill: {
    height: 16,
    borderRadius: 3,
    position: "absolute",
    top: 0,
    left: 0,
  },
  clientBarPct: {
    fontSize: 7,
    color: GRAY,
    marginLeft: 6,
    width: 30,
    textAlign: "right",
  },
  clientBarAmt: {
    fontSize: 7,
    color: DARK,
    marginLeft: 4,
    width: 55,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  // Ratios
  ratiosGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  ratioBox: {
    flex: 1,
    backgroundColor: SECTION_BG,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    alignItems: "center",
  },
  ratioLabel: {
    fontSize: 7.5,
    color: GRAY,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  ratioValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
  },
  ratioTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#e5e5e5",
    borderRadius: 3,
    overflow: "hidden",
    position: "relative",
  },
  ratioFill: {
    height: 6,
    borderRadius: 3,
    position: "absolute",
    top: 0,
    left: 0,
  },
});

// ─── Chart Components ─────────────────────────────────────────────────────────

function RevenueExpenseChart({
  revenue,
  expenses,
  netProfit,
}: {
  revenue: number;
  expenses: number;
  netProfit: number;
}) {
  const maxVal = Math.max(revenue, expenses, Math.abs(netProfit), 1);
  const items = [
    { label: "Revenue", value: revenue, color: "#16a34a" },
    { label: "Expenses", value: expenses, color: "#ef4444" },
    { label: "Net Profit", value: Math.max(netProfit, 0), color: ORANGE },
  ];

  return (
    <View style={chartStyles.barContainer}>
      {items.map((item, idx) => {
        const pct = Math.min((item.value / maxVal) * 100, 100);
        return (
          <View key={idx} style={chartStyles.barRow}>
            <Text style={chartStyles.barLabel}>{item.label}</Text>
            <View style={chartStyles.barTrack}>
              <View
                style={[
                  chartStyles.barFill,
                  { width: `${Math.max(pct, 2)}%`, backgroundColor: item.color },
                ]}
              />
            </View>
            <Text style={chartStyles.barValue}>{formatINR(item.value)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ClientDistributionChart({
  clients,
  totalRevenue,
}: {
  clients: Array<{ name: string; revenue: number }>;
  totalRevenue: number;
}) {
  const maxRevenue = Math.max(...clients.map((c) => c.revenue), 1);

  return (
    <View style={{ marginTop: 6 }}>
      {clients.slice(0, 8).map((client, idx) => {
        const pct = totalRevenue > 0 ? (client.revenue / totalRevenue) * 100 : 0;
        const barPct = (client.revenue / maxRevenue) * 100;
        return (
          <View key={idx} style={chartStyles.clientBar}>
            <Text style={chartStyles.clientBarLabel}>
              {client.name.length > 20 ? client.name.slice(0, 18) + "..." : client.name}
            </Text>
            <View style={chartStyles.clientBarTrack}>
              <View
                style={[
                  chartStyles.clientBarFill,
                  {
                    width: `${Math.max(barPct, 3)}%`,
                    backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  },
                ]}
              />
            </View>
            <Text style={chartStyles.clientBarPct}>{pct.toFixed(1)}%</Text>
            <Text style={chartStyles.clientBarAmt}>{formatINR(client.revenue)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function RatioGauge({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: number;
  suffix: string;
  color: string;
}) {
  const safeVal = Number.isFinite(value) ? Math.max(0, Math.min(value, 100)) : 0;

  return (
    <View style={chartStyles.ratioBox}>
      <Text style={chartStyles.ratioLabel}>{label}</Text>
      <Text style={[chartStyles.ratioValue, { color }]}>
        {safeVal.toFixed(1)}{suffix}
      </Text>
      <View style={chartStyles.ratioTrack}>
        <View
          style={[
            chartStyles.ratioFill,
            { width: `${safeVal}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

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
      title={`${report.report_type === "quarterly" ? "Quarterly" : report.report_type === "annual" ? "Annual" : "Monthly"} Investor Report - ${monthYear}`}
      author="WODO Digital Private Limited"
    >
      <Page size="A4" style={styles.page}>

        {/* Cover header */}
        <View style={styles.coverBar}>
          <Text style={styles.coverTagline}>
            DESIGN  |  DEVELOPMENT  |  DIGITAL GROWTH
          </Text>
          <Text style={styles.coverTitle}>{report.report_type === "quarterly" ? "Quarterly" : report.report_type === "annual" ? "Annual" : "Monthly"} Performance Report</Text>
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

      {/* Page 2 - Visual Charts */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.coverBar, { paddingVertical: 16 }]}>
          <Text style={styles.coverTagline}>VISUAL ANALYTICS</Text>
          <Text style={[styles.coverTitle, { fontSize: 16 }]}>
            {report.report_type === "quarterly" ? "Quarterly" : report.report_type === "annual" ? "Annual" : "Monthly"} Performance Charts
          </Text>
          <Text style={styles.coverSubtitle}>{monthYear} - FY {d.financialYear}</Text>
        </View>

        {/* Revenue vs Expenses Bar Chart */}
        <Text style={styles.sectionHeading}>Revenue vs Expenses</Text>
        <RevenueExpenseChart revenue={d.revenue} expenses={d.expenses} netProfit={d.netProfit} />

        {/* Client Revenue Distribution */}
        {d.topClients && d.topClients.length > 0 && (
          <>
            <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Client Revenue Distribution</Text>
            <ClientDistributionChart clients={d.topClients} totalRevenue={d.revenue} />
          </>
        )}

        {/* Key Ratios */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Key Financial Ratios</Text>
        <View style={chartStyles.ratiosGrid}>
          <RatioGauge
            label="Profit Margin"
            value={d.revenue > 0 ? (d.netProfit / d.revenue) * 100 : 0}
            suffix="%"
            color={d.netProfit >= 0 ? "#16a34a" : "#ef4444"}
          />
          <RatioGauge
            label="Expense Ratio"
            value={d.revenue > 0 ? (d.expenses / d.revenue) * 100 : 0}
            suffix="%"
            color={d.expenses / Math.max(d.revenue, 1) > 0.8 ? "#ef4444" : ORANGE}
          />
          <RatioGauge
            label="Collection Rate"
            value={d.revenue > 0 ? ((d.revenue - d.outstandingInvoices) / d.revenue) * 100 : 0}
            suffix="%"
            color="#3b82f6"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBold}>
            Confidential - WODO Digital Private Limited
          </Text>
          <Text style={styles.footerText}>
            accounts@wodo.digital  |  +91 63621 80633  |  www.wodo.digital
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
