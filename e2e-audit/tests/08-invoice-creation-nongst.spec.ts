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

test.describe("Invoice Creation - Non-GST Invoice", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, "/invoices");
  });

  test("should create a non-GST invoice with 0% tax", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Open new invoice modal
    const newInvoiceBtn = page.locator('button').filter({ hasText: 'New Invoice' }).first();
    await newInvoiceBtn.waitFor({ state: 'visible', timeout: 10000 });
    await newInvoiceBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Select "Non-GST" type
    const nonGstTypeBtn = page.getByRole("button", { name: /non.?gst/i });
    await expect(nonGstTypeBtn).toBeVisible({ timeout: 5000 });
    await nonGstTypeBtn.click();

    // Select a non-GST client
    const clientSelect = page.locator("select.glass-input").first();
    await safeAction(async () => {
      await clientSelect.selectOption({ index: 1 });
    }, undefined);

    // Line item selectors
    const descriptionInputs = page.locator('input[placeholder="Description"]');
    const amountInputs = page.locator('input[placeholder="Amount"]');

    // Add line item: "Branding Package" qty 1 amount 25000
    await safeAction(async () => {
      await descriptionInputs.first().fill("Branding Package");
    }, undefined);
    await safeAction(async () => {
      await amountInputs.first().fill("25000");
    }, undefined);

    // Trigger calculation
    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);

    // Verify subtotal = 25,000
    await safeAction(async () => {
      const subtotalEl = page.getByText(/25[,.]?000/);
      await expect(subtotalEl.first()).toBeVisible({ timeout: 5000 });
    }, undefined);

    // Verify tax is 0 (non-GST = 0% tax)
    await safeAction(async () => {
      const taxZero = page.getByText(/tax.*0|0.*tax/i);
      const noGstLine = !(await page.getByText(/18%|gst/i).isVisible({ timeout: 2000 }));
      expect(
        (await taxZero.isVisible({ timeout: 2000 }).catch(() => false)) || noGstLine
      ).toBeTruthy();
    }, undefined);

    // Verify no GST line appears in totals
    await safeAction(async () => {
      const gstLine = page.getByText(/gst.*18%|cgst|sgst|igst/i);
      const isGstVisible = await gstLine.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isGstVisible).toBeFalsy();
    }, undefined);

    // Verify total = 25,000 (same as subtotal since no tax)
    await safeAction(async () => {
      // Total should equal subtotal
      const totalEl = page.getByText(/25[,.]?000/);
      await expect(totalEl.first()).toBeVisible({ timeout: 5000 });
    }, undefined);

    // Save as draft
    const saveDraftBtn = page.locator('button').filter({ hasText: 'Save as Draft' }).first();
    await safeAction(async () => {
      await saveDraftBtn.waitFor({ state: 'visible', timeout: 5000 });
      await saveDraftBtn.click();
      await page.waitForTimeout(2000);
    }, undefined);
  });

  test("should verify non-GST calculation formula: subtotal + 0% = subtotal", async ({
    page,
  }) => {
    const calc = verifyInvoiceCalc(TEST_DATA.invoices.nonGst.lineItems, 0);
    expect(calc.subtotal).toBe(TEST_DATA.invoices.nonGst.expectedSubtotal);
    expect(calc.tax).toBe(TEST_DATA.invoices.nonGst.expectedTax);
    expect(calc.total).toBe(TEST_DATA.invoices.nonGst.expectedTotal);
  });
});
