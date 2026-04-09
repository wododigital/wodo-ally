import { test, expect } from "playwright/test";
import { login, waitForSelector } from "./helpers";

test.describe("Dashboard Load & Layout", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("dashboard page loads after login", async ({ page }) => {
    expect(page.url()).toContain("/dashboard");
    await page.waitForLoadState("networkidle");

    // Page should have meaningful content, not a blank screen
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("KPI cards are visible", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for KPI-related text content on the page
    const pageText = (await page.locator("body").innerText()).toLowerCase();

    const kpiKeywords = ["revenue", "clients", "invoices"];
    const foundKeywords = kpiKeywords.filter((kw) => pageText.includes(kw));

    expect(foundKeywords.length).toBeGreaterThanOrEqual(2);
  });

  test("navigation navbar has all expected links", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const mainNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(mainNav).toBeVisible({ timeout: 10000 });

    // Direct tab labels visible in the top navbar
    const expectedTabs = [
      "Dashboard",
      "Clients",
      "Invoices",
      "Expenses",
      "Analytics",
      "Projects",
      "Contracts",
      "Pipeline",
      "Goals",
      "TDS",
      "Reports",
    ];

    for (const tabText of expectedTabs) {
      const tab = mainNav.locator(`a:has-text("${tabText}"), button:has-text("${tabText}")`);
      const isVisible = await tab.first().isVisible().catch(() => false);
      expect(isVisible, `Nav tab "${tabText}" should be visible`).toBeTruthy();
    }

    // Settings is a gear icon link in the top-right, not a nav tab
    const settingsIcon = page.locator('a[aria-label="Settings"]');
    await expect(settingsIcon.first()).toBeVisible({ timeout: 5000 });
  });

  test("page does not have console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Reload dashboard to capture fresh console output
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // Filter out known benign errors (e.g. favicon, third-party scripts)
    const significantErrors = consoleErrors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("404") &&
        !e.includes("Failed to load resource") &&
        !e.includes("third-party")
    );

    expect(
      significantErrors,
      `Console errors found: ${significantErrors.join("; ")}`
    ).toHaveLength(0);
  });

  test("charts/graphs section loads", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Look for Recharts SVG elements or canvas elements used for charts
    const rechartsSvg = page.locator(".recharts-wrapper, .recharts-surface, svg.recharts-surface");
    const canvasElements = page.locator("canvas");
    const genericChartSvg = page.locator('svg[class*="chart"], [class*="chart"] svg, [class*="Chart"] svg');

    const hasRecharts = (await rechartsSvg.count()) > 0;
    const hasCanvas = (await canvasElements.count()) > 0;
    const hasGenericChart = (await genericChartSvg.count()) > 0;

    expect(
      hasRecharts || hasCanvas || hasGenericChart,
      "At least one chart element (Recharts SVG, canvas, or chart SVG) should be present"
    ).toBeTruthy();
  });
});
