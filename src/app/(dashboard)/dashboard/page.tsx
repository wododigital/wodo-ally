"use client";

import { IndianRupee, TrendingUp, Users, Clock } from "lucide-react";
import { KpiCardV2 }          from "@/components/dashboard-v2/KpiCardV2";
import { DarkSectionTabs }    from "@/components/dashboard-v2/DarkSectionTabs";
import { HeroSectionV2 }      from "@/components/dashboard-v2/HeroSectionV2";
import { AnalyticsQuickBar }  from "@/components/dashboard-v2/AnalyticsQuickBar";
import { useDashboardKPIs, usePaymentsList } from "@/lib/hooks/use-analytics";
import { useCollectionsInvoices, useScheduledInvoices } from "@/lib/hooks/use-invoices";
import { useTargets }         from "@/lib/hooks/use-targets";
import { StatCardSkeleton }   from "@/components/shared/loading-skeleton";
import { formatCurrency }     from "@/lib/utils/format";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatRevenue(amount: number): string {
  if (amount >= 100000) return `Rs.${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `Rs.${(amount / 1000).toFixed(1)}K`;
  return `Rs.${amount.toLocaleString("en-IN")}`;
}

export default function DashboardPage() {
  const now = new Date();
  const currentPeriod = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const { data: kpis, isLoading }      = useDashboardKPIs();
  const { data: collections }          = useCollectionsInvoices();
  const { data: allPayments }          = usePaymentsList();
  const { data: allTargets }           = useTargets();
  const { data: scheduledInvoices }    = useScheduledInvoices();

  // Map collections invoices -> AttentionItem
  const attentionItems = (collections ?? []).slice(0, 6).map((inv) => ({
    id: inv.id,
    type: (
      inv.urgency === "overdue" ? "overdue" :
      inv.urgency === "due_soon" ? "pending" : "action"
    ) as "overdue" | "pending" | "action",
    title: `Invoice ${inv.invoice_number ?? ""} ${inv.urgency === "overdue" ? "overdue" : "pending"}`,
    client: inv.client_name,
    amount: formatCurrency(Number(inv.balance_due ?? 0)),
    dueLabel: inv.days_label,
    action: `/invoices/${inv.id}`,
    balanceDue: Number(inv.balance_due ?? 0),
  }));

  // Map payments -> PaymentItem (5 most recent)
  const recentPayments = (allPayments ?? []).slice(0, 5).map((p) => ({
    client: p.client_name,
    amount: formatCurrency(p.amount_received_inr ?? p.amount_received),
    date: p.payment_date,
    invoice: p.invoice_number ?? "",
    rawAmount: p.amount_received_inr ?? p.amount_received,
  }));

  // Map targets -> TargetItem
  const targetItems = (allTargets ?? []).map((t) => ({
    title: t.title,
    current: t.current_amount,
    target: t.target_amount,
    unit: t.target_type === "new_clients" ? "clients" : "INR",
    targetType: t.target_type,
  }));

  // Map scheduled invoices -> PipelineItem (next 6 pending)
  const pipelineItems = (scheduledInvoices ?? []).slice(0, 6).map((si) => {
    const scheduledDate  = new Date(si.scheduled_date);
    const expectedDate   = new Date(si.expected_payment_date);
    const scheduledLabel = `${MONTHS[scheduledDate.getMonth()]} ${scheduledDate.getDate()}`;
    const expectedLabel  = `${MONTHS[expectedDate.getMonth()]} ${expectedDate.getDate()}`;
    const eng = si.engagement_type;
    return {
      id: si.id,
      client: si.client_name,
      description: si.project_name,
      amount: si.display_amount,
      rawAmount: Number(si.amount),
      scheduledDate: scheduledLabel,
      expectedPaymentDate: expectedLabel,
      type: (eng === "retainer" ? "retainer" : eng === "milestone" ? "milestone" : "one_time") as "retainer" | "milestone" | "one_time",
    };
  });

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
      <AnalyticsQuickBar period={currentPeriod} />

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
        attentionItems={attentionItems}
        payments={recentPayments}
        targets={targetItems}
        pipelineItems={pipelineItems}
        monthlyReceived={kpis?.revenue_this_month}
        outstanding={kpis?.outstanding}
      />
    </div>
  );
}
