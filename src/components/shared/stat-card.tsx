import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  subtitle?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  subtitle,
  className,
}: StatCardProps) {
  const trendColor = {
    up: "text-status-success",
    down: "text-status-error",
    neutral: "text-text-muted",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <GlassCard variant="stat" padding="md" className={cn("group", className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs uppercase tracking-wider font-medium text-text-muted">
          {title}
        </p>
        {Icon && (
          <div className="p-2 rounded-button" style={{ background: "rgba(253,126,20,0.08)" }}>
            <Icon className="w-4 h-4 text-accent" />
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold font-sans tabular-nums text-text-primary leading-none">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-text-muted">{subtitle}</p>
        )}
      </div>
      {change && (
        <div className={cn("flex items-center gap-1 mt-3 text-xs font-medium", trendColor[trend])}>
          <TrendIcon className="w-3 h-3" />
          <span>{change}</span>
        </div>
      )}
    </GlassCard>
  );
}
