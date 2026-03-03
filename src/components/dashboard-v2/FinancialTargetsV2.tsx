interface TargetItem {
  title: string;
  current: number;
  target: number;
  unit: string;
}

interface FinancialTargetsV2Props {
  targets: TargetItem[];
  variant?: "light" | "dark";
}

function formatValue(value: number, unit: string): string {
  if (unit === "INR") {
    if (value >= 100000) return `Rs.${(value / 100000).toFixed(1)}L`;
    return `Rs.${value.toLocaleString("en-IN")}`;
  }
  return String(value);
}

function getBarColor(pct: number): string {
  if (pct >= 80) return "#16a34a";
  if (pct >= 50) return "#fd7e14";
  return "#3b82f6";
}

export function FinancialTargetsV2({ targets, variant = "light" }: FinancialTargetsV2Props) {
  const isDark = variant === "dark";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={
        isDark
          ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
          : { background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.75)", boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }
      }
    >
      {targets.map((target, idx) => {
        const pct = Math.min(Math.round((target.current / target.target) * 100), 100);
        const remaining = target.target - target.current;
        const barColor = getBarColor(pct);

        return (
          <div
            key={target.title}
            className="px-6 py-6"
            style={{
              borderBottom:
                idx < targets.length - 1
                  ? `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`
                  : "none",
            }}
          >
            {/* Title row */}
            <div className="flex items-start justify-between mb-3">
              <p
                className="text-xs font-semibold leading-snug pr-4"
                style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#4b5563" }}
              >
                {target.title}
              </p>
              <span className="text-sm font-bold font-sans shrink-0" style={{ color: barColor }}>
                {pct}%
              </span>
            </div>

            {/* Bar */}
            <div
              className="h-1.5 rounded-full overflow-hidden mb-3"
              style={{ background: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>

            {/* Figures */}
            <div className="flex items-center justify-between text-[11px] font-sans">
              <div className="flex items-baseline gap-1">
                <span
                  className="font-bold"
                  style={{ color: isDark ? "rgba(255,255,255,0.85)" : "#111827" }}
                >
                  {formatValue(target.current, target.unit)}
                </span>
                <span style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }}>
                  of {formatValue(target.target, target.unit)}
                </span>
              </div>
              <span style={{ color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }}>
                {formatValue(remaining, target.unit)} left
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
