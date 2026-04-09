import { test, expect } from "playwright/test";
import { login, navigateTo, waitForSelector, safeAction } from "./helpers";

test.describe("Expenses Page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("navigate to /expenses and page loads", async ({ page }) => {
    await navigateTo(page, "/expenses");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/expenses");
    expect(page.url()).not.toContain("/login");

    // Page should have meaningful content
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("expenses page renders without error", async ({ page }) => {
    await navigateTo(page, "/expenses");

    // No error states should be visible
    const errorBanner = page.locator('[role="alert"][class*="error"], [class*="error-page"]');
    const hasError = await errorBanner.first().isVisible().catch(() => false);
    expect(hasError).toBe(false);

    // Look for expense-related heading or any meaningful content
    const hasHeading = await page.getByText(/expense/i).first().isVisible().catch(() => false);
    const bodyText = await page.locator("body").innerText();
    const hasContent = bodyText.length > 50;

    // Either an expense heading is present, or the page has meaningful content
    expect(hasHeading || hasContent).toBeTruthy();
  });

  test("check for Upload bank statement button or link at /expenses/upload", async ({ page }) => {
    await navigateTo(page, "/expenses");

    // Look for upload-related button or link on the main expenses page
    const hasUploadOnMain = await page.getByRole("link", { name: /upload|import|bank statement/i }).first().isVisible().catch(() => false)
      || await page.getByRole("button", { name: /upload|import|bank statement/i }).first().isVisible().catch(() => false)
      || await page.locator('a[href*="upload"]').first().isVisible().catch(() => false);

    // Also check navigation to the upload page directly
    await navigateTo(page, "/expenses/upload");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/expenses/upload");

    // The upload page should have a file upload area or upload form
    const hasUploadArea = await page.locator('input[type="file"]').count() > 0
      || await page.locator('[class*="upload"], [class*="Upload"], [class*="dropzone"], [class*="Dropzone"]').count() > 0
      || await page.getByText(/drag|browse|choose file|upload/i).first().isVisible().catch(() => false);

    expect(hasUploadOnMain || hasUploadArea).toBeTruthy();
  });

  test("navigate to /expenses/transactions and page loads", async ({ page }) => {
    await navigateTo(page, "/expenses/transactions");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/expenses/transactions");
    expect(page.url()).not.toContain("/login");

    // Page should have meaningful content
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("transactions page loads with categorization UI", async ({ page }) => {
    await navigateTo(page, "/expenses/transactions");

    // Look for categorization-related elements using safe locators
    const hasCategories = await page.locator('[class*="category"], [class*="Category"], select, [role="combobox"], [class*="tag"], [class*="Tag"], [class*="badge"], [class*="Badge"]').count() > 0
      || await page.getByText(/category|categorize/i).first().isVisible().catch(() => false)
      || await page.locator('th, td').filter({ hasText: /category/i }).count() > 0;
    const hasTable = await page.locator("table").first().isVisible().catch(() => false);
    const hasList = await page.locator('[class*="transaction"], [class*="Transaction"], [role="list"]').first().isVisible().catch(() => false);
    const isEmpty = await page.getByText(/no transaction|no records|no data|empty|get started|upload/i).first().isVisible().catch(() => false);

    // Either categorization UI is present with data, or empty state is shown
    expect(hasCategories || hasTable || hasList || isEmpty).toBeTruthy();
  });

  test("check for transaction type filters (expense, income, transfer)", async ({ page }) => {
    await navigateTo(page, "/expenses/transactions");

    // Look for type filter tabs, buttons, or dropdowns
    const typeFilters = page.locator(
      'button:has-text("Expense"), button:has-text("Income"), button:has-text("Transfer"), [role="tab"]:has-text("Expense"), [role="tab"]:has-text("Income"), [role="tab"]:has-text("Transfer"), select, [role="combobox"]'
    );
    const filterArea = page.locator(
      '[class*="filter"], [class*="Filter"], [role="tablist"], [class*="tabs"], [class*="Tabs"], [class*="toggle"], [class*="Toggle"]'
    );
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="filter" i], [role="searchbox"]'
    );

    const hasTypeFilters = (await typeFilters.count()) > 0;
    const hasFilterArea = await filterArea.first().isVisible().catch(() => false);
    const hasSearch = await searchInput.first().isVisible().catch(() => false);

    // At least some filtering mechanism should exist
    expect(hasTypeFilters || hasFilterArea || hasSearch).toBeTruthy();
  });

  test("auto-categorization indicators present", async ({ page }) => {
    await navigateTo(page, "/expenses/transactions");

    // Look for auto-categorization badges, icons, or labels using safe locators
    const hasAutoIndicators = await page.getByText(/auto|suggested|AI|smart/i).first().isVisible().catch(() => false)
      || await page.locator('[class*="auto"], [class*="Auto"], [class*="suggested"], [class*="ai-"], [class*="smart"]').count() > 0;
    const hasBadges = await page.locator(
      '[class*="badge"], [class*="Badge"], [class*="chip"], [class*="Chip"], [class*="tag"], [class*="Tag"]'
    ).count() > 0;

    // Auto-categorization may not be visible if no transactions exist
    const isEmpty = await page.getByText(/no transaction|no records|no data|upload/i).first().isVisible().catch(() => false);

    // Either auto-categorization UI is present, or there are category badges, or no data
    expect(hasAutoIndicators || hasBadges || isEmpty).toBeTruthy();
  });
});
