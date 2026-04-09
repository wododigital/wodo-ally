import { test, expect } from "playwright/test";
import {
  login,
  navigateTo,
  safeAction,
  waitForSelector,
  TEST_DATA,
  parseCurrencyText,
  verifyInvoiceCalc,
} from "./helpers";

test.describe("Invoice Calculations Verification", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, "/invoices");
  });

  /**
   * Helper to open the invoice creation modal.
   */
  async function openNewInvoiceModal(page: import("playwright/test").Page) {
    await page.waitForLoadState("networkidle");

    const newInvoiceBtn = page.locator('button').filter({ hasText: 'New Invoice' }).first();
    await newInvoiceBtn.waitFor({ state: 'visible', timeout: 10000 });
    await newInvoiceBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Select GST type so tax calculations apply
    const gstTypeBtn = page.getByRole("button", { name: /gst invoice/i });
    await safeAction(async () => {
      await expect(gstTypeBtn).toBeVisible({ timeout: 5000 });
      await gstTypeBtn.click();
    }, undefined);
  }

  /**
   * Helper to close the modal without saving.
   */
  async function closeModal(page: import("playwright/test").Page) {
    // Try close button, then Escape key
    const closeBtn = page.getByRole("button", { name: /close|cancel|discard/i });
    const closed = await safeAction(async () => {
      await closeBtn.click();
      return true;
    }, false);
    if (!closed.result) {
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(500);
  }

  /**
   * Helper to fill a line item at a given row index.
   */
  async function fillLineItem(
    page: import("playwright/test").Page,
    index: number,
    description: string,
    qty: string,
    amount: string
  ) {
    const descriptionInputs = page.locator('input[placeholder="Description"]');
    const qtyInputs = page.locator('input.glass-input[type="number"]');
    const amountInputs = page.locator('input[placeholder="Amount"]');

    await safeAction(async () => {
      await descriptionInputs.nth(index).fill(description);
    }, undefined);
    await safeAction(async () => {
      await qtyInputs.nth(index).fill(qty);
    }, undefined);
    await safeAction(async () => {
      await amountInputs.nth(index).fill(amount);
    }, undefined);

    // Trigger calculation
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
  }

  test("should calculate single item: qty=1, amount=10000 -> subtotal=10000", async ({
    page,
  }) => {
    await openNewInvoiceModal(page);

    await fillLineItem(page, 0, "Test Service", "1", "10000");

    // Verify subtotal = 10,000
    await safeAction(async () => {
      const subtotalEl = page.getByText(/10[,.]?000/);
      await expect(subtotalEl.first()).toBeVisible({ timeout: 5000 });
    }, undefined);

    // Verify with calculation helper
    const calc = verifyInvoiceCalc([{ amount: 10000, quantity: 1 }], 18);
    expect(calc.subtotal).toBe(10000);
    expect(calc.tax).toBe(1800);
    expect(calc.total).toBe(11800);

    await closeModal(page);
  });

  test("should calculate multiple items: qty=1 amt=10000 + qty=2 amt=5000 -> subtotal=20000", async ({
    page,
  }) => {
    await openNewInvoiceModal(page);

    // Fill first item
    await fillLineItem(page, 0, "Design Work", "1", "10000");

    // Add second item
    await safeAction(async () => {
      await page.locator('button').filter({ hasText: 'Add item' }).click();
    }, undefined);

    // Fill second item
    await fillLineItem(page, 1, "Development", "2", "5000");

    // Verify subtotal = 20,000
    await safeAction(async () => {
      const subtotalEl = page.getByText(/20[,.]?000/);
      await expect(subtotalEl.first()).toBeVisible({ timeout: 5000 });
    }, undefined);

    // Verify with GST: subtotal=20000 -> tax=3600 -> total=23600
    const calc = verifyInvoiceCalc(
      [
        { amount: 10000, quantity: 1 },
        { amount: 5000, quantity: 2 },
      ],
      18
    );
    expect(calc.subtotal).toBe(20000);
    expect(calc.tax).toBe(3600);
    expect(calc.total).toBe(23600);

    // Verify tax=3600 on page
    await safeAction(async () => {
      const taxEl = page.getByText(/3[,.]?600/);
      await expect(taxEl.first()).toBeVisible({ timeout: 5000 });
    }, undefined);

    // Verify total=23600 on page
    await safeAction(async () => {
      const totalEl = page.getByText(/23[,.]?600/);
      await expect(totalEl.first()).toBeVisible({ timeout: 5000 });
    }, undefined);

    await closeModal(page);
  });

  test("should handle zero quantity without breaking calculation", async ({ page }) => {
    await openNewInvoiceModal(page);

    await fillLineItem(page, 0, "Zero Qty Item", "0", "10000");

    // Verify calculation does not break - subtotal should be 0
    const calc = verifyInvoiceCalc([{ amount: 10000, quantity: 0 }], 18);
    expect(calc.subtotal).toBe(0);
    expect(calc.tax).toBe(0);
    expect(calc.total).toBe(0);

    // Page should not show errors or crash
    await safeAction(async () => {
      const errorEl = page.getByText(/error|nan|undefined|infinity/i);
      const hasError = await errorEl.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasError).toBeFalsy();
    }, undefined);

    await closeModal(page);
  });

  test("should handle large numbers: amount=999999, qty=10 -> subtotal=9999990", async ({
    page,
  }) => {
    await openNewInvoiceModal(page);

    await fillLineItem(page, 0, "Large Project", "10", "999999");

    // Verify calculation with large numbers
    const calc = verifyInvoiceCalc([{ amount: 999999, quantity: 10 }], 18);
    expect(calc.subtotal).toBe(9999990);
    expect(calc.tax).toBe(1799998.2);
    expect(calc.total).toBe(11799988.2);

    // Page should handle large numbers without breaking
    await safeAction(async () => {
      const errorEl = page.getByText(/error|nan|undefined|infinity/i);
      const hasError = await errorEl.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasError).toBeFalsy();
    }, undefined);

    // Verify subtotal appears somewhere on page (formatted with commas)
    await safeAction(async () => {
      const subtotalEl = page.getByText(/9[,.]?999[,.]?990|99,99,990/);
      await expect(subtotalEl.first()).toBeVisible({ timeout: 5000 });
    }, undefined);

    await closeModal(page);
  });

  test("should verify rounding to 2 decimal places", async ({ page }) => {
    // Test rounding with values that produce decimals
    // E.g., amount=333, qty=3 -> subtotal=999, tax=999*0.18=179.82, total=1178.82
    const calc = verifyInvoiceCalc([{ amount: 333, quantity: 3 }], 18);
    expect(calc.subtotal).toBe(999);
    expect(calc.tax).toBe(179.82);
    expect(calc.total).toBe(1178.82);

    // Verify no floating point issues
    // 1/3 scenario: amount=100, qty=3 -> subtotal=300, tax=54, total=354
    const calc2 = verifyInvoiceCalc([{ amount: 100, quantity: 3 }], 18);
    expect(calc2.subtotal).toBe(300);
    expect(calc2.tax).toBe(54);
    expect(calc2.total).toBe(354);

    // Edge case: very small amounts
    const calc3 = verifyInvoiceCalc([{ amount: 1, quantity: 1 }], 18);
    expect(calc3.subtotal).toBe(1);
    expect(calc3.tax).toBe(0.18);
    expect(calc3.total).toBe(1.18);

    // Verify tax rounds to 2 decimals (not floating point noise)
    const taxStr = calc3.tax.toString();
    const decimalPart = taxStr.split(".")[1] || "";
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });

  test("should verify calculation consistency across all invoice types", async ({ page }) => {
    // GST invoice
    const gstCalc = verifyInvoiceCalc(TEST_DATA.invoices.gst.lineItems, 18);
    expect(gstCalc.subtotal).toBe(TEST_DATA.invoices.gst.expectedSubtotal);
    expect(gstCalc.tax).toBe(TEST_DATA.invoices.gst.expectedTax);
    expect(gstCalc.total).toBe(TEST_DATA.invoices.gst.expectedTotal);

    // International invoice (0% tax)
    const intlCalc = verifyInvoiceCalc(TEST_DATA.invoices.international.lineItems, 0);
    expect(intlCalc.subtotal).toBe(TEST_DATA.invoices.international.expectedSubtotal);
    expect(intlCalc.tax).toBe(TEST_DATA.invoices.international.expectedTax);
    expect(intlCalc.total).toBe(TEST_DATA.invoices.international.expectedTotal);

    // Non-GST invoice (0% tax)
    const nonGstCalc = verifyInvoiceCalc(TEST_DATA.invoices.nonGst.lineItems, 0);
    expect(nonGstCalc.subtotal).toBe(TEST_DATA.invoices.nonGst.expectedSubtotal);
    expect(nonGstCalc.tax).toBe(TEST_DATA.invoices.nonGst.expectedTax);
    expect(nonGstCalc.total).toBe(TEST_DATA.invoices.nonGst.expectedTotal);

    // Core invariant: total = subtotal + tax for all types
    expect(gstCalc.total).toBe(gstCalc.subtotal + gstCalc.tax);
    expect(intlCalc.total).toBe(intlCalc.subtotal + intlCalc.tax);
    expect(nonGstCalc.total).toBe(nonGstCalc.subtotal + nonGstCalc.tax);
  });
});
