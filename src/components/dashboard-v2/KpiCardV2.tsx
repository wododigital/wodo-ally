import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface KpiCardV2Props {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  subtitle?: string;
  accentColor?: string;
  className?: string;
}

export function KpiCardV2({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  subtitle,
  accentColor = "#fd7e14",
  className,
}: KpiCardV2Props) {
  const trendColor =
    trend === "up" ? "#16a34a" : trend === "down" ? "#dc2626" : "#9ca3af";

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn("rounded-2xl p-4 md:p-6 lg:p-7", className)}
      style={{
        background: "rgba(255, 255, 255, 0.45)",
        border: "1px solid rgba(255, 255, 255, 0.75)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        minHeight: "140px",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-400">
          {title}
        </p>
        {Icon && (
          <div
            className="p-2 rounded-xl shrink-0"
            style={{ background: `${accentColor}16` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
          </div>
        )}
      </div>

      {/* Primary metric */}
      <p className="text-[2.4rem] font-light tabular-nums text-gray-900 leading-none">
        {value}
      </p>

      {subtitle && (
        <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>
      )}

      {/* Trend */}
      {change && (
        <div
          className="flex items-center gap-1.5 mt-4 pt-4 text-xs font-semibold"
          style={{
            borderTop: "1px solid rgba(0,0,0,0.05)",
            color: trendColor,
          }}
        >
          <TrendIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{change}</span>
        </div>
      )}
    </div>
  );
}
