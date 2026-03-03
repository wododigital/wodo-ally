import { IndianRupee, TrendingUp, Users, Clock, FileText, Receipt, FolderKanban } from "lucide-react";
import Link from "next/link";
import { KpiCardV2 }       from "@/components/dashboard-v2/KpiCardV2";
import { DarkSectionTabs } from "@/components/dashboard-v2/DarkSectionTabs";
import { HeroSectionV2 }   from "@/components/dashboard-v2/HeroSectionV2";

const QUICK_LINKS = [
  { label: "Revenue",  href: "/analytics/invoices?period=month", Icon: FileText,     color: "#fd7e14" },
  { label: "P&L",      href: "/analytics/pl?period=month",       Icon: TrendingUp,   color: "#22c55e" },
  { label: "Expenses", href: "/analytics/expenses?period=month", Icon: Receipt,      color: "#ef4444" },
  { label: "Clients",  href: "/analytics/clients?period=month",  Icon: Users,        color: "#3b82f6" },
  { label: "Projects", href: "/analytics/projects?period=month", Icon: FolderKanban, color: "#8b5cf6" },
];

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

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <HeroSectionV2 />

      {/* Analytics quick access */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-3">Mar 2026 · Analytics</p>
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {QUICK_LINKS.map(({ label, href, Icon, color }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-black/[0.06] text-xs font-medium text-text-secondary hover:border-black/[0.12] hover:text-text-primary transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
              {label}
            </Link>
          ))}
        </div>
      </div>

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

      <DarkSectionTabs
        attentionItems={ATTENTION_ITEMS}
        payments={RECENT_PAYMENTS}
        targets={TARGETS}
        pipelineItems={PIPELINE_ITEMS}
      />
    </div>
  );
}
