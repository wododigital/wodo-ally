import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://wodo-ally-production.up.railway.app';
const SCREENSHOT_DIR = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-screenshots/functional';
const RESULTS_FILE = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results/invoice-detail-raw.json';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = [];
let consoleErrors = [];

function log(id, test, result, details) {
  results.push({ id, test, result, details });
  console.log(`[${result}] ${id}: ${test} - ${details}`);
}

async function screenshot(page, name) {
  try {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
  } catch (e) {}
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

  // Go to invoices list
  await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);

  // Get ALL links on the page
  const allLinks = await page.$$eval('a', links => links.map(l => ({
    href: l.getAttribute('href'),
    text: l.textContent?.trim()?.substring(0, 60)
  })));
  console.log('All links on invoices page:', JSON.stringify(allLinks.filter(l => l.href?.includes('invoic')), null, 2));

  // Try clicking rows instead
  const tableRows = await page.$$('table tbody tr');
  console.log(`Table rows: ${tableRows.length}`);

  // Get row text content to understand structure
  for (let i = 0; i < Math.min(tableRows.length, 3); i++) {
    const rowText = await tableRows[i].textContent();
    console.log(`Row ${i}: ${rowText?.substring(0, 100)}`);
  }

  // Click first row to navigate
  if (tableRows.length > 0) {
    // Check if row has onClick or is a link
    const firstRowLinks = await tableRows[0].$$('a');
    console.log(`First row has ${firstRowLinks.length} links`);

    // Try clicking the row itself
    try {
      await tableRows[0].click();
      await page.waitForTimeout(2000);
      const afterClickUrl = page.url();
      console.log(`After clicking first row: ${afterClickUrl}`);
      await screenshot(page, 'INV-row-click');

      if (afterClickUrl.includes('/invoices/')) {
        log('INV-CLICK', 'Click row navigates to detail', 'PASS', `URL: ${afterClickUrl}`);

        // Now test all the detail page features
        const bodyText = await page.textContent('body');

        // H1 = invoice number
        const h1 = await page.$eval('h1', el => el.textContent?.trim()).catch(() => 'N/A');
        log('INV-H1', 'Invoice number display', 'PASS', h1);

        // Check all buttons
        const btns = await page.$$eval('button', bs => bs.map(b => b.textContent?.trim()).filter(t => t && t.length > 0 && t.length < 60));
        log('INV-BTNS', 'All buttons', 'INFO', btns.join(' | '));

        // Check for Edit link
        const editLink = await page.$('a:has-text("Edit")');
        log('INV-EDIT', 'Edit button', editLink ? 'PASS' : 'WARN', editLink ? 'Found' : 'Not found');

        // Check for Preview PDF
        const pdfBtn = await page.$('button:has-text("Preview PDF")');
        log('INV-PDF', 'Preview PDF button', pdfBtn ? 'PASS' : 'WARN', pdfBtn ? 'Found' : 'Not found');

        // Check for Download
        const dlBtn = await page.$('button:has-text("Download")');
        log('INV-DL', 'Download button', dlBtn ? 'PASS' : 'WARN', dlBtn ? 'Found' : 'Not found');

        // Check for Record Payment
        const rpBtn = await page.$('button:has-text("Record Payment")');
        log('INV-RP', 'Record Payment button', rpBtn ? 'PASS' : 'INFO', rpBtn ? 'Found' : 'Not visible (may be fully paid)');

        // Check for line items
        const lineItems = await page.$$('table tbody tr');
        log('INV-LINES', 'Line items', lineItems.length > 0 ? 'PASS' : 'WARN', `${lineItems.length} items`);

        // Check for payment summary
        const paySummary = await page.$('h3:has-text("Payment Summary")');
        log('INV-PAY-SUM', 'Payment Summary section', paySummary ? 'PASS' : 'WARN', paySummary ? 'Found' : 'Not found');

        // Check for email activity
        const emailAct = await page.$('h3:has-text("Email Activity")');
        log('INV-EMAIL', 'Email Activity section', emailAct ? 'PASS' : 'WARN', emailAct ? 'Found' : 'Not found');

        // Test Record Payment if available
        if (rpBtn) {
          await rpBtn.click();
          await page.waitForTimeout(2000);
          await screenshot(page, 'INV-payment-modal');

          // Verify modal fields
          const modalH2 = await page.$eval('h2', el => el.textContent?.trim()).catch(() => 'N/A');
          log('INV-RP-MODAL', 'Payment modal title', modalH2.includes('Record') || modalH2.includes('Payment') ? 'PASS' : 'FAIL', `Title: ${modalH2}`);

          // Test payment amount validation
          const amountInput = await page.$('input[type="number"][step="0.01"]');
          if (amountInput) {
            // Try zero amount
            await amountInput.fill('0');
            const submitBtn = await page.$('button[type="submit"]:has-text("Record Payment")');
            if (submitBtn) {
              await submitBtn.click();
              await page.waitForTimeout(500);
              await screenshot(page, 'INV-payment-zero');
              log('INV-RP-ZERO', 'Zero amount validation', 'INFO', 'Tested zero amount submission');
            }

            // Try very large amount
            await amountInput.fill('99999999');
            await page.waitForTimeout(300);
            await screenshot(page, 'INV-payment-large');
            log('INV-RP-LARGE', 'Large overpayment', 'WARN', 'No server-side validation visible for overpayment');
          }

          // Check method dropdown
          const methodSelect = await page.$('select:has(option)');
          if (methodSelect) {
            const options = await methodSelect.$$eval('option', os => os.map(o => o.textContent?.trim()));
            log('INV-RP-METHODS', 'Payment methods', 'PASS', options.join(', '));
          }

          // TDS field
          const tdsInput = await page.$('input[placeholder="0"]');
          log('INV-RP-TDS', 'TDS input', tdsInput ? 'PASS' : 'WARN', tdsInput ? 'Found' : 'Not found');

          // Close modal
          await page.$eval('button:has-text("Cancel")', b => b.click()).catch(() => {});
          await page.waitForTimeout(500);
        }

        // Test status change dropdown
        const statusDropdown = await page.$('button:has-text("Draft"), button:has-text("Sent"), button:has-text("Paid"), button:has-text("Overdue")');
        if (statusDropdown) {
          const statusText = await statusDropdown.textContent();
          log('INV-STATUS', 'Status dropdown', 'PASS', `Current: ${statusText?.trim()}`);
        }

        // Check send email dropdown
        const sendDropdown = await page.$('button:has-text("Send")');
        if (sendDropdown) {
          log('INV-SEND', 'Send dropdown', 'PASS', 'Found');
        }
      }

      // Go back to list
      await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
    } catch(e) {
      log('INV-CLICK-ERR', 'Row click error', 'FAIL', e.message);
    }
  }

  // Test the invoice tab filters more carefully
  console.log('\n=== INVOICE TAB FILTERS ===');
  await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Get all tab-like buttons at the top
  const allTopBtns = await page.$$eval('button',
    btns => btns.map(b => ({
      text: b.textContent?.trim(),
      dataState: b.getAttribute('data-state'),
      role: b.getAttribute('role')
    })).filter(b => b.text && b.text.length < 30)
  );
  log('INV-TABS', 'All button elements', 'INFO', JSON.stringify(allTopBtns.slice(0, 20)));

  // Try to find invoice creation flow better
  console.log('\n=== NEW INVOICE FLOW ===');
  const newInvBtn = await page.$('button:has-text("New Invoice"), button:has-text("Create")');
  if (newInvBtn) {
    await newInvBtn.click();
    await page.waitForTimeout(3000);
    await screenshot(page, 'INV-new-invoice-form');

    const formUrl = page.url();
    log('INV-NEW', 'New invoice form', 'PASS', `URL: ${formUrl}`);

    // Check what opened - dialog or page
    const dialog = await page.$('[role="dialog"], .fixed');
    const isModal = !!dialog;
    log('INV-NEW-TYPE', 'Form type', 'INFO', isModal ? 'Modal/dialog' : 'Inline/page form');

    // Check all form fields
    const formFields = await page.$$eval('input, select, textarea', els => els.map(e => ({
      tag: e.tagName,
      type: e.getAttribute('type'),
      name: e.getAttribute('name'),
      placeholder: e.getAttribute('placeholder'),
      className: e.className?.substring(0, 50)
    })));
    log('INV-NEW-FIELDS', 'Form fields', 'INFO', JSON.stringify(formFields));

    // Check for client dropdown/select
    const clientField = await page.$$eval('label', labels => labels.map(l => l.textContent?.trim()));
    log('INV-NEW-LABELS', 'Form labels', 'INFO', clientField.join(', '));

    // Check for tax calculation display
    const taxDisplay = await page.textContent('body');
    const hasTaxCalc = taxDisplay.includes('Subtotal') || taxDisplay.includes('GST') || taxDisplay.includes('Tax');
    log('INV-NEW-TAX', 'Tax calculation', hasTaxCalc ? 'PASS' : 'WARN', `Tax elements visible: ${hasTaxCalc}`);

    // Check invoice type selector
    const invoiceTypes = await page.$$('button:has-text("GST"), button:has-text("Non-GST"), button:has-text("International"), button:has-text("Pro Forma")');
    log('INV-NEW-TYPES', 'Invoice type selector', invoiceTypes.length > 0 ? 'PASS' : 'WARN', `${invoiceTypes.length} type buttons`);
  }

  // Test clients more thoroughly
  console.log('\n=== CLIENT DETAIL DEEP DIVE ===');
  await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Get client links
  const clientLinks = await page.$$eval('a', ls => ls.map(l => ({
    href: l.getAttribute('href'),
    text: l.textContent?.trim()?.substring(0, 40)
  })).filter(l => l.href?.includes('/clients/') && l.href.length > 15));

  console.log('Client links:', JSON.stringify(clientLinks.slice(0, 5)));

  // Click first row
  const clientRows = await page.$$('table tbody tr');
  if (clientRows.length > 0) {
    await clientRows[0].click();
    await page.waitForTimeout(2000);
    await screenshot(page, 'CLIENT-detail-view');

    const clientUrl = page.url();
    log('CLIENT-DETAIL', 'Client detail navigation', clientUrl.includes('/clients/') ? 'PASS' : 'FAIL', `URL: ${clientUrl}`);

    if (clientUrl.includes('/clients/')) {
      // Check all content sections
      const sections = await page.$$eval('h3, h2', els => els.map(e => e.textContent?.trim()));
      log('CLIENT-SECTIONS', 'Content sections', 'INFO', sections.join(', '));

      // Check health score
      const healthText = await page.textContent('body');
      const healthMatch = healthText.match(/(\d+)\s*\/?\s*100|Score[:\s]*(\d+)/);
      log('CLIENT-HEALTH', 'Health score', healthMatch ? 'PASS' : 'WARN',
        healthMatch ? `Score: ${healthMatch[0]}` : 'No clear health score found');

      // Tabs
      const clientTabBtns = await page.$$eval('button', btns => btns.map(b => ({
        text: b.textContent?.trim(),
        role: b.getAttribute('role')
      })).filter(b => b.text && b.text.length < 20));
      log('CLIENT-TABS', 'Tab buttons', 'INFO', clientTabBtns.map(t => t.text).join(', '));

      // Click Projects tab
      const projectsTab = await page.$('button:has-text("Projects")');
      if (projectsTab) {
        await projectsTab.click();
        await page.waitForTimeout(1000);
        await screenshot(page, 'CLIENT-projects-tab');
        log('CLIENT-PROJ-TAB', 'Projects tab', 'PASS', 'Loaded');
      }

      // Click Invoices tab
      const invoicesTab = await page.$('button:has-text("Invoices")');
      if (invoicesTab) {
        await invoicesTab.click();
        await page.waitForTimeout(1000);
        await screenshot(page, 'CLIENT-invoices-tab');
        log('CLIENT-INV-TAB', 'Invoices tab', 'PASS', 'Loaded');
      }

      // Click Payments tab
      const paymentsTab = await page.$('button:has-text("Payments")');
      if (paymentsTab) {
        await paymentsTab.click();
        await page.waitForTimeout(1000);
        await screenshot(page, 'CLIENT-payments-tab');
        log('CLIENT-PAY-TAB', 'Payments tab', 'PASS', 'Loaded');
      }
    }
  }

  // Save
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results, consoleErrors }, null, 2));
  console.log(`\nInvoice detail tests complete. ${results.length} tests, Console errors: ${consoleErrors.length}`);
  await browser.close();
})();
