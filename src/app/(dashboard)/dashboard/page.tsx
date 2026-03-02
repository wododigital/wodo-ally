import { StatCard } from "@/components/shared/stat-card";
import { GlassCard } from "@/components/shared/glass-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import {
  IndianRupee, TrendingUp, Users, FileText,
  AlertCircle, Clock, CheckCircle2, Target,
  ArrowRight, Zap
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils/format";

// Seed data for dashboard
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
  },
  {
    title: "Active Clients",
    value: "6",
    change: "+2 this quarter",
    trend: "up" as const,
    icon: Users,
  },
  {
    title: "MRR",
    value: "Rs.3,85,000",
    change: "+12% vs Apr 2025",
    trend: "up" as const,
    icon: TrendingUp,
  },
];

const ATTENTION_ITEMS = [
  {
    id: "1",
    type: "overdue" as const,
    title: "Invoice NG00201 overdue",
    description: "Raj Enterprises - Rs.17,500 - 8 days overdue",
    action: "/invoices/bbbbbbbb-0000-0000-0000-000000000007",
    icon: AlertCircle,
  },
  {
    id: "2",
    type: "pending" as const,
    title: "Invoice G00111 sent - follow up",
    description: "Nandhini Hotel - Rs.76,700 - due Mar 8",
    action: "/invoices/bbbbbbbb-0000-0000-0000-000000000002",
    icon: Clock,
  },
  {
    id: "3",
    type: "action" as const,
    title: "March invoices not generated",
    description: "Maximus OIGA (Rs.59,000) draft needs review",
    action: "/invoices",
    icon: FileText,
  },
];

const RECENT_PAYMENTS = [
  { client: "Nandhini Hotel", amount: 76700, currency: "INR" as const, date: "2026-02-10", invoice: "G00110" },
  { client: "Sea Wonders", amount: 89600, currency: "INR" as const, date: "2026-02-18", invoice: "G00109 (AED 4,000)" },
  { client: "Maximus OIGA", amount: 53500, currency: "INR" as const, date: "2026-02-09", invoice: "G00112 (after TDS)" },
];

const TARGETS = [
  { title: "Annual Revenue FY 2025-26", current: 3845000, target: 6000000, unit: "INR" },
  { title: "Monthly MRR Target", current: 385000, target: 500000, unit: "INR" },
  { title: "New Clients Q4", current: 2, target: 5, unit: "clients" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Good morning, Shyam</h1>
          <p className="text-sm text-text-muted mt-1">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-button text-sm font-semibold text-white transition-all duration-200 hover:shadow-glow"
          style={{ background: "linear-gradient(135deg, #fd7e14, #e8720f)" }}
        >
          <Zap className="w-4 h-4" />
          New Invoice
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attention Required */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Needs Attention</h2>
            <span className="text-xs text-accent font-medium">{ATTENTION_ITEMS.length} items</span>
          </div>
          <div className="space-y-2">
            {ATTENTION_ITEMS.map((item) => (
              <Link key={item.id} href={item.action}>
                <GlassCard
                  padding="md"
                  className="flex items-start gap-4 group hover:border-white/15 transition-all duration-200"
                >
                  <div
                    className={`p-2 rounded-button shrink-0 ${
                      item.type === "overdue"
                        ? "bg-red-500/10 text-red-400"
                        : item.type === "action"
                        ? "bg-accent-muted text-accent"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{item.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors shrink-0" />
                </GlassCard>
              </Link>
            ))}
          </div>

          {/* Recent Payments */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-text-primary">Recent Payments</h2>
              <Link href="/payments" className="text-xs text-accent hover:text-accent-hover">
                View all
              </Link>
            </div>
            <GlassCard padding="none">
              {RECENT_PAYMENTS.map((payment, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-5 py-4 ${
                    idx < RECENT_PAYMENTS.length - 1 ? "border-b border-white/5" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{payment.client}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {payment.invoice} - {formatDate(payment.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CurrencyDisplay amount={payment.amount} currency={payment.currency} size="sm" />
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  </div>
                </div>
              ))}
            </GlassCard>
          </div>
        </div>

        {/* Financial Targets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Financial Targets</h2>
            <Link href="/targets" className="text-xs text-accent hover:text-accent-hover">
              Manage
            </Link>
          </div>
          <div className="space-y-3">
            {TARGETS.map((target) => {
              const pct = Math.min(Math.round((target.current / target.target) * 100), 100);
              return (
                <GlassCard key={target.title} padding="md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-secondary truncate">{target.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Target className="w-3 h-3 text-accent" />
                      <span className="text-xs font-bold text-accent">{pct}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? "#22c55e" : pct >= 50 ? "#fd7e14" : "#3b82f6",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted font-mono">
                        {target.unit === "INR"
                          ? `Rs.${(target.current / 100000).toFixed(1)}L`
                          : target.current}
                      </span>
                      <span className="text-text-muted font-mono">
                        {target.unit === "INR"
                          ? `Rs.${(target.target / 100000).toFixed(1)}L`
                          : target.target}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* Quick links */}
          <div className="mt-4">
            <h3 className="text-xs uppercase tracking-wider text-text-muted mb-2">Quick Access</h3>
            <div className="space-y-1">
              {[
                { href: "/clients/new", label: "Add new client" },
                { href: "/invoices/new", label: "Create invoice" },
                { href: "/expenses/upload", label: "Upload bank statement" },
                { href: "/reports", label: "Generate investor report" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between px-3 py-2 rounded-card text-xs text-text-secondary hover:text-text-primary hover:bg-surface-DEFAULT transition-all duration-150 group"
                >
                  {link.label}
                  <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-accent transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
