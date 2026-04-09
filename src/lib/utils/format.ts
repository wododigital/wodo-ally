import { format, formatDistanceToNow } from "date-fns";

export function formatCurrency(
  amount: number,
  currency: "INR" | "USD" | "AED" | "GBP" | "EUR" = "INR"
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return format(d, "dd MMM yyyy");
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return format(d, "dd/MM/yy");
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(Number.isFinite(n) ? n : 0);
}

export function formatPercentage(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return "0.0%";
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
  const end = new Date(year + 1, 2, 31);
  end.setHours(23, 59, 59, 999);
  return {
    start: new Date(year, 3, 1),
    end,
  };
}

/**
 * Returns Date bounds for a quarter within an Indian FY.
 * Q1 = Apr-Jun, Q2 = Jul-Sep, Q3 = Oct-Dec, Q4 = Jan-Mar
 */
export function getQuarterBounds(fy: string, quarter: number): { start: Date; end: Date } {
  const [startYear] = fy.split("-");
  const fyStart = parseInt(startYear);

  const quarterDefs: Record<number, { startMonth: number; endMonth: number; yearOffset: number }> = {
    1: { startMonth: 3, endMonth: 5, yearOffset: 0 },   // Apr(3)-Jun(5) in 0-indexed
    2: { startMonth: 6, endMonth: 8, yearOffset: 0 },   // Jul-Sep
    3: { startMonth: 9, endMonth: 11, yearOffset: 0 },  // Oct-Dec
    4: { startMonth: 0, endMonth: 2, yearOffset: 1 },   // Jan-Mar (next calendar year)
  };

  const def = quarterDefs[quarter] ?? quarterDefs[1];
  const calYear = fyStart + def.yearOffset;
  const start = new Date(calYear, def.startMonth, 1);
  const end = new Date(calYear, def.endMonth + 1, 0); // last day of end month
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
