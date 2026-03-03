import { IndianRupee, TrendingUp, Users, Clock } from "lucide-react";
import { KpiCardV2 }             from "@/components/dashboard-v2/KpiCardV2";
import { DarkSectionTabs }       from "@/components/dashboard-v2/DarkSectionTabs";
import { HeroSectionV2 }         from "@/components/dashboard-v2/HeroSectionV2";

// ─── Seed data ────────────────────────────────────────────────────────────────

const STATS = [
  {
    title: "Revenue This Month",
    value: "Rs.3,21,700",
    change: "+18.4% vs last month",
    trend: "up" as const,
    icon: IndianRupee,
  },
  {
    title: "Outstanding",
    value: "Rs.2,53,500",
    change: "4 invoices pending",
    trend: "neutral" as const,
    icon: Clock,
    accentColor: "#f59e0b",
  },
  {
    title: "Active Clients",
    value: "6",
    change: "+2 this quarter",
    trend: "up" as const,
    icon: Users,
    accentColor: "#3b82f6",
  },
  {
    title: "MRR",
    value: "Rs.3,85,000",
    change: "+12% vs Apr 2025",
    trend: "up" as const,
    icon: TrendingUp,
    accentColor: "#16a34a",
  },
];

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
  { client: "Nandhini Hotel", amount: "Rs.76,700", date: "2026-02-10", invoice: "G00110" },
  { client: "Sea Wonders",    amount: "Rs.89,600", date: "2026-02-18", invoice: "G00109" },
  { client: "Maximus OIGA",   amount: "Rs.53,500", date: "2026-02-09", invoice: "G00112" },
  { client: "Raj Enterprises", amount: "Rs.28,200", date: "2026-01-31", invoice: "NG00198" },
];

const TARGETS = [
  { title: "Annual Revenue FY 2025-26", current: 3845000, target: 6000000, unit: "INR" },
  { title: "Monthly MRR Target",        current: 385000,  target: 500000,  unit: "INR" },
  { title: "New Clients Q4",            current: 2,       target: 5,       unit: "clients" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardV2Page() {
  return (
    <div className="space-y-10">

      {/* Hero section — Financial Snapshot */}
      <HeroSectionV2 />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-7">
        {STATS.map((stat) => (
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

      {/* Dark section with internal tabs */}
      <DarkSectionTabs
        attentionItems={ATTENTION_ITEMS}
        payments={RECENT_PAYMENTS}
        targets={TARGETS}
      />

    </div>
  );
}
