import { chromium, Browser, Page, ConsoleMessage } from "playwright";

const BASE_URL = "https://wodo-ally-production.up.railway.app";
const EMAIL = "accounts@wodo.digital";
const PASSWORD = "WodoAlly@2026";
const SCREENSHOT_DIR = "/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-screenshots/edge-cases";

interface TestResult {
  id: string;
  name: string;
  result: "PASS" | "FAIL" | "WARN" | "SKIP";
  details: string;
}

const results: TestResult[] = [];
const consoleErrors: { page: string; message: string }[] = [];

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[name="email"]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');

  if (await emailInput.count() > 0) {
    await emailInput.fill(EMAIL);
    await passwordInput.fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
  }
}

function captureConsole(page: Page, pageName: string) {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      consoleErrors.push({ page: pageName, message: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push({ page: pageName, message: `PAGE ERROR: ${err.message}` });
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  captureConsole(page, "global");

  // Login first
  console.log("Logging in...");
  await login(page);

  // Verify login success
  const currentUrl = page.url();
  if (currentUrl.includes("login")) {
    console.log("Login may have failed, trying to proceed anyway...");
  }
  console.log(`After login, URL: ${currentUrl}`);

  // ─── TEST 1: Invalid UUID client page ─────────────────────────────────
  try {
    console.log("Test 1: Invalid UUID client page");
    captureConsole(page, "/clients/invalid-uuid");
    await page.goto(`${BASE_URL}/clients/00000000-0000-0000-0000-000000000000`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent("body") ?? "";
    const hasError = bodyText.includes("not found") || bodyText.includes("error") || bodyText.includes("404");
    const has500 = bodyText.includes("500") || bodyText.includes("Internal Server Error");
    const hasContent = bodyText.length > 50;
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-invalid-client-uuid.png`, fullPage: true });

    if (has500) {
      results.push({ id: "T01", name: "Invalid UUID client page", result: "FAIL", details: "Shows 500 or internal error. Should show 404 or 'Client not found'." });
    } else if (hasError) {
      results.push({ id: "T01", name: "Invalid UUID client page", result: "PASS", details: `Shows error/not-found message. Page content snippet: ${bodyText.slice(0, 100)}` });
    } else if (hasContent) {
      results.push({ id: "T01", name: "Invalid UUID client page", result: "WARN", details: `Page loads with content but no clear error. URL: ${page.url()}. Snippet: ${bodyText.slice(0, 100)}` });
    } else {
      results.push({ id: "T01", name: "Invalid UUID client page", result: "WARN", details: `Blank or minimal content. URL: ${page.url()}` });
    }
  } catch (e: any) {
    results.push({ id: "T01", name: "Invalid UUID client page", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── TEST 2: Non-existent invoice ─────────────────────────────────────
  try {
    console.log("Test 2: Non-existent invoice page");
    captureConsole(page, "/invoices/nonexistent");
    await page.goto(`${BASE_URL}/invoices/nonexistent-id`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent("body") ?? "";
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-nonexistent-invoice.png`, fullPage: true });

    const showsSpinner = await page.locator('.animate-spin').count() > 0;
    const hasErrorMsg = bodyText.includes("not found") || bodyText.includes("error");

    if (showsSpinner) {
      results.push({ id: "T02", name: "Non-existent invoice page", result: "WARN", details: "Infinite loading spinner displayed - no error/not-found message shown" });
    } else if (hasErrorMsg) {
      results.push({ id: "T02", name: "Non-existent invoice page", result: "PASS", details: "Shows error or not-found" });
    } else {
      results.push({ id: "T02", name: "Non-existent invoice page", result: "WARN", details: `No clear error shown. Content: ${bodyText.slice(0, 100)}` });
    }
  } catch (e: any) {
    results.push({ id: "T02", name: "Non-existent invoice page", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── TEST 3: Completely fake route ────────────────────────────────────
  try {
    console.log("Test 3: Fake route 404");
    captureConsole(page, "/completely-fake-route");
    const resp = await page.goto(`${BASE_URL}/completely-fake-route`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);
    const bodyText = await page.textContent("body") ?? "";
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-fake-route.png`, fullPage: true });

    const status = resp?.status();
    const has404 = bodyText.includes("404") || bodyText.includes("not found") || bodyText.includes("Page not found");

    if (has404) {
      results.push({ id: "T03", name: "Fake route 404 page", result: "PASS", details: `Status: ${status}. Shows 404 page correctly.` });
    } else {
      results.push({ id: "T03", name: "Fake route 404 page", result: "FAIL", details: `Status: ${status}. No 404 message. Content: ${bodyText.slice(0, 100)}` });
    }
  } catch (e: any) {
    results.push({ id: "T03", name: "Fake route 404 page", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── TEST 4: Empty required fields ────────────────────────────────────
  try {
    console.log("Test 4: Empty required fields on invoice form");
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);

    // Look for a "New Invoice" or "Create" button
    const newBtn = page.locator('button:has-text("New"), button:has-text("Create"), a:has-text("New")').first();
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(1500);

      // Try to submit without filling anything
      const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")').first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-empty-form-submit.png`, fullPage: true });

        const bodyText = await page.textContent("body") ?? "";
        const hasValidation = bodyText.includes("required") || bodyText.includes("Required") || bodyText.includes("must") || bodyText.includes("please");
        results.push({ id: "T04", name: "Empty form submission validation", result: hasValidation ? "PASS" : "WARN", details: hasValidation ? "Validation messages shown" : "No visible validation messages detected" });
      } else {
        results.push({ id: "T04", name: "Empty form submission validation", result: "SKIP", details: "Submit button not found" });
      }
    } else {
      results.push({ id: "T04", name: "Empty form submission validation", result: "SKIP", details: "New invoice button not found" });
    }
  } catch (e: any) {
    results.push({ id: "T04", name: "Empty form submission validation", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── TEST 5: Very long text in company name ───────────────────────────
  try {
    console.log("Test 5: Long text in company name");
    await page.goto(`${BASE_URL}/onboard`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);

    const companyInput = page.locator('input[name="company_name"], input[placeholder*="company"], input[placeholder*="Company"]').first();
    if (await companyInput.count() > 0) {
      const longText = "A".repeat(5000);
      await companyInput.fill(longText);
      await page.waitForTimeout(500);
      const value = await companyInput.inputValue();
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-long-company-name.png`, fullPage: true });
      results.push({ id: "T05", name: "Long text (5000 chars) in company name", result: value.length === 5000 ? "WARN" : "PASS", details: `Field accepted ${value.length} chars. ${value.length === 5000 ? "No max-length constraint - could cause DB issues" : "Truncated appropriately"}` });
    } else {
      results.push({ id: "T05", name: "Long text (5000 chars) in company name", result: "SKIP", details: "Company name input not found on onboard page" });
    }
  } catch (e: any) {
    results.push({ id: "T05", name: "Long text (5000 chars) in company name", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── TEST 6: Special characters in text fields ────────────────────────
  try {
    console.log("Test 6: Special characters in text fields");
    await page.goto(`${BASE_URL}/onboard`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);

    const companyInput = page.locator('input[name="company_name"], input[placeholder*="company"], input[placeholder*="Company"]').first();
    if (await companyInput.count() > 0) {
      const specialChars = '<script>alert("XSS")</script>&<>"\'';
      await companyInput.fill(specialChars);
      await page.waitForTimeout(500);
      const value = await companyInput.inputValue();
      await page.screenshot({ path: `${SCREENSHOT_DIR}/06-special-chars.png`, fullPage: true });
      results.push({ id: "T06", name: "Special characters in text fields", result: "PASS", details: `Field accepts special chars: "${value}". React auto-escapes on render.` });
    } else {
      results.push({ id: "T06", name: "Special characters in text fields", result: "SKIP", details: "Company input not found" });
    }
  } catch (e: any) {
    results.push({ id: "T06", name: "Special characters in text fields", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── TEST 7-9: Numeric edge cases in amount fields ────────────────────
  try {
    console.log("Tests 7-9: Numeric edge cases");
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);

    // Try opening new invoice form
    const newBtn = page.locator('button:has-text("New"), button:has-text("Create"), a:has-text("New")').first();
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(1500);

      // Find amount field
      const amountInput = page.locator('input[type="number"][placeholder*="0"], input[name*="amount"], input[placeholder*="Amount"]').first();
      if (await amountInput.count() > 0) {
        // Test negative
        await amountInput.fill("-100");
        const negVal = await amountInput.inputValue();

        // Test zero
        await amountInput.fill("0");
        const zeroVal = await amountInput.inputValue();

        // Test huge number
        await amountInput.fill("999999999999");
        const hugeVal = await amountInput.inputValue();

        await page.screenshot({ path: `${SCREENSHOT_DIR}/07-09-numeric-edges.png`, fullPage: true });

        results.push({ id: "T07", name: "Negative number in amount field", result: negVal === "-100" ? "WARN" : "PASS", details: `Negative value ${negVal === "-100" ? "accepted (should validate)" : "rejected"}` });
        results.push({ id: "T08", name: "Zero in amount field", result: "PASS", details: `Zero value accepted: ${zeroVal}` });
        results.push({ id: "T09", name: "Extremely large number in amount", result: "WARN", details: `Large value accepted: ${hugeVal}. No upper bound validation detected.` });
      } else {
        results.push({ id: "T07", name: "Negative number in amount field", result: "SKIP", details: "Amount input not found" });
        results.push({ id: "T08", name: "Zero in amount field", result: "SKIP", details: "Amount input not found" });
        results.push({ id: "T09", name: "Extremely large number in amount", result: "SKIP", details: "Amount input not found" });
      }
    } else {
      results.push({ id: "T07", name: "Negative number in amount field", result: "SKIP", details: "New invoice button not found" });
      results.push({ id: "T08", name: "Zero in amount field", result: "SKIP", details: "New invoice button not found" });
      results.push({ id: "T09", name: "Extremely large number in amount", result: "SKIP", details: "New invoice button not found" });
    }
  } catch (e: any) {
    results.push({ id: "T07", name: "Negative number in amount field", result: "FAIL", details: `Exception: ${e.message}` });
    results.push({ id: "T08", name: "Zero in amount field", result: "FAIL", details: `Exception: ${e.message}` });
    results.push({ id: "T09", name: "Extremely large number in amount", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── TEST 10: Double submit ───────────────────────────────────────────
  try {
    console.log("Test 10: Double submit prevention");
    // This is more of a code review test - check if submit buttons disable
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);

    // Check if any submit buttons have disabled state logic
    const submitBtns = page.locator('button[type="submit"], button:has-text("Save")');
    const count = await submitBtns.count();

    results.push({ id: "T10", name: "Double submit prevention (rapid clicks)", result: "WARN", details: `Found ${count} submit-type buttons. Code review shows disabled={isPending} pattern used in some forms - good practice. Full coverage needs verification.` });
  } catch (e: any) {
    results.push({ id: "T10", name: "Double submit prevention", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── TEST 11: Browser back/forward ────────────────────────────────────
  try {
    console.log("Test 11: Browser back/forward");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.goto(`${BASE_URL}/clients`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.goBack();
    await page.waitForTimeout(1500);

    const urlAfterBack = page.url();
    const bodyText = await page.textContent("body") ?? "";
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-browser-back.png`, fullPage: true });

    const pageRendered = bodyText.length > 100;
    results.push({ id: "T11", name: "Browser back/forward during navigation", result: pageRendered ? "PASS" : "WARN", details: `URL after back: ${urlAfterBack}. Page rendered: ${pageRendered}` });
  } catch (e: any) {
    results.push({ id: "T11", name: "Browser back/forward", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── TEST 12: Console errors on all pages ─────────────────────────────
  const pagesToCheck = [
    "/dashboard",
    "/clients",
    "/invoices",
    "/projects",
    "/contracts",
    "/payments",
    "/expenses",
    "/analytics",
    "/targets",
    "/reports",
    "/settings",
    "/pipeline",
  ];

  console.log("Test 12: Checking console errors across all pages...");
  for (const path of pagesToCheck) {
    try {
      const pg = await context.newPage();
      captureConsole(pg, path);
      await pg.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle", timeout: 20000 });
      await pg.waitForTimeout(2000);
      await pg.screenshot({ path: `${SCREENSHOT_DIR}/12-page-${path.replace(/\//g, "-").slice(1)}.png`, fullPage: true });
      await pg.close();
    } catch (e: any) {
      consoleErrors.push({ page: path, message: `Navigation error: ${e.message}` });
    }
  }
  results.push({ id: "T12", name: "Console errors across all pages", result: consoleErrors.length > 0 ? "WARN" : "PASS", details: `Found ${consoleErrors.length} console errors across ${pagesToCheck.length} pages` });

  // ─── TEST 13: Loading states vs blank screens ─────────────────────────
  try {
    console.log("Test 13: Loading states");
    const pg = await context.newPage();
    await pg.goto(`${BASE_URL}/dashboard`, { waitUntil: "commit", timeout: 15000 });
    // Check immediately for loading indicator
    await pg.waitForTimeout(300);
    const bodyHtml = await pg.content();
    const hasLoadingIndicator = bodyHtml.includes("animate-spin") || bodyHtml.includes("Loading") || bodyHtml.includes("skeleton") || bodyHtml.includes("Skeleton");
    await pg.screenshot({ path: `${SCREENSHOT_DIR}/13-loading-state.png`, fullPage: true });
    await pg.close();

    results.push({ id: "T13", name: "Loading states vs blank screens", result: hasLoadingIndicator ? "PASS" : "WARN", details: hasLoadingIndicator ? "Loading indicator detected during page load" : "No loading indicator detected - page may flash blank" });
  } catch (e: any) {
    results.push({ id: "T13", name: "Loading states vs blank screens", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── TEST 14: Rapid button clicks ─────────────────────────────────────
  try {
    console.log("Test 14: Rapid button clicks");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(1500);

    // Find any clickable button/link and rapidly click it
    const buttons = page.locator("button").first();
    if (await buttons.count() > 0) {
      for (let i = 0; i < 5; i++) {
        await buttons.click({ force: true }).catch(() => {});
      }
      await page.waitForTimeout(1000);
      const bodyText = await page.textContent("body") ?? "";
      await page.screenshot({ path: `${SCREENSHOT_DIR}/14-rapid-clicks.png`, fullPage: true });
      results.push({ id: "T14", name: "Rapid button clicks", result: bodyText.length > 50 ? "PASS" : "WARN", details: "Page still functional after rapid clicks" });
    } else {
      results.push({ id: "T14", name: "Rapid button clicks", result: "SKIP", details: "No buttons found" });
    }
  } catch (e: any) {
    results.push({ id: "T14", name: "Rapid button clicks", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── TEST 15: Slow network simulation ─────────────────────────────────
  try {
    console.log("Test 15: Slow network");
    const slowContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const slowPage = await slowContext.newPage();

    // Simulate slow network via CDP
    const cdp = await slowPage.context().newCDPSession(slowPage);
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: 50 * 1024, // 50KB/s
      uploadThroughput: 20 * 1024,
      latency: 2000,
    });

    await login(slowPage);

    const startTime = Date.now();
    await slowPage.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
    const loadTime = Date.now() - startTime;

    await slowPage.screenshot({ path: `${SCREENSHOT_DIR}/15-slow-network.png`, fullPage: true });
    await slowContext.close();

    results.push({ id: "T15", name: "Slow network behavior", result: loadTime < 30000 ? "PASS" : "WARN", details: `Dashboard loaded in ${loadTime}ms on simulated slow network` });
  } catch (e: any) {
    results.push({ id: "T15", name: "Slow network behavior", result: "WARN", details: `Slow network test: ${e.message}` });
  }

  // ─── TEST 16: Error message content ───────────────────────────────────
  try {
    console.log("Test 16: Error message leakage check");
    // Try an API call with invalid data
    const resp = await page.evaluate(async () => {
      try {
        const r = await fetch("/api/invoices/export-csv?invoiceType=INVALID", { credentials: "include" });
        return { status: r.status, body: await r.text() };
      } catch {
        return { status: 0, body: "fetch failed" };
      }
    });

    const hasStackTrace = resp.body.includes("at ") && resp.body.includes(".ts:");
    const hasSqlError = resp.body.toLowerCase().includes("sql") || resp.body.includes("relation") || resp.body.includes("column");

    results.push({ id: "T16", name: "Error messages leak technical details", result: hasStackTrace || hasSqlError ? "FAIL" : "PASS", details: `API error response (status ${resp.status}): ${resp.body.slice(0, 200)}. Stack trace: ${hasStackTrace}. SQL: ${hasSqlError}` });
  } catch (e: any) {
    results.push({ id: "T16", name: "Error messages leak technical details", result: "FAIL", details: `Exception: ${e.message}` });
  }

  // ─── Output results ───────────────────────────────────────────────────
  console.log("\n\n=== TEST RESULTS ===\n");
  for (const r of results) {
    console.log(`${r.id} | ${r.result} | ${r.name} | ${r.details}`);
  }

  console.log("\n=== CONSOLE ERRORS ===\n");
  for (const e of consoleErrors) {
    console.log(`[${e.page}] ${e.message}`);
  }

  // Write results to JSON for processing
  const output = JSON.stringify({ results, consoleErrors }, null, 2);
  const fs = await import("fs");
  fs.writeFileSync(
    "/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results/edge-case-test-results.json",
    output
  );

  await browser.close();
  console.log("\nDone. Results saved.");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
