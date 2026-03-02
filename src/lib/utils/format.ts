import { format, formatDistanceToNow } from "date-fns";

export function formatCurrency(
  amount: number,
  currency: "INR" | "USD" | "AED" | "GBP" | "EUR" = "INR"
): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), "dd/MM/yy");
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function formatPercentage(n: number, decimals = 1): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;
}

export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

export function getFinancialYearRange(fy: string): { start: Date; end: Date } {
  const [startYear] = fy.split("-");
  const year = parseInt(startYear);
  return {
    start: new Date(year, 3, 1),
    end: new Date(year + 1, 2, 31),
  };
}
