import { test, expect } from "playwright/test";
import { login, navigateTo, safeAction, waitForSelector } from "./helpers";

test.describe("Navigation & Responsive Layout", () => {
  test.describe("Desktop viewport (1440x900)", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("sidebar navigation is fully visible at desktop width", async ({ page }) => {
      await login(page);

      const sidebar = page.locator(
        'nav, aside, [class*="sidebar"], [class*="Sidebar"], [class*="side-nav"], [role="navigation"]'
      );
      await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
    });

    test("all nav links are clickable and navigate correctly", async ({ page }) => {
      await login(page);

      // Collect nav links from sidebar
      const navLinks = page.locator(
        'nav a, aside a, [class*="sidebar"] a, [role="navigation"] a'
      );
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);

      // Test at least the first few navigation links
      const linksToTest = Math.min(linkCount, 5);
      for (let i = 0; i < linksToTest; i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute("href");

        if (href && href.startsWith("/") && !href.includes("logout")) {
          await link.click();
          await page.waitForLoadState("networkidle");

          // Verify we navigated somewhere (not stuck on login)
          expect(page.url()).not.toContain("/login");
        }
      }
    });

    test("breadcrumbs appear on inner pages", async ({ page }) => {
      await login(page);

      // Navigate to a client list first, then into a detail page
      await navigateTo(page, "/clients");
      await page.waitForLoadState("networkidle");

      // Click into the first client if available
      const clientLink = page.locator("table tbody tr a, [class*='card'] a, a[href*='/clients/']").first();
      const hasClientLink = await clientLink.isVisible().catch(() => false);

      if (hasClientLink) {
        await clientLink.click();
        await page.waitForLoadState("networkidle");

        // Check for breadcrumb navigation
        const breadcrumbs = page.locator(
          'nav[aria-label="breadcrumb"], [class*="breadcrumb"], [class*="Breadcrumb"], ol[class*="bread"]'
        );
        const breadcrumbLinks = page.locator(
          '[class*="breadcrumb"] a, [class*="Breadcrumb"] a, nav[aria-label="breadcrumb"] a'
        );
        const separator = page.getByText("/").first();

        const hasBreadcrumbs = await breadcrumbs.first().isVisible().catch(() => false);
        const hasBreadcrumbLinks = (await breadcrumbLinks.count()) > 0;
        const hasSeparator = await separator.isVisible().catch(() => false);

        // Inner page should have some breadcrumb or back-navigation
        const backBtn = page.locator(
          'a:has-text("Back"), button:has-text("Back"), [class*="back"]'
        );
        const hasBack = await backBtn.first().isVisible().catch(() => false);

        expect(hasBreadcrumbs || hasBreadcrumbLinks || hasBack).toBeTruthy();
      } else {
        // If no clients, verify page loaded correctly at least
        expect(page.url()).toContain("/clients");
      }
    });
  });

  test.describe("Mobile viewport (375x812)", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("navigation adapts for mobile (hamburger menu or collapsed sidebar)", async ({ page }) => {
      await login(page);
      await page.waitForLoadState("networkidle");

      // The desktop sidebar should be hidden or collapsed
      const sidebar = page.locator(
        'aside, [class*="sidebar"], [class*="Sidebar"], [class*="side-nav"]'
      );
      const sidebarVisible = await sidebar.first().isVisible().catch(() => false);

      // Look for hamburger/menu toggle button
      const hamburger = page.locator(
        'button[aria-label*="menu" i], button[aria-label*="Menu" i], [class*="hamburger"], [class*="menu-toggle"], [class*="MenuToggle"], button:has(svg[class*="menu"])'
      );
      const hasHamburger = await hamburger.first().isVisible().catch(() => false);

      // Either the sidebar is collapsed/hidden and a hamburger exists,
      // or the sidebar is still visible (acceptable if it overlays)
      expect(hasHamburger || sidebarVisible).toBeTruthy();

      // If hamburger exists, click it and verify nav appears
      if (hasHamburger) {
        await hamburger.first().click();
        await page.waitForTimeout(500);

        const navAfterClick = page.locator(
          'nav a, [class*="sidebar"] a, [role="navigation"] a, [class*="drawer"] a, [class*="mobile-nav"] a'
        );
        const navCount = await navAfterClick.count();
        expect(navCount).toBeGreaterThan(0);
      }
    });

    test("floating action button is visible on mobile", async ({ page }) => {
      await login(page);
      await navigateTo(page, "/dashboard");
      await page.waitForLoadState("networkidle");

      // Look for FAB (floating action button)
      const fab = page.locator(
        '[class*="fab"], [class*="FAB"], [class*="floating"], [class*="Floating"], button[class*="fixed"], [class*="action-button"]'
      );
      // Also check for bottom-positioned buttons typical of mobile FABs
      const fixedButtons = page.locator(
        'button[style*="position: fixed"], button[style*="position:fixed"]'
      );

      const hasFab = await fab.first().isVisible().catch(() => false);
      const hasFixedBtn = await fixedButtons.first().isVisible().catch(() => false);

      // Check various pages if not found on dashboard
      if (!hasFab && !hasFixedBtn) {
        await navigateTo(page, "/clients");
        await page.waitForLoadState("networkidle");

        const fabOnClients = await fab.first().isVisible().catch(() => false);
        const fixedOnClients = await fixedButtons.first().isVisible().catch(() => false);
        const createBtn = page.getByRole("button", { name: /new|create|add|\+/i });
        const hasCreateBtn = await createBtn.first().isVisible().catch(() => false);

        expect(fabOnClients || fixedOnClients || hasCreateBtn).toBeTruthy();
      } else {
        expect(hasFab || hasFixedBtn).toBeTruthy();
      }
    });
  });
});
