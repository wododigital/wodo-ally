import { type Page, expect } from "playwright/test";

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function login(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Fill login form
  await page.locator('input[type="email"]').fill("accounts@wodo.digital");
  await page.locator('input[type="password"]').fill("WodoAlly@2026");
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

// ─── Navigation helpers ──────────────────────────────────────────────────────
export async function navigateTo(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle", timeout: 30000 });
}

// ─── Audit result tracking ───────────────────────────────────────────────────
export interface AuditCheck {
  category: string;
  test: string;
  status: "pass" | "fail" | "warn" | "skip";
  detail: string;
  screenshot?: string;
  duration?: number;
}

export function auditCheck(
  category: string,
  test: string,
  status: AuditCheck["status"],
  detail: string
): AuditCheck {
  return { category, test, status, detail };
}

// ─── Safe action wrapper ─────────────────────────────────────────────────────
export async function safeAction<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<{ result: T; error?: string }> {
  try {
    const result = await fn();
    return { result };
  } catch (e: any) {
    return { result: fallback, error: e.message };
  }
}

// ─── Wait for element safely ─────────────────────────────────────────────────
export async function waitForSelector(page: Page, selector: string, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

// ─── Format currency for comparison ──────────────────────────────────────────
export function parseCurrencyText(text: string): number {
  return parseFloat(text.replace(/[^0-9.\-]/g, "")) || 0;
}

// ─── Test data definitions ───────────────────────────────────────────────────
export const TEST_DATA = {
  clients: {
    gst: {
      company_name: "Audit Test GST Pvt Ltd",
      display_name: "AuditGST",
      client_type: "indian_gst",
      region: "india",
      currency: "INR",
      gstin: "29AABCT1332L1ZD",
      city: "Bangalore",
      country: "India",
      billing_email: "audit-gst@test.com",
    },
    nonGst: {
      company_name: "Audit Test NonGST LLC",
      display_name: "AuditNonGST",
      client_type: "indian_non_gst",
      region: "india",
      currency: "INR",
      city: "Mumbai",
      country: "India",
      billing_email: "audit-nongst@test.com",
    },
    international: {
      company_name: "Audit Test Intl Corp",
      display_name: "AuditIntl",
      client_type: "international",
      region: "usa",
      currency: "USD",
      city: "New York",
      country: "USA",
      billing_email: "audit-intl@test.com",
    },
  },
  invoices: {
    gst: {
      lineItems: [
        { description: "Website Design", quantity: 1, amount: 50000 },
        { description: "SEO Setup", quantity: 2, amount: 15000 },
      ],
      // Expected: subtotal=80000, tax=14400 (18%), total=94400
      expectedSubtotal: 80000,
      expectedTax: 14400,
      expectedTotal: 94400,
    },
    international: {
      lineItems: [
        { description: "Full Stack Development", quantity: 1, amount: 5000 },
        { description: "QA Testing", quantity: 3, amount: 1200 },
      ],
      // Expected: subtotal=8600, tax=0, total=8600
      expectedSubtotal: 8600,
      expectedTax: 0,
      expectedTotal: 8600,
    },
    nonGst: {
      lineItems: [
        { description: "Branding Package", quantity: 1, amount: 25000 },
      ],
      // Expected: subtotal=25000, tax=0, total=25000
      expectedSubtotal: 25000,
      expectedTax: 0,
      expectedTotal: 25000,
    },
  },
  payments: {
    full: { amount: 94400, amount_inr: 94400, method: "bank_transfer", tds: 0 },
    partial: { amount: 4000, amount_inr: 340000, method: "skydo_usd", tds: 0, skydo_fx: 50, skydo_fee: 25 },
    withTds: { amount: 80000, amount_inr: 80000, method: "bank_transfer", tds: 8000 },
  },
} as const;

// ─── Calculation verification ────────────────────────────────────────────────
export function verifyInvoiceCalc(
  lineItems: { amount: number; quantity: number }[],
  taxRate: number
) {
  const subtotal = Math.round(lineItems.reduce((s, i) => s + i.amount * i.quantity, 0) * 100) / 100;
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total };
}
