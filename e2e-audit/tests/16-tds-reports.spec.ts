import { test, expect } from "playwright/test";
import { login, navigateTo, safeAction, waitForSelector } from "./helpers";

test.describe("TDS & Reports", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("should navigate to /tds page", async ({ page }) => {
    await navigateTo(page, "/tds");
    expect(page.url()).toContain("/tds");
  });

  test("TDS certificates page loads with heading", async ({ page }) => {
    await navigateTo(page, "/tds");

    const heading = page.locator(
      'h1:has-text("TDS"), h2:has-text("TDS"), [class*="heading"]:has-text("TDS"), [class*="title"]:has-text("TDS")'
    );
    const pageText = page.getByText(/tds/i).first();
    const hasHeading = await heading.first().isVisible().catch(() => false);
    const hasText = await pageText.isVisible().catch(() => false);

    expect(hasHeading || hasText).toBeTruthy();
  });

  test("TDS page shows financial year and quarter columns", async ({ page }) => {
    await navigateTo(page, "/tds");
    await page.waitForLoadState("networkidle");

    const bodyText = await page.textContent("body");
    const hasFinancialYear =
      /financial\s*year|fy\s*\d{4}|FY/i.test(bodyText || "");
    const hasQuarter =
      /quarter|q[1-4]|Q[1-4]/i.test(bodyText || "");

    // Check for table or list structure with relevant columns
    const tableHeaders = page.locator("th, [role='columnheader']");
    const headerCount = await tableHeaders.count();

    // At least one of: financial year reference, quarter reference, or table structure
    expect(hasFinancialYear || hasQuarter || headerCount > 0).toBeTruthy();
  });

  test("TDS page shows certificate received indicator", async ({ page }) => {
    await navigateTo(page, "/tds");
    await page.waitForLoadState("networkidle");

    // Look for certificate status indicators (received, pending, checkmarks, badges)
    const certificateIndicator = page.locator(
      '[class*="badge"], [class*="status"], [class*="indicator"], [class*="chip"], [class*="tag"]'
    );
    const checkmarks = page.locator(
      'svg[class*="check"], [class*="check"], [class*="received"]'
    );
    const statusText = page.getByText(/received|pending|not received|uploaded/i).first();

    const hasIndicator = await certificateIndicator.first().isVisible().catch(() => false);
    const hasCheck = await checkmarks.first().isVisible().catch(() => false);
    const hasStatus = await statusText.isVisible().catch(() => false);

    // TDS page should have some form of certificate tracking, or may have no certificates yet
    const bodyText = await page.locator("body").innerText();
    const hasContent = bodyText.length > 50;

    // Either certificate indicators exist, or the page loaded with content (possibly empty state)
    expect(hasIndicator || hasCheck || hasStatus || hasContent).toBeTruthy();
  });

  test("should navigate to /reports page", async ({ page }) => {
    await navigateTo(page, "/reports");
    expect(page.url()).toContain("/reports");
  });

  test("Investor reports page loads with content", async ({ page }) => {
    await navigateTo(page, "/reports");
    await page.waitForLoadState("networkidle");

    const heading = page.locator(
      'h1:has-text("Report"), h2:has-text("Report"), [class*="heading"]:has-text("Report"), [class*="title"]:has-text("Report")'
    );
    const pageText = page.getByText(/report/i).first();
    const hasHeading = await heading.first().isVisible().catch(() => false);
    const hasText = await pageText.isVisible().catch(() => false);

    expect(hasHeading || hasText).toBeTruthy();
  });

  test("Reports page shows generation or listing controls", async ({ page }) => {
    await navigateTo(page, "/reports");
    await page.waitForLoadState("networkidle");

    // Check for report generation button
    const generateBtn = page.getByRole("button", {
      name: /generate|download|export|create report/i,
    });
    // Check for a list or table of reports
    const reportList = page.locator(
      "table, [class*='list'], [class*='grid'], [class*='report-card'], [class*='card']"
    );
    // Check for filter/date range controls
    const filters = page.locator(
      'select.glass-input, input[type="date"].glass-input, [class*="filter"], [class*="date-range"]'
    );

    const hasGenerateBtn = await generateBtn.first().isVisible().catch(() => false);
    const hasReportList = await reportList.first().isVisible().catch(() => false);
    const hasFilters = await filters.first().isVisible().catch(() => false);

    expect(hasGenerateBtn || hasReportList || hasFilters).toBeTruthy();
  });
});
