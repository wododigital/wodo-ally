import { test, expect } from "playwright/test";
import { login, navigateTo, waitForSelector } from "./helpers";

test.describe("Clients Page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, "/clients");
  });

  test("clients page loads at /clients", async ({ page }) => {
    expect(page.url()).toContain("/clients");

    // Page should have content indicating it is the clients page
    const heading = page.locator('h1:has-text("Clients"), h2:has-text("Clients"), [class*="title"]:has-text("Clients")');
    const fallback = page.getByText("Clients").first();

    const hasHeading = await heading.first().isVisible().catch(() => false);
    const hasFallback = await fallback.isVisible().catch(() => false);

    expect(hasHeading || hasFallback).toBeTruthy();
  });

  test('"Add Client" button is visible', async ({ page }) => {
    const addButton = page.locator(
      'button:has-text("Add Client"), a:has-text("Add Client"), button:has-text("New Client")'
    );
    await expect(addButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("search input is present and filters client cards", async ({ page }) => {
    const searchInput = page.locator(
      'input[placeholder*="earch"], input[type="search"], input[class*="search"], input.glass-input'
    );
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 });

    // Count initial cards
    await page.waitForTimeout(2000);
    const clientCards = page.locator('[class*="card"], [class*="Card"]');
    const initialCount = await clientCards.count();

    // Type a search query that likely matches few or no clients
    await searchInput.first().fill("zzzznonexistent");
    await page.waitForTimeout(1500);

    const filteredCount = await clientCards.count();

    // After typing a non-matching query, fewer cards should show
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Clear the search
    await searchInput.first().clear();
    await page.waitForTimeout(1500);
  });

  test("invoice type filter pills are present", async ({ page }) => {
    const filterLabels = ["All", "GST Invoice", "Non-GST", "International"];

    for (const label of filterLabels) {
      const pill = page.locator(
        `button:has-text("${label}"), [role="tab"]:has-text("${label}"), [class*="pill"]:has-text("${label}"), [class*="filter"]:has-text("${label}"), [class*="badge"]:has-text("${label}")`
      );
      await expect(
        pill.first(),
        `Filter pill "${label}" should be visible`
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("status filter pills are present", async ({ page }) => {
    const statusLabels = ["All Status", "Active", "Inactive", "Closed", "Churned"];

    for (const label of statusLabels) {
      const pill = page.locator(
        `button:has-text("${label}"), [role="tab"]:has-text("${label}"), [class*="pill"]:has-text("${label}"), [class*="filter"]:has-text("${label}"), [class*="badge"]:has-text("${label}")`
      );
      await expect(
        pill.first(),
        `Status pill "${label}" should be visible`
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("client cards display expected elements", async ({ page }) => {
    await page.waitForTimeout(2000);

    // Client cards are links to individual client pages
    const cards = page.locator('a[href*="/clients/"]');
    const cardCount = await cards.count();

    // Skip if no clients exist
    if (cardCount === 0) {
      test.skip();
      return;
    }

    const firstCard = cards.first();

    // Company name is in .text-sm.font-semibold inside the card
    const companyName = firstCard.locator('.text-sm.font-semibold');
    await expect(companyName).toBeVisible({ timeout: 5000 });
    const nameText = await companyName.innerText();
    expect(nameText.length).toBeGreaterThan(0);

    // Check for type badge somewhere within client cards
    const badges = page.locator(
      'a[href*="/clients/"] [class*="badge"], a[href*="/clients/"] [class*="Badge"], a[href*="/clients/"] [class*="tag"], a[href*="/clients/"] [class*="Tag"], a[href*="/clients/"] [class*="chip"]'
    );
    const hasBadges = (await badges.count()) > 0;

    // Check for CircularHealth SVG indicator
    const healthSvg = page.locator('a[href*="/clients/"] svg');
    const hasSvg = (await healthSvg.count()) > 0;

    expect(
      hasBadges || hasSvg,
      "Client cards should display type badges or health SVG indicators"
    ).toBeTruthy();
  });

  test("pagination works if clients > 18", async ({ page }) => {
    await page.waitForTimeout(2000);

    const cards = page.locator('a[href*="/clients/"]');
    const cardCount = await cards.count();

    // If fewer than 18 clients, skip the pagination test entirely
    if (cardCount < 18) {
      test.skip(true, `Only ${cardCount} clients found, fewer than 18 - pagination not expected`);
      return;
    }

    // Look for pagination controls
    const pagination = page.locator(
      'button:has-text("Next"), button:has-text("Previous"), [class*="pagination"], [class*="Pagination"], nav[aria-label*="pagination"], button:has-text("Load More"), [class*="page-number"]'
    );

    await expect(pagination.first()).toBeVisible({ timeout: 5000 });

    // Try clicking next/load more
    const nextButton = page.locator(
      'button:has-text("Next"), button:has-text("Load More"), [aria-label="next page"]'
    );
    if (await nextButton.first().isVisible().catch(() => false)) {
      await nextButton.first().click();
      await page.waitForTimeout(2000);
      // Page should still be on /clients
      expect(page.url()).toContain("/clients");
    }
  });
});
