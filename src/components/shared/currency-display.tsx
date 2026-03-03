import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Currency = "INR" | "USD" | "AED" | "GBP" | "EUR";

interface CurrencyDisplayProps {
  amount: number;
  currency?: Currency;
  size?: "sm" | "md" | "lg";
  className?: string;
  showCurrencyCode?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency = "INR",
  size = "md",
  className,
  showCurrencyCode = false,
}: CurrencyDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <span
      className={cn(
        "font-sans tabular-nums font-semibold",
        sizeClasses[size],
        className
      )}
    >
      {formatCurrency(amount, currency)}
      {showCurrencyCode && currency !== "INR" && (
        <span className="text-text-muted text-xs ml-1">{currency}</span>
      )}
    </span>
  );
}
