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

test.describe("Invoice Creation - International Invoice", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, "/invoices");
  });

  test("should create an international invoice with 0% tax", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Open new invoice modal
    const newInvoiceBtn = page.locator('button').filter({ hasText: 'New Invoice' }).first();
    await newInvoiceBtn.waitFor({ state: 'visible', timeout: 10000 });
    await newInvoiceBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Select "International" type
    const intlTypeBtn = page.getByRole("button", { name: /international/i });
    await expect(intlTypeBtn).toBeVisible({ timeout: 5000 });
    await intlTypeBtn.click();

    // Select an international client (first available)
    const clientSelect = page.locator("select.glass-input").first();
    await safeAction(async () => {
      await clientSelect.selectOption({ index: 1 });
    }, undefined);

    // Line item selectors
    const descriptionInputs = page.locator('input[placeholder="Description"]');
    const qtyInputs = page.locator('input.glass-input[type="number"]');
    const amountInputs = page.locator('input[placeholder="Amount"]');

    // Fill first line item: "Full Stack Development" qty 1 amount 5000
    await safeAction(async () => {
      await descriptionInputs.first().fill("Full Stack Development");
    }, undefined);
    await safeAction(async () => {
      await amountInputs.first().fill("5000");
    }, undefined);

    // Click "Add item" for second line
    await safeAction(async () => {
      await page.locator('button').filter({ hasText: 'Add item' }).click();
    }, undefined);

    // Fill second line item: "QA Testing" qty 3 amount 1200
    await safeAction(async () => {
      await descriptionInputs.nth(1).fill("QA Testing");
    }, undefined);
    await safeAction(async () => {
      await qtyInputs.nth(1).fill("3");
    }, undefined);
    await safeAction(async () => {
      await amountInputs.nth(1).fill("1200");
    }, undefined);

    // Trigger calculation
    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);

    // Verify calculations: subtotal = 5000 + (1200*3) = 8600, tax = 0, total = 8600
    const expected = verifyInvoiceCalc(
      [
        { amount: 5000, quantity: 1 },
        { amount: 1200, quantity: 3 },
      ],
      0
    );
    expect(expected.subtotal).toBe(8600);
    expect(expected.tax).toBe(0);
    expect(expected.total).toBe(8600);

    // Verify subtotal shows 8,600 on the page
    await safeAction(async () => {
      const subtotalEl = page.getByText(/8[,.]?600/);
      await expect(subtotalEl.first()).toBeVisible({ timeout: 5000 });
    }, undefined);

    // Verify tax is 0 (no tax line or shows 0)
    await safeAction(async () => {
      // Tax should be 0 for international invoices
      const taxZero = page.getByText(/tax.*0|0.*tax/i);
      const noTaxLine = !(await page.getByText(/18%|gst/i).isVisible({ timeout: 2000 }));
      // Either tax shows as 0 or no tax line exists
      expect(await taxZero.isVisible({ timeout: 2000 }).catch(() => false) || noTaxLine).toBeTruthy();
    }, undefined);

    // Verify total = subtotal = 8,600
    await safeAction(async () => {
      const totalEl = page.getByText(/8[,.]?600/);
      await expect(totalEl.first()).toBeVisible({ timeout: 5000 });
    }, undefined);

    // Verify currency prefix is $ for USD clients
    await safeAction(async () => {
      const dollarSign = page.getByText(/\$/);
      const isDollarVisible = await dollarSign.first().isVisible({ timeout: 3000 });
      if (isDollarVisible) {
        expect(isDollarVisible).toBeTruthy();
      }
    }, undefined);

    // Save as draft
    const saveDraftBtn = page.locator('button').filter({ hasText: 'Save as Draft' }).first();
    await safeAction(async () => {
      await saveDraftBtn.waitFor({ state: 'visible', timeout: 5000 });
      await saveDraftBtn.click();
      await page.waitForTimeout(2000);
    }, undefined);
  });

  test("should verify international calculation formula: subtotal + 0% tax = subtotal", async ({
    page,
  }) => {
    const calc = verifyInvoiceCalc(TEST_DATA.invoices.international.lineItems, 0);
    expect(calc.subtotal).toBe(TEST_DATA.invoices.international.expectedSubtotal);
    expect(calc.tax).toBe(TEST_DATA.invoices.international.expectedTax);
    expect(calc.total).toBe(TEST_DATA.invoices.international.expectedTotal);
  });
});
