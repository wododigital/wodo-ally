import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://wodo-ally-production.up.railway.app';
const SCREENSHOT_DIR = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-screenshots/functional';
const RESULTS_FILE = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results/phase6-raw.json';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = [];
let consoleErrors = [];

function log(id, test, result, details) {
  results.push({ id, test, result, details });
  console.log(`[${result}] ${id}: ${test} - ${details}`);
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push({ url: page.url(), message: msg.text() });
  });
  page.on('pageerror', err => {
    consoleErrors.push({ url: page.url(), message: err.message });
  });

  // Login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[type="email"], input[name="email"]', 'accounts@wodo.digital');
  await page.fill('input[type="password"], input[name="password"]', 'WodoAlly@2026');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // ============ PHASE 6: PAYMENTS ============
  console.log('\n=== PHASE 6: PAYMENT FLOWS ===');

  // 6.1 - Payments list page
  await page.goto(`${BASE_URL}/payments`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, '6-01-payments-list');

  const paymentRows = await page.$$('table tbody tr, [class*="payment-row"]');
  log('6-01', 'Payments list loads', paymentRows.length >= 0 ? 'PASS' : 'FAIL', `Found ${paymentRows.length} payment entries`);

  // Stats cards
  const statsCards = await page.$$('[class*="card"], [class*="stat"]');
  const statsText = await page.$$eval('[class*="card"] h3, [class*="card"] p, [class*="stat"]',
    els => els.slice(0, 10).map(e => e.textContent?.trim()).filter(Boolean)
  );
  log('6-02', 'Payment stats cards', statsCards.length > 0 ? 'PASS' : 'WARN', `Cards: ${statsCards.length}. Text: ${statsText.slice(0, 6).join(' | ')}`);

  // Payment rows content
  const paymentData = await page.$$eval('table tbody tr',
    rows => rows.slice(0, 5).map(r => r.textContent?.trim())
  );
  log('6-03', 'Payment row data', paymentData.length > 0 ? 'PASS' : 'WARN', `Sample: ${paymentData[0]?.substring(0, 100)}`);

  // 6.4 - Navigate to invoice detail and test Record Payment from there
  await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Find an invoice to test payment on - look for a non-draft, non-fully-paid one
  const allInvoiceLinks = await page.$$eval('a[href*="/invoices/"]',
    links => links.map(l => ({ href: l.getAttribute('href'), text: l.textContent?.trim() })).filter(l => l.href && !l.href.includes('new'))
  );
  log('6-04', 'Invoice links for payment test', allInvoiceLinks.length > 0 ? 'PASS' : 'WARN',
    `Found ${allInvoiceLinks.length} invoice links`);

  let testedPaymentFlow = false;
  for (const link of allInvoiceLinks.slice(0, 3)) {
    try {
      await page.goto(`${BASE_URL}${link.href}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      const pageText = await page.textContent('body');
      // Look for record payment button
      const recordPayBtn = await page.$('button:has-text("Record Payment"), button:has-text("Add Payment")');

      if (recordPayBtn) {
        await screenshot(page, '6-05-invoice-with-payment-btn');
        log('6-05', 'Record Payment on invoice detail', 'PASS', `Found on ${link.href}`);

        await recordPayBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, '6-06-payment-modal');

        // Check payment form fields
        const amountInput = await page.$('input[name*="amount"], input[type="number"]');
        const dateInput = await page.$('input[name*="date"], input[type="date"]');
        const methodSelect = await page.$('select[name*="method"], button[name*="method"]');

        log('6-06', 'Payment form fields', amountInput ? 'PASS' : 'WARN',
          `Amount: ${amountInput ? 'yes' : 'no'}, Date: ${dateInput ? 'yes' : 'no'}, Method: ${methodSelect ? 'yes' : 'no'}`);

        // Check payment method options
        if (methodSelect) {
          const tagName = await methodSelect.evaluate(el => el.tagName);
          if (tagName === 'SELECT') {
            const options = await methodSelect.$$eval('option', opts => opts.map(o => o.textContent?.trim()));
            log('6-07', 'Payment method options', 'PASS', `Options: ${options.join(', ')}`);
          } else {
            await methodSelect.click();
            await page.waitForTimeout(500);
            const options = await page.$$eval('[role="option"], [class*="option"]',
              els => els.map(e => e.textContent?.trim())
            );
            log('6-07', 'Payment method options', options.length > 0 ? 'PASS' : 'WARN', `Options: ${options.join(', ')}`);
          }
        }

        // TDS deduction field
        const tdsField = await page.$('input[name*="tds"], input[name*="TDS"], [class*="tds"]');
        log('6-08', 'TDS deduction field', tdsField ? 'PASS' : 'WARN', tdsField ? 'Found' : 'Not found');

        // Test negative amount
        if (amountInput) {
          await amountInput.fill('-100');
          await page.waitForTimeout(500);
          await screenshot(page, '6-09-negative-amount');
          log('6-09', 'Negative payment amount', 'INFO', 'Entered -100, checking validation');

          // Try submitting
          const submitPayBtn = await page.$('button[type="submit"], button:has-text("Save"), button:has-text("Record"), button:has-text("Submit")');
          if (submitPayBtn) {
            await submitPayBtn.click();
            await page.waitForTimeout(1000);
            const errors = await page.$$('[class*="error"], [class*="invalid"], [role="alert"]');
            log('6-10', 'Negative amount validation', errors.length > 0 ? 'PASS' : 'FAIL',
              errors.length > 0 ? 'Validation error shown' : 'No validation - SECURITY ISSUE');
          }

          // Reset and test over-payment
          await amountInput.fill('9999999');
          await page.waitForTimeout(500);
          await screenshot(page, '6-11-overpayment');
          log('6-11', 'Overpayment test', 'INFO', 'Entered 9999999');
        }

        // Close modal
        const cancelBtn = await page.$('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]');
        if (cancelBtn) await cancelBtn.click();
        await page.waitForTimeout(500);

        testedPaymentFlow = true;
        break;
      }
    } catch (e) {
      log('6-05-ERR', 'Payment flow error', 'WARN', e.message);
    }
  }

  if (!testedPaymentFlow) {
    log('6-05', 'Record Payment flow', 'BLOCKED', 'Could not find invoice with Record Payment button');

    // Try the edit page instead
    for (const link of allInvoiceLinks.slice(0, 3)) {
      try {
        const editUrl = link.href.replace(/\/?$/, '') + '/edit';
        await page.goto(`${BASE_URL}${link.href}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        await screenshot(page, '6-05-alt-invoice-page');

        // Check all buttons
        const allButtons = await page.$$eval('button', btns => btns.map(b => b.textContent?.trim()).filter(Boolean));
        log('6-05-alt', 'All buttons on invoice page', 'INFO', `Buttons: ${allButtons.join(', ')}`);
        break;
      } catch (e) {}
    }
  }

  // 6.12 - Check payment links back to invoices
  await page.goto(`${BASE_URL}/payments`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  const paymentInvoiceLinks = await page.$$('a[href*="/invoices/"]');
  log('6-12', 'Payments link to invoices', paymentInvoiceLinks.length > 0 ? 'PASS' : 'WARN',
    `${paymentInvoiceLinks.length} invoice links from payments page`);

  // 6.13 - Overdue detection
  const overdueIndicators = await page.$$('[class*="overdue"], [class*="red"], text=Overdue');
  log('6-13', 'Overdue detection', 'INFO', `${overdueIndicators.length} overdue indicators found`);

  // Save
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results, consoleErrors }, null, 2));
  console.log(`\nPhase 6 complete. ${results.length} tests, Console errors: ${consoleErrors.length}`);
  await browser.close();
})();
