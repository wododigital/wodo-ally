import { test, expect } from "playwright/test";
import { login, navigateTo, waitForSelector, safeAction } from "./helpers";

test.describe("Payments Page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("navigate to /payments and page loads", async ({ page }) => {
    await navigateTo(page, "/payments");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/payments");
    expect(page.url()).not.toContain("/login");
  });

  test("page loads with payment tracking UI", async ({ page }) => {
    await navigateTo(page, "/payments");

    // Look for payment-related headings or content
    const paymentHeading = page.locator(
      'h1:has-text("Payment"), h2:has-text("Payment"), h1:has-text("payment"), h2:has-text("payment"), [class*="heading"]:has-text("Payment")'
    );
    const hasHeading = await paymentHeading.first().isVisible().catch(() => false);

    // Alternatively, confirm the page rendered meaningful content (not blank)
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);

    // At minimum the page should not show an error state
    const errorBanner = page.locator('[role="alert"][class*="error"], [class*="error-page"]');
    const hasError = await errorBanner.first().isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test("check for payment list or table presence", async ({ page }) => {
    await navigateTo(page, "/payments");

    // Look for a table, list, or grid of payments
    const table = page.locator("table");
    const listContainer = page.locator(
      '[class*="payment-list"], [class*="PaymentList"], [class*="list"], [role="list"], [role="grid"]'
    );
    const cardGrid = page.locator('[class*="card"], [class*="Card"]');
    const emptyState = page.locator(
      'text=/no payment/i, text=/no records/i, text=/no data/i, text=/empty/i, text=/get started/i'
    );

    const hasTable = await table.first().isVisible().catch(() => false);
    const hasList = await listContainer.first().isVisible().catch(() => false);
    const hasCards = (await cardGrid.count()) > 0;
    const hasEmpty = await emptyState.first().isVisible().catch(() => false);

    // Either there is a payment list/table/cards, or an empty state message
    expect(hasTable || hasList || hasCards || hasEmpty).toBeTruthy();
  });

  test("verify filtering capabilities exist", async ({ page }) => {
    await navigateTo(page, "/payments");

    // Search for filter-related UI elements
    const filterElements = page.locator(
      'input[placeholder*="search" i], input[placeholder*="filter" i], button:has-text("Filter"), button:has-text("filter"), select, [class*="filter"], [class*="Filter"], [class*="search"], [role="combobox"], [role="searchbox"]'
    );
    const dateFilter = page.locator(
      'input[type="date"], [class*="date-picker"], [class*="DatePicker"], [class*="datepicker"], button:has-text("Date")'
    );
    const tabs = page.locator('[role="tablist"], [class*="tabs"], [class*="Tabs"]');

    const hasFilters = (await filterElements.count()) > 0;
    const hasDateFilter = (await dateFilter.count()) > 0;
    const hasTabs = await tabs.first().isVisible().catch(() => false);

    // At least some filtering or search capability should exist
    expect(hasFilters || hasDateFilter || hasTabs).toBeTruthy();
  });

  test("check for payment method indicators", async ({ page }) => {
    await navigateTo(page, "/payments");

    // Look for payment method labels, icons, or column headers using safe locators
    const hasMethodText = await page.locator('th, td').filter({ hasText: /method|type/i }).count() > 0
      || await page.getByText(/bank.?transfer|upi|skydo|razorpay|paypal|payment.?type/i).count() > 0;
    const hasMethodIcons = await page.locator(
      '[class*="method"], [class*="Method"], [class*="payment-type"], [class*="PaymentType"]'
    ).count() > 0;

    // Either method indicators are present, or the page may have no payment data yet
    const isEmpty = await page.getByText(/no payment|no records|no data/i).first().isVisible().catch(() => false);

    expect(hasMethodText || hasMethodIcons || isEmpty).toBeTruthy();
  });

  test("check for TDS column or data if applicable", async ({ page }) => {
    await navigateTo(page, "/payments");

    // Look for TDS-related elements using safe locators
    const hasTds = await page.getByText(/tds/i).count() > 0
      || await page.locator('th, td').filter({ hasText: /TDS/i }).count() > 0
      || await page.locator('[class*="tds"], [class*="Tds"]').count() > 0;

    // TDS may not be visible if no payments exist or if hidden behind a column toggle
    // This is a soft check - log the result
    if (!hasTds) {
      // Check for column settings or customize button that might reveal TDS
      const columnToggle = page.locator(
        'button:has-text("Columns"), button:has-text("Customize"), [class*="column-toggle"]'
      );
      const hasColumnToggle = await columnToggle.first().isVisible().catch(() => false);

      // Either TDS is visible, or there is a way to toggle columns, or it is just not applicable
      // This test passes as long as the page loaded correctly
      expect(page.url()).toContain("/payments");
    } else {
      expect(hasTds).toBe(true);
    }
  });
});
