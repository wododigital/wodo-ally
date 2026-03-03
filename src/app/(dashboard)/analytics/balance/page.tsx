"use client";

import { Landmark, ShieldCheck, TrendingUp, CreditCard } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { DarkSection, DarkLabel, DarkCard } from "@/components/shared/dark-section";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { cn } from "@/lib/utils/cn";
import { useMonthlyPL, useDashboardKPIs } from "@/lib/hooks/use-analytics";

// ─── Static balance sheet items (to be replaced with DB when a balance sheet
//     table is added). Dynamic items derive from real data below.
// ─────────────────────────────────────────────────────────────────────────────

const FIXED_ASSETS = [
  { name: "Laptops & Equipment (net)", amount: 85000 },
  { name: "Office Furniture",          amount: 28000 },
];

const INTANGIBLE_ASSETS = [
  { name: "Domain Names & IP",           amount: 5000  },
  { name: "Software Licenses (prepaid)", amount: 12000 },
];

const STATIC_LIABILITIES = [
  { name: "Freelancer Dues Payable", amount: 45000  },
  { name: "GST Payable",             amount: 22400  },
  { name: "TDS Payable",             amount: 5500   },
];

const LONG_TERM_LIABILITIES = [
  { name: "Director Loan", amount: 100000 },
];

function sectionTotal(items: { name: string; amount: number }[]) {
  return items.reduce((s, i) => s + i.amount, 0);
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function BalancePage() {
  const { data: plRows, isLoading: plLoading } = useMonthlyPL();
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();

  const isLoading = plLoading || kpisLoading;

  // Derive dynamic values from real data
  const totalRevenue = (plRows ?? []).reduce((s, r) => s + r.total_revenue, 0);
  const totalExpenses = (plRows ?? []).reduce((s, r) => s + r.total_expenses, 0);
  const outstanding = kpis?.outstanding ?? 0;

  // Use YTD revenue minus expenses as proxy for bank balance (simplified)
  const estimatedBankBalance = Math.max(0, totalRevenue - totalExpenses);

  // Build dynamic asset sections
  const currentAssets = [
    { name: "Accounts Receivable (outstanding)", amount: outstanding },
    { name: "Security Deposits",                 amount: 30000 },
    { name: "Advance to Freelancers",            amount: 15000 },
  ];

  const ASSETS = [
    {
      category: "Current Assets",
      items: currentAssets,
    },
    {
      category: "Fixed Assets",
      items: FIXED_ASSETS,
    },
    {
      category: "Intangible Assets",
      items: INTANGIBLE_ASSETS,
    },
  ];

  const LIABILITIES = [
    {
      category: "Current Liabilities",
      items: STATIC_LIABILITIES,
    },
    {
      category: "Long-Term Liabilities",
      items: LONG_TERM_LIABILITIES,
    },
  ];

  const totalAssets      = ASSETS.flatMap((a) => a.items).reduce((s, i) => s + i.amount, 0);
  const totalLiabilities = LIABILITIES.flatMap((a) => a.items).reduce((s, i) => s + i.amount, 0);
  const netWorth         = totalAssets - totalLiabilities;

  const currentRatioCurrent = outstanding + 30000 + 15000; // current assets
  const currentRatioLiab    = sectionTotal(STATIC_LIABILITIES);
  const currentRatio        = currentRatioLiab > 0 ? (currentRatioCurrent / currentRatioLiab).toFixed(1) : "N/A";

  const EQUITY = [
    { name: "Retained Earnings (FY 25-26)", amount: netWorth },
  ];

  const asOfDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-6">

      {/* As of banner */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Balance Sheet as of</span>
        <span className="text-xs font-semibold text-text-primary bg-accent-muted text-accent border border-accent-light px-2 py-0.5 rounded-button">
          {isLoading ? "..." : asOfDate}
        </span>
      </div>

      {/* Financial Position */}
      <DarkSection>
        <DarkLabel>Financial Position</DarkLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <DarkCard key={i} className="p-5 space-y-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-3 w-32" />
                </DarkCard>
              ))
            : [
                {
                  icon: Landmark,
                  label: "Est. Bank balance",
                  value: `Rs.${(estimatedBankBalance / 100000).toFixed(2)}L`,
                  sub: "Revenue minus expenses (YTD)",
                  color: "#22c55e",
                },
                {
                  icon: CreditCard,
                  label: "Receivables",
                  value: `Rs.${(outstanding / 1000).toFixed(1)}K`,
                  sub: "Overdue + sent invoices",
                  color: "#f59e0b",
                },
                {
                  icon: ShieldCheck,
                  label: "Net worth",
                  value: `Rs.${(netWorth / 100000).toFixed(2)}L`,
                  sub: "Assets minus liabilities",
                  color: "#fd7e14",
                },
                {
                  icon: TrendingUp,
                  label: "Current ratio",
                  value: `${currentRatio}x`,
                  sub: "Above 1.5 is healthy",
                  color: "#3b82f6",
                },
              ].map((stat) => (
                <DarkCard key={stat.label} className="p-5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-3"
                    style={{ background: `${stat.color}18` }}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <p className="text-xl font-light font-sans mb-0.5" style={{ color: "rgba(255,255,255,0.92)" }}>
                    {stat.value}
                  </p>
                  <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{stat.sub}</p>
                </DarkCard>
              ))}
        </div>
      </DarkSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Assets
            {isLoading ? (
              <Skeleton className="ml-auto h-4 w-20" />
            ) : (
              <span className="ml-auto font-sans text-green-500">Rs.{(totalAssets / 100000).toFixed(2)}L</span>
            )}
          </h3>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {ASSETS.map((section) => {
                const secTotal = sectionTotal(section.items);
                return (
                  <div key={section.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{section.category}</span>
                      <span className="text-xs font-sans font-semibold text-text-secondary">Rs.{(secTotal / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="space-y-1.5 pl-2 border-l-2 border-green-200/60">
                      {section.items.filter((i) => i.amount > 0).map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <span className="text-xs text-text-secondary">{item.name}</span>
                          <span className="text-xs font-sans text-text-primary">Rs.{item.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Liabilities + Equity */}
        <div className="space-y-4">
          <GlassCard padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Liabilities
              {isLoading ? (
                <Skeleton className="ml-auto h-4 w-16" />
              ) : (
                <span className="ml-auto font-sans text-red-400">Rs.{(totalLiabilities / 1000).toFixed(0)}K</span>
              )}
            </h3>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {LIABILITIES.map((section) => {
                  const secTotal = sectionTotal(section.items);
                  return (
                    <div key={section.category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{section.category}</span>
                        <span className="text-xs font-sans font-semibold text-text-secondary">Rs.{(secTotal / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="space-y-1.5 pl-2 border-l-2 border-red-200/60">
                        {section.items.filter((i) => i.amount > 0).map((item) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <span className="text-xs text-text-secondary">{item.name}</span>
                            <span className="text-xs font-sans text-text-primary">Rs.{item.amount.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>

          <GlassCard padding="md">
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              Equity
              {isLoading ? (
                <Skeleton className="ml-auto h-4 w-20" />
              ) : (
                <span className="ml-auto font-sans text-[#fd7e14]">Rs.{(netWorth / 100000).toFixed(2)}L</span>
              )}
            </h3>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <>
                <div className="space-y-1.5 pl-2 border-l-2 border-orange-200/60">
                  {EQUITY.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">{item.name}</span>
                      <span className="text-xs font-sans font-semibold text-[#fd7e14]">Rs.{(item.amount / 100000).toFixed(2)}L</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-black/[0.05] flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">Total Liab. + Equity</span>
                  <span className={cn(
                    "text-xs font-bold font-sans",
                    Math.abs(totalLiabilities + netWorth - totalAssets) < 1 ? "text-green-500" : "text-red-400"
                  )}>Rs.{((totalLiabilities + netWorth) / 100000).toFixed(2)}L</span>
                </div>
              </>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
