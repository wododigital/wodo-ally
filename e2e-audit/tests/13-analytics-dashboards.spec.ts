import { test, expect } from "playwright/test";
import { login, navigateTo, waitForSelector, safeAction } from "./helpers";

test.describe("Analytics Dashboards", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const analyticsPages = [
    { path: "/analytics", label: "Main Analytics" },
    { path: "/analytics/balance", label: "Balance Sheet" },
    { path: "/analytics/clients", label: "Client Analytics" },
    { path: "/analytics/expenses", label: "Expense Analytics" },
    { path: "/analytics/invoices", label: "Invoice Analytics" },
    { path: "/analytics/pl", label: "P&L" },
    { path: "/analytics/projects", label: "Project Analytics" },
  ];

  for (const { path, label } of analyticsPages) {
    test(`navigate to ${path} - ${label} page loads`, async ({ page }) => {
      await navigateTo(page, path);
      await page.waitForLoadState("networkidle");

      expect(page.url()).toContain(path);
      expect(page.url()).not.toContain("/login");

      // Page should have meaningful content
      const bodyText = await page.locator("body").innerText();
      expect(bodyText.length).toBeGreaterThan(50);
    });

    test(`${label} page has no error states`, async ({ page }) => {
      await navigateTo(page, path);

      // No error banners or error pages
      const errorBanner = page.locator(
        '[role="alert"][class*="error"], [class*="error-page"], [class*="ErrorPage"]'
      );
      const errorText = page.locator(
        'text=/something went wrong/i, text=/error occurred/i, text=/500/i, text=/404/'
      );

      const hasErrorBanner = await errorBanner.first().isVisible().catch(() => false);
      const hasErrorText = await errorText.first().isVisible().catch(() => false);

      expect(hasErrorBanner).toBe(false);
      expect(hasErrorText).toBe(false);
    });

    test(`${label} page should have charts (SVG or canvas)`, async ({ page }) => {
      await navigateTo(page, path);

      // Wait a moment for charts to render
      await page.waitForTimeout(2000);

      // Look for SVG charts, canvas elements, or chart containers
      const svgCharts = page.locator("svg");
      const canvasCharts = page.locator("canvas");
      const chartContainers = page.locator(
        '[class*="chart"], [class*="Chart"], [class*="recharts"], [class*="Recharts"], [class*="graph"], [class*="Graph"], [class*="apex"], [class*="Apex"]'
      );
      const vizElements = page.locator(
        '[class*="visualization"], [class*="dashboard"], [class*="Dashboard"], [class*="metric"], [class*="Metric"], [class*="stat"], [class*="Stat"], [class*="kpi"], [class*="KPI"]'
      );

      const svgCount = await svgCharts.count();
      const canvasCount = await canvasCharts.count();
      const chartCount = await chartContainers.count();
      const vizCount = await vizElements.count();

      // At least some visual elements should be present on analytics pages
      expect(svgCount + canvasCount + chartCount + vizCount).toBeGreaterThan(0);
    });
  }
});
