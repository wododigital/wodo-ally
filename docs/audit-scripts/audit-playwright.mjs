import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const BASE = "https://wodo-ally-production.up.railway.app";
const SCREENSHOT_DIR = "/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-screenshots";
const RESULTS_DIR = "/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results";

mkdirSync(SCREENSHOT_DIR, { recursive: true });
mkdirSync(RESULTS_DIR, { recursive: true });

const PAGES = [
  { path: "/dashboard", label: "dashboard" },
  { path: "/clients", label: "clients" },
  { path: "/invoices", label: "invoices" },
  { path: "/payments", label: "payments" },
  { path: "/expenses", label: "expenses" },
  { path: "/expenses/upload", label: "expenses-upload" },
  { path: "/expenses/transactions", label: "expenses-transactions" },
  { path: "/analytics", label: "analytics" },
  { path: "/analytics/pl", label: "analytics-pl" },
  { path: "/analytics/balance", label: "analytics-balance" },
  { path: "/analytics/invoices", label: "analytics-invoices" },
  { path: "/analytics/expenses", label: "analytics-expenses" },
  { path: "/analytics/clients", label: "analytics-clients" },
  { path: "/analytics/projects", label: "analytics-projects" },
  { path: "/projects", label: "projects" },
  { path: "/contracts", label: "contracts" },
  { path: "/reports", label: "reports" },
  { path: "/pipeline", label: "pipeline" },
  { path: "/targets", label: "targets" },
  { path: "/settings", label: "settings" },
  { path: "/onboard", label: "onboard" },
];

const results = {
  timestamp: new Date().toISOString(),
  pages: [],
  navigation: [],
  interactive: [],
  consoleErrors: [],
  summary: {},
};

async function login(page) {
  console.log("Logging in...");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');

  if (await emailInput.count() > 0) {
    await emailInput.fill("accounts@wodo.digital");
    await passwordInput.fill("WodoAlly@2026");
    const submitBtn = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log")');
    await submitBtn.first().click();
    await page.waitForTimeout(5000);
    await page.waitForURL("**/dashboard**", { timeout: 15000 }).catch(() => {});
    console.log("Login complete, current URL:", page.url());
  } else {
    console.log("No email input found, may already be logged in");
  }
}

async function auditPage(page, pageInfo, viewport) {
  const isDesktop = viewport === "desktop";
  const viewportSize = isDesktop ? { width: 1440, height: 900 } : { width: 375, height: 812 };
  const prefix = isDesktop ? "desktop" : "mobile";

  await page.setViewportSize(viewportSize);

  const result = {
    path: pageInfo.path,
    label: pageInfo.label,
    viewport: prefix,
    issues: [],
    metrics: {},
  };

  // Navigate with timing
  const startTime = Date.now();
  let consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await page.goto(`${BASE}${pageInfo.path}`, { waitUntil: "networkidle", timeout: 30000 });
  } catch (e) {
    result.issues.push({ severity: "critical", issue: `Page failed to load: ${e.message}` });
    return result;
  }

  await page.waitForTimeout(3000);
  const loadTime = Date.now() - startTime;
  result.metrics.loadTimeMs = loadTime;

  if (loadTime > 5000) {
    result.issues.push({ severity: "high", issue: `Slow page load: ${loadTime}ms` });
  }

  // Screenshot
  const screenshotPath = join(SCREENSHOT_DIR, `${prefix}-${pageInfo.label}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  result.screenshotFile = `${prefix}-${pageInfo.label}.png`;

  // Page title
  const title = await page.title();
  result.metrics.pageTitle = title;

  // Console errors
  result.consoleErrors = [...consoleErrors];
  if (consoleErrors.length > 0) {
    result.issues.push({ severity: "medium", issue: `${consoleErrors.length} console error(s)` });
  }

  // Glass card count
  const glassCardCount = await page.locator(".glass-card, .glass-card-accent").count();
  result.metrics.glassCardCount = glassCardCount;

  // Loading spinners still visible
  const spinnerCount = await page.locator(".animate-spin, .animate-pulse, [class*='skeleton']").count();
  result.metrics.visibleSpinners = spinnerCount;
  if (spinnerCount > 3) {
    result.issues.push({ severity: "medium", issue: `${spinnerCount} loading indicators still visible after page load` });
  }

  // Check horizontal overflow
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  if (hasHorizontalOverflow) {
    result.issues.push({ severity: "high", issue: "Horizontal overflow detected - content wider than viewport" });
  }
  result.metrics.horizontalOverflow = hasHorizontalOverflow;

  // Buttons without text or aria-label
  const buttonsWithoutLabels = await page.evaluate(() => {
    const btns = document.querySelectorAll("button");
    let count = 0;
    btns.forEach((btn) => {
      const text = btn.textContent?.trim();
      const aria = btn.getAttribute("aria-label");
      const title = btn.getAttribute("title");
      if (!text && !aria && !title) count++;
    });
    return count;
  });
  if (buttonsWithoutLabels > 0) {
    result.issues.push({ severity: "medium", issue: `${buttonsWithoutLabels} button(s) without text, aria-label, or title` });
  }
  result.metrics.buttonsWithoutLabels = buttonsWithoutLabels;

  // Links with href="#" or href=""
  const brokenLinks = await page.evaluate(() => {
    const links = document.querySelectorAll("a");
    let count = 0;
    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (href === "#" || href === "" || href === null) count++;
    });
    return count;
  });
  if (brokenLinks > 0) {
    result.issues.push({ severity: "low", issue: `${brokenLinks} link(s) with empty or # href` });
  }
  result.metrics.brokenLinks = brokenLinks;

  // Images without alt
  const imagesWithoutAlt = await page.evaluate(() => {
    const imgs = document.querySelectorAll("img");
    let count = 0;
    imgs.forEach((img) => {
      if (!img.alt) count++;
    });
    return count;
  });
  if (imagesWithoutAlt > 0) {
    result.issues.push({ severity: "medium", issue: `${imagesWithoutAlt} image(s) missing alt text` });
  }
  result.metrics.imagesWithoutAlt = imagesWithoutAlt;

  // Mobile-specific checks
  if (!isDesktop) {
    // Horizontal scrollbar
    const hasHScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    if (hasHScroll) {
      result.issues.push({ severity: "high", issue: "Mobile: horizontal scrollbar detected" });
    }

    // Check nav accessibility (hamburger menu)
    const hasHamburger = await page.locator('button:has(svg), [data-fab], button[aria-label*="menu" i]').count();
    if (hasHamburger === 0) {
      result.issues.push({ severity: "high", issue: "Mobile: no hamburger/menu button found" });
    }

    // Touch targets - check buttons smaller than 44x44
    const smallTouchTargets = await page.evaluate(() => {
      const els = document.querySelectorAll("button, a, input, select");
      let count = 0;
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.width < 44 || rect.height < 44) count++;
        }
      });
      return count;
    });
    if (smallTouchTargets > 5) {
      result.issues.push({ severity: "medium", issue: `Mobile: ${smallTouchTargets} touch targets smaller than 44x44px` });
    }
    result.metrics.smallTouchTargets = smallTouchTargets;

    // Forms full width
    const narrowForms = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input, select, textarea");
      let count = 0;
      inputs.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.width < window.innerWidth * 0.8) count++;
      });
      return count;
    });
    result.metrics.narrowFormFields = narrowForms;
  }

  // Text overflow detection
  const truncatedElements = await page.evaluate(() => {
    const els = document.querySelectorAll("p, span, h1, h2, h3, h4, td, th");
    let count = 0;
    els.forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 2) count++;
    });
    return count;
  });
  result.metrics.truncatedElements = truncatedElements;

  // Check for empty state indicators
  const hasEmptyState = await page.locator('text="No ", text="Empty", text="not found", text="no data"').count();
  result.metrics.emptyStateVisible = hasEmptyState > 0;

  return result;
}

async function testNavigation(page) {
  console.log("Testing navigation...");
  const navResults = [];

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  // Test each nav tab
  const navLinks = await page.locator('header a[href], header button').all();
  console.log(`Found ${navLinks.length} nav elements`);

  // Test specific nav items
  const navItems = [
    { label: "Dashboard", expectedPath: "/dashboard" },
    { label: "Clients", expectedPath: "/clients" },
    { label: "Expenses", expectedPath: "/expenses" },
    { label: "Pipeline", expectedPath: "/pipeline" },
    { label: "Goals", expectedPath: "/targets" },
    { label: "Reports", expectedPath: "/reports" },
  ];

  for (const item of navItems) {
    try {
      const link = page.locator(`header a:has-text("${item.label}")`).first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        const matched = currentUrl.includes(item.expectedPath);
        navResults.push({
          label: item.label,
          expectedPath: item.expectedPath,
          actualUrl: currentUrl,
          success: matched,
        });
        if (!matched) {
          console.log(`Nav mismatch: ${item.label} -> ${currentUrl}`);
        }
      }
    } catch (e) {
      navResults.push({
        label: item.label,
        expectedPath: item.expectedPath,
        error: e.message,
        success: false,
      });
    }
  }

  // Test active state
  await page.goto(`${BASE}/clients`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  const activeNavItem = await page.evaluate(() => {
    const navLinks = document.querySelectorAll("header a");
    for (const link of navLinks) {
      const style = link.getAttribute("style") || "";
      if (style.includes("#fd7e14") || style.includes("fd7e14")) {
        return link.textContent?.trim();
      }
    }
    return null;
  });
  navResults.push({
    test: "active_state",
    currentPage: "/clients",
    activeNavLabel: activeNavItem,
    success: activeNavItem === "Clients",
  });

  // Test browser back/forward
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goto(`${BASE}/clients`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goBack();
  await page.waitForTimeout(2000);
  navResults.push({
    test: "browser_back",
    expectedPath: "/dashboard",
    actualUrl: page.url(),
    success: page.url().includes("/dashboard"),
  });

  return navResults;
}

async function testInteractiveElements(page) {
  console.log("Testing interactive elements...");
  const interactiveResults = [];

  await page.setViewportSize({ width: 1440, height: 900 });

  // 1. Test FAB button
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  const fabBtn = page.locator('[data-fab] button').last();
  if (await fabBtn.isVisible()) {
    await fabBtn.click();
    await page.waitForTimeout(500);
    const fabMenuVisible = await page.locator('[data-fab] a, [data-fab] button').count();
    interactiveResults.push({
      test: "fab_open",
      success: fabMenuVisible > 1,
      menuItems: fabMenuVisible,
    });
    // Close FAB
    await fabBtn.click();
    await page.waitForTimeout(500);
  }

  // 2. Test New Invoice button on invoices page
  await page.goto(`${BASE}/invoices`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  const newInvoiceBtn = page.locator('button:has-text("New Invoice")').first();
  if (await newInvoiceBtn.isVisible()) {
    await newInvoiceBtn.click();
    await page.waitForTimeout(1500);
    const modalVisible = await page.locator('.fixed.inset-0, [class*="modal"], [role="dialog"]').count();
    interactiveResults.push({
      test: "new_invoice_modal",
      success: modalVisible > 0,
      modalCount: modalVisible,
    });
    // Close modal
    const closeBtn = page.locator('.fixed.inset-0 button:has(svg)').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    } else {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  }

  // 3. Test search on clients page
  await page.goto(`${BASE}/clients`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  const searchInput = page.locator('input[placeholder*="Search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill("test");
    await page.waitForTimeout(1000);
    interactiveResults.push({
      test: "clients_search",
      success: true,
    });
    await searchInput.clear();
  }

  // 4. Test client row click
  const clientCards = page.locator('.glass-card a[href*="/clients/"]');
  const clientCount = await clientCards.count();
  if (clientCount > 0) {
    const href = await clientCards.first().getAttribute("href");
    await clientCards.first().click();
    await page.waitForTimeout(3000);
    interactiveResults.push({
      test: "client_detail_navigation",
      success: page.url().includes("/clients/"),
      navigatedTo: page.url(),
    });
    await page.goBack();
    await page.waitForTimeout(2000);
  }

  // 5. Test notification bell
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  const bellBtn = page.locator('header button').filter({ has: page.locator('svg') }).first();
  if (await bellBtn.isVisible()) {
    await bellBtn.click();
    await page.waitForTimeout(500);
    const notifDropdown = page.locator('text="Notifications"');
    interactiveResults.push({
      test: "notification_dropdown",
      success: await notifDropdown.count() > 0,
    });
    // Close
    await page.click("body");
    await page.waitForTimeout(300);
  }

  // 6. Test filter dropdowns on invoices
  await page.goto(`${BASE}/invoices`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  const statusFilter = page.locator('button:has-text("All Status")').first();
  if (await statusFilter.isVisible()) {
    await statusFilter.click();
    await page.waitForTimeout(500);
    const dropdownOpen = await page.locator('button:has-text("Draft"), button:has-text("Sent")').count();
    interactiveResults.push({
      test: "invoice_status_filter",
      success: dropdownOpen > 0,
    });
    await page.click("body");
    await page.waitForTimeout(300);
  }

  // 7. Test Add Client modal
  await page.goto(`${BASE}/clients`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  const addClientBtn = page.locator('button:has-text("Add Client")').first();
  if (await addClientBtn.isVisible()) {
    await addClientBtn.click();
    await page.waitForTimeout(1000);
    const addModalVisible = await page.locator('text="Add New Client"').count();
    interactiveResults.push({
      test: "add_client_modal",
      success: addModalVisible > 0,
    });
    // Close modal by pressing Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
  }

  return interactiveResults;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  // Login
  await login(page);

  // Desktop audit for each page
  console.log("\n=== DESKTOP AUDIT ===");
  for (const pageInfo of PAGES) {
    console.log(`Auditing desktop: ${pageInfo.path}`);
    try {
      const result = await auditPage(page, pageInfo, "desktop");
      results.pages.push(result);
    } catch (e) {
      console.log(`Error on ${pageInfo.path}: ${e.message}`);
      results.pages.push({
        path: pageInfo.path,
        label: pageInfo.label,
        viewport: "desktop",
        issues: [{ severity: "critical", issue: `Audit failed: ${e.message}` }],
      });
    }
  }

  // Mobile audit for each page
  console.log("\n=== MOBILE AUDIT ===");
  for (const pageInfo of PAGES) {
    console.log(`Auditing mobile: ${pageInfo.path}`);
    try {
      const result = await auditPage(page, pageInfo, "mobile");
      results.pages.push(result);
    } catch (e) {
      console.log(`Error on mobile ${pageInfo.path}: ${e.message}`);
      results.pages.push({
        path: pageInfo.path,
        label: pageInfo.label,
        viewport: "mobile",
        issues: [{ severity: "critical", issue: `Mobile audit failed: ${e.message}` }],
      });
    }
  }

  // Navigation testing
  console.log("\n=== NAVIGATION TEST ===");
  results.navigation = await testNavigation(page);

  // Interactive elements testing
  console.log("\n=== INTERACTIVE ELEMENTS TEST ===");
  try {
    results.interactive = await testInteractiveElements(page);
  } catch (e) {
    console.log(`Interactive test error: ${e.message}`);
    results.interactive.push({ test: "error", message: e.message });
  }

  // Summary
  const allIssues = results.pages.flatMap((p) => p.issues || []);
  results.summary = {
    totalPages: PAGES.length,
    desktopScreenshots: results.pages.filter((p) => p.viewport === "desktop").length,
    mobileScreenshots: results.pages.filter((p) => p.viewport === "mobile").length,
    totalIssues: allIssues.length,
    critical: allIssues.filter((i) => i.severity === "critical").length,
    high: allIssues.filter((i) => i.severity === "high").length,
    medium: allIssues.filter((i) => i.severity === "medium").length,
    low: allIssues.filter((i) => i.severity === "low").length,
    consoleErrors: results.pages.reduce((s, p) => s + (p.consoleErrors?.length || 0), 0),
  };

  // Write results
  writeFileSync(
    join(RESULTS_DIR, "phase12-ux-test-data.json"),
    JSON.stringify(results, null, 2)
  );
  console.log("\n=== AUDIT COMPLETE ===");
  console.log(JSON.stringify(results.summary, null, 2));

  await browser.close();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
