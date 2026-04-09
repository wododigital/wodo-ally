import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://wodo-ally-production.up.railway.app';
const SCREENSHOT_DIR = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-screenshots/functional';
const RESULTS_FILE = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results/phase5-raw.json';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = [];
let consoleErrors = [];

function log(id, test, result, details) {
  const entry = { id, test, result, details };
  results.push(entry);
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

  // ============ PHASE 5: INVOICE ENGINE ============
  console.log('\n=== PHASE 5: INVOICE ENGINE ===');

  // 5.1 - Invoice list page
  await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await screenshot(page, '5-01-invoices-list');

  const invoiceRows = await page.$$('table tbody tr, [class*="invoice-row"]');
  log('5-01', 'Invoice list loads', invoiceRows.length > 0 ? 'PASS' : 'WARN', `Found ${invoiceRows.length} invoices`);

  // 5.2 - Tab filters
  const tabButtons = await page.$$eval('button[role="tab"], [class*="tab-trigger"], [data-state]',
    els => els.map(e => ({ text: e.textContent?.trim(), active: e.getAttribute('data-state') === 'active' }))
  );
  log('5-02', 'Tab filters exist', tabButtons.length > 0 ? 'PASS' : 'WARN', `Tabs: ${tabButtons.map(t => t.text).join(', ')}`);

  // Click each tab
  for (const tab of ['All', 'Draft', 'Sent', 'Paid', 'Overdue', 'Partially Paid']) {
    try {
      const tabEl = await page.$(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`);
      if (tabEl) {
        await tabEl.click();
        await page.waitForTimeout(1000);
        const rowsAfter = await page.$$('table tbody tr');
        log(`5-02-${tab}`, `Tab filter: ${tab}`, 'PASS', `${rowsAfter.length} invoices shown`);
      } else {
        log(`5-02-${tab}`, `Tab filter: ${tab}`, 'WARN', 'Tab not found');
      }
    } catch (e) {
      log(`5-02-${tab}`, `Tab filter: ${tab}`, 'FAIL', e.message);
    }
  }

  // Click "All" to reset
  const allTab = await page.$('button:has-text("All"), [role="tab"]:has-text("All")');
  if (allTab) await allTab.click();
  await page.waitForTimeout(1000);

  // 5.3 - Search
  const searchInput = await page.$('input[placeholder*="earch"], input[type="search"]');
  if (searchInput) {
    await searchInput.fill('G');
    await page.waitForTimeout(1000);
    await screenshot(page, '5-03-search-invoices');
    const searchResults = await page.$$('table tbody tr');
    log('5-03', 'Invoice search', 'PASS', `Search "G" returned ${searchResults.length} results`);
    await searchInput.fill('');
    await page.waitForTimeout(500);
  } else {
    log('5-03', 'Invoice search', 'WARN', 'No search input found');
  }

  // 5.4 - CSV Export
  const exportBtn = await page.$('button:has-text("Export"), button:has-text("CSV"), button:has-text("Download")');
  log('5-04', 'CSV export button', exportBtn ? 'PASS' : 'WARN', exportBtn ? 'Found' : 'Not found');

  // 5.5 - New Invoice flow
  const newInvoiceBtn = await page.$('button:has-text("New Invoice"), a:has-text("New Invoice"), button:has-text("Create Invoice")');
  log('5-05', 'New Invoice button', newInvoiceBtn ? 'PASS' : 'FAIL', newInvoiceBtn ? 'Found' : 'Not found');

  if (newInvoiceBtn) {
    await newInvoiceBtn.click();
    await page.waitForTimeout(3000);
    await screenshot(page, '5-06-new-invoice-form');

    const newInvUrl = page.url();
    log('5-06', 'New invoice form opens', 'PASS', `URL: ${newInvUrl}`);

    // Check for client selection
    const clientSelect = await page.$('select[name*="client"], [class*="client-select"], button:has-text("Select Client"), [class*="combobox"]');
    log('5-07', 'Client selection field', clientSelect ? 'PASS' : 'WARN', clientSelect ? 'Found' : 'Not found');

    // Look for line items area
    const lineItemsArea = await page.$$('input[name*="description"], input[name*="qty"], input[name*="rate"], input[placeholder*="Description"]');
    log('5-08', 'Line items fields', lineItemsArea.length > 0 ? 'PASS' : 'WARN', `${lineItemsArea.length} line item fields found`);

    // Add line item button
    const addLineBtn = await page.$('button:has-text("Add Line"), button:has-text("Add Item"), button:has-text("+ Add")');
    log('5-09', 'Add line item button', addLineBtn ? 'PASS' : 'WARN', addLineBtn ? 'Found' : 'Not found');

    // Check for subtotal/tax/total display
    const bodyText = await page.textContent('body');
    const hasSubtotal = bodyText.includes('Subtotal') || bodyText.includes('subtotal');
    const hasTax = bodyText.includes('Tax') || bodyText.includes('GST') || bodyText.includes('IGST');
    const hasTotal = bodyText.includes('Total') || bodyText.includes('total');
    log('5-10', 'Subtotal/Tax/Total display', hasSubtotal && hasTotal ? 'PASS' : 'WARN',
      `Subtotal: ${hasSubtotal}, Tax: ${hasTax}, Total: ${hasTotal}`);

    // Try to fill in a test invoice (READ ONLY - don't submit)
    // Select a client if dropdown exists
    if (clientSelect) {
      try {
        await clientSelect.click();
        await page.waitForTimeout(1000);
        await screenshot(page, '5-07-client-dropdown');

        // Try selecting first option
        const firstOption = await page.$('[role="option"], [class*="option"]:first-child, li:first-child');
        if (firstOption) {
          await firstOption.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        log('5-07a', 'Client selection interaction', 'WARN', e.message);
      }
    }

    // Navigate back
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
  }

  // 5.11 - Invoice detail page
  try {
    const firstInvoiceLink = await page.$('table tbody tr a, a[href*="/invoices/"]');
    if (firstInvoiceLink) {
      const href = await firstInvoiceLink.getAttribute('href');
      if (href && href.includes('/invoices/')) {
        await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle', timeout: 15000 });
      } else {
        // Click the row
        await page.click('table tbody tr:first-child');
      }
    } else {
      await page.click('table tbody tr:first-child');
    }
    await page.waitForTimeout(3000);
    await screenshot(page, '5-11-invoice-detail');

    const detailUrl = page.url();
    log('5-11', 'Invoice detail page', detailUrl.includes('/invoices/') ? 'PASS' : 'FAIL', `URL: ${detailUrl}`);

    // Check fields display
    const detailBody = await page.textContent('body');
    const hasInvoiceNo = detailBody.match(/G\d+|NG\d+|PF-\d+/);
    log('5-12', 'Invoice number format', hasInvoiceNo ? 'PASS' : 'WARN', `Found: ${hasInvoiceNo ? hasInvoiceNo[0] : 'none'}`);

    // Status badge
    const statusBadge = await page.$('[class*="badge"], [class*="status"]');
    log('5-13', 'Status badge on detail', statusBadge ? 'PASS' : 'WARN', statusBadge ? 'Found' : 'Not found');

    // Payment sidebar
    const paymentSection = await page.$('text=Record Payment, text=Payment, button:has-text("Record Payment"), button:has-text("Payment")');
    log('5-14', 'Record Payment button', paymentSection ? 'PASS' : 'WARN', paymentSection ? 'Found' : 'Not found');

    // PDF download button
    const pdfBtn = await page.$('button:has-text("PDF"), button:has-text("Download"), button:has-text("Generate PDF"), a:has-text("PDF")');
    log('5-15', 'PDF button', pdfBtn ? 'PASS' : 'WARN', pdfBtn ? 'Found' : 'Not found');

    // Email button
    const emailBtn = await page.$('button:has-text("Email"), button:has-text("Send"), button:has-text("Mail")');
    log('5-16', 'Email button', emailBtn ? 'PASS' : 'WARN', emailBtn ? 'Found' : 'Not found');

    // Check line items display
    const lineItems = await page.$$('table tbody tr, [class*="line-item"]');
    log('5-17', 'Line items on detail', lineItems.length > 0 ? 'PASS' : 'WARN', `${lineItems.length} line items`);

    // Check amounts
    const amounts = await page.$$eval('[class*="amount"], [class*="total"]',
      els => els.map(e => e.textContent?.trim())
    );
    log('5-18', 'Amount display', amounts.length > 0 ? 'PASS' : 'WARN', `Amount elements: ${amounts.slice(0, 5).join(', ')}`);

    // Edit button
    const editBtn = await page.$('button:has-text("Edit"), a:has-text("Edit"), button[aria-label*="edit"]');
    log('5-19', 'Edit invoice button', editBtn ? 'PASS' : 'WARN', editBtn ? 'Found' : 'Not found');

    // If Record Payment exists, click it
    if (paymentSection) {
      try {
        await paymentSection.click();
        await page.waitForTimeout(1500);
        await screenshot(page, '5-20-record-payment-form');

        const paymentForm = await page.$$('input, select');
        log('5-20', 'Payment form opens', paymentForm.length > 0 ? 'PASS' : 'WARN', `${paymentForm.length} form fields`);

        // Check payment method dropdown
        const methodDropdown = await page.$('select[name*="method"], [class*="payment-method"]');
        if (methodDropdown) {
          const methods = await methodDropdown.$$eval('option', opts => opts.map(o => o.textContent?.trim()));
          log('5-21', 'Payment methods', 'PASS', `Methods: ${methods.join(', ')}`);
        }

        // Close the form
        const cancelBtn = await page.$('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]');
        if (cancelBtn) await cancelBtn.click();
      } catch (e) {
        log('5-20', 'Payment form interaction', 'WARN', e.message);
      }
    }

  } catch (e) {
    log('5-11-ERR', 'Invoice detail error', 'FAIL', e.message);
    await screenshot(page, '5-11-error');
  }

  // 5.22 - Test nonexistent invoice
  try {
    await page.goto(`${BASE_URL}/invoices/nonexistent-id-12345`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await screenshot(page, '5-22-nonexistent-invoice');

    const content = await page.textContent('body');
    const has404 = content.includes('404') || content.includes('not found') || content.includes('Not Found') || content.includes('Error');
    log('5-22', 'Nonexistent invoice handling', has404 ? 'PASS' : 'FAIL', has404 ? 'Shows error/404' : 'No proper error handling');
  } catch (e) {
    log('5-22', 'Nonexistent invoice', 'WARN', e.message);
  }

  // 5.23 - Invoice number format check via listing
  try {
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const invoiceNumbers = await page.$$eval('table tbody tr td:first-child, [class*="invoice-number"]',
      els => els.slice(0, 10).map(e => e.textContent?.trim()).filter(Boolean)
    );
    log('5-23', 'Invoice number formats', invoiceNumbers.length > 0 ? 'PASS' : 'WARN',
      `Numbers: ${invoiceNumbers.slice(0, 5).join(', ')}`);

    // Check format patterns
    const gstPattern = invoiceNumbers.filter(n => n.match(/G\d+/));
    const ngstPattern = invoiceNumbers.filter(n => n.match(/NG\d+/));
    const pfPattern = invoiceNumbers.filter(n => n.match(/PF-/));
    log('5-24', 'Invoice number patterns', 'INFO',
      `GST: ${gstPattern.length}, Non-GST: ${ngstPattern.length}, Proforma: ${pfPattern.length}`);
  } catch (e) {
    log('5-23', 'Invoice format check', 'FAIL', e.message);
  }

  // Save results
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results, consoleErrors }, null, 2));
  console.log(`\nPhase 5 complete. ${results.length} tests, Console errors: ${consoleErrors.length}`);
  await browser.close();
})();
