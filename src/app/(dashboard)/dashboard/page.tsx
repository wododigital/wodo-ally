"use client";

import { IndianRupee, TrendingUp, Users, Clock } from "lucide-react";
import { KpiCardV2 }          from "@/components/dashboard-v2/KpiCardV2";
import { DarkSectionTabs }    from "@/components/dashboard-v2/DarkSectionTabs";
import { HeroSectionV2 }      from "@/components/dashboard-v2/HeroSectionV2";
import { AnalyticsQuickBar }  from "@/components/dashboard-v2/AnalyticsQuickBar";
import { useDashboardKPIs }   from "@/lib/hooks/use-analytics";
import { StatCardSkeleton }   from "@/components/shared/loading-skeleton";

const ATTENTION_ITEMS = [
  {
    id: "1",
    type: "overdue" as const,
    title: "Invoice NG00201 overdue",
    client: "Raj Enterprises",
    amount: "Rs.17,500",
    dueLabel: "8 days overdue",
    action: "/invoices/bbbbbbbb-0000-0000-0000-000000000007",
  },
  {
    id: "2",
    type: "pending" as const,
    title: "Invoice G00111 sent - follow up",
    client: "Nandhini Hotel",
    amount: "Rs.76,700",
    dueLabel: "Due Mar 8",
    action: "/invoices/bbbbbbbb-0000-0000-0000-000000000002",
  },
  {
    id: "3",
    type: "action" as const,
    title: "March invoices not generated",
    client: "Maximus OIGA",
    amount: "Rs.59,000",
    dueLabel: "Draft - needs review",
    action: "/invoices",
  },
  {
    id: "4",
    type: "overdue" as const,
    title: "Invoice SW00304 payment delayed",
    client: "Sea Wonders",
    amount: "Rs.42,000",
    dueLabel: "12 days overdue",
    action: "/invoices",
  },
];

const RECENT_PAYMENTS = [
  { client: "Nandhini Hotel",  amount: "Rs.76,700", date: "2026-02-10", invoice: "G00110"   },
  { client: "Sea Wonders",     amount: "Rs.89,600", date: "2026-02-18", invoice: "G00109"   },
  { client: "Maximus OIGA",    amount: "Rs.53,500", date: "2026-02-09", invoice: "G00112"   },
  { client: "Raj Enterprises", amount: "Rs.28,200", date: "2026-01-31", invoice: "NG00198"  },
];

const TARGETS = [
  { title: "Annual Revenue FY 2025-26", current: 3845000, target: 6000000, unit: "INR"     },
  { title: "Monthly MRR Target",        current: 385000,  target: 500000,  unit: "INR"     },
  { title: "New Clients Q4",            current: 2,       target: 5,       unit: "clients" },
];

const PIPELINE_ITEMS = [
  {
    id: "1",
    client: "Nandhini Hotel",
    description: "SEO & GMB Retainer - April 2026",
    amount: "Rs.76,700",
    scheduledDate: "Apr 1",
    expectedPaymentDate: "Apr 8",
    type: "retainer" as const,
  },
  {
    id: "2",
    client: "Maximus OIGA",
    description: "SEO Retainer - April 2026",
    amount: "Rs.59,000",
    scheduledDate: "Apr 1",
    expectedPaymentDate: "Apr 16",
    type: "retainer" as const,
  },
  {
    id: "3",
    client: "Sea Wonders Tourism",
    description: "SEO & Digital Marketing - April 2026",
    amount: "Rs.89,600",
    scheduledDate: "Apr 1",
    expectedPaymentDate: "Apr 11",
    type: "retainer" as const,
  },
  {
    id: "4",
    client: "Godavari Heritage",
    description: "Brand Identity - Final Delivery",
    amount: "Rs.85,000",
    scheduledDate: "Apr 15",
    expectedPaymentDate: "Apr 29",
    type: "milestone" as const,
  },
];

function formatRevenue(amount: number): string {
  if (amount >= 100000) return `Rs.${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `Rs.${(amount / 1000).toFixed(1)}K`;
  return `Rs.${amount.toLocaleString("en-IN")}`;
}

export default function DashboardPage() {
  const { data: kpis, isLoading } = useDashboardKPIs();

  const momChange =
    kpis && kpis.revenue_last_month > 0
      ? ((kpis.revenue_this_month - kpis.revenue_last_month) /
          kpis.revenue_last_month) *
        100
      : 0;

  const momLabel =
    kpis && kpis.revenue_last_month > 0
      ? `${momChange >= 0 ? "+" : ""}${momChange.toFixed(1)}% vs last month`
      : "No prior month data";

  const overdueLabel =
    kpis
      ? `${kpis.overdue_invoices} invoice${kpis.overdue_invoices !== 1 ? "s" : ""} overdue`
      : "-";

  const STATS = [
    {
      title: "Revenue This Month",
      value: isLoading ? "-" : formatRevenue(kpis?.revenue_this_month ?? 0),
      change: isLoading ? "Loading..." : momLabel,
      trend: (momChange >= 0 ? "up" : "down") as "up" | "down" | "neutral",
      icon: IndianRupee,
    },
    {
      title: "Outstanding",
      value: isLoading ? "-" : formatRevenue(kpis?.outstanding ?? 0),
      change: isLoading ? "Loading..." : overdueLabel,
      trend: "neutral" as const,
      icon: Clock,
      accentColor: "#f59e0b",
    },
    {
      title: "Active Clients",
      value: isLoading ? "-" : String(kpis?.active_clients ?? 0),
      change: "Currently active",
      trend: "up" as const,
      icon: Users,
      accentColor: "#3b82f6",
    },
    {
      title: "MRR",
      value: isLoading ? "-" : formatRevenue(kpis?.mrr ?? 0),
      change: "Active retainer projects",
      trend: "up" as const,
      icon: TrendingUp,
      accentColor: "#16a34a",
    },
  ];

  return (
    <div className="space-y-10">
      <HeroSectionV2 />

      {/* Analytics quick access */}
      <AnalyticsQuickBar period="Mar 2026" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-7">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))
          : STATS.map((stat) => (
              <KpiCardV2
                key={stat.title}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                trend={stat.trend}
                icon={stat.icon}
                accentColor={stat.accentColor}
              />
            ))}
      </div>

      <DarkSectionTabs
        attentionItems={ATTENTION_ITEMS}
        payments={RECENT_PAYMENTS}
        targets={TARGETS}
        pipelineItems={PIPELINE_ITEMS}
      />
    </div>
  );
}
