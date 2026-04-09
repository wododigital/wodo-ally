import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://wodo-ally-production.up.railway.app';
const SCREENSHOT_DIR = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-screenshots/functional';
const RESULTS_FILE = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/audit-results/final-raw.json';

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

  // ========= INVOICE DETAIL WITH UNPAID INVOICE =========
  console.log('\n=== INVOICE DETAIL - FIND UNPAID INVOICE ===');

  // Navigate to an invoice that has balance due (to test Record Payment)
  // Try G00111 (Paid) vs. others
  const invoiceIds = [
    'bbbbbbbb-0000-0000-0000-000000000002', // DRAFT / Sent
    'bbbbbbbb-0000-0000-0000-000000000007',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000003',
    'a2fe8d0c-b67e-43cb-9dc4-5ef758b2bda6',
    'bbbbbbbb-0000-0000-0000-000000000006',
    'bbbbbbbb-0000-0000-0000-000000000008',
    'bbbbbbbb-0000-0000-0000-000000000009',
    'bbbbbbbb-0000-0000-0000-000000000005',
  ];

  for (const invId of invoiceIds) {
    try {
      await page.goto(`${BASE_URL}/invoices/${invId}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);

      const h1 = await page.$eval('h1', el => el.textContent?.trim()).catch(() => 'Loading');
      if (h1 === 'Loading' || h1 === 'Invoices') {
        // Still loading or wrong page
        await page.waitForTimeout(3000);
      }

      const rpBtn = await page.$('button:has-text("Record Payment")');
      const statusBtn = await page.$$eval('button', btns => {
        return btns.map(b => b.textContent?.trim()).filter(t => t && ['Draft', 'Sent', 'Paid', 'Overdue', 'Partially Paid', 'Cancelled'].some(s => t.includes(s)));
      });

      const bodyText = await page.textContent('body');
      const balanceMatch = bodyText.match(/Balance\s*Due[\s\S]*?([\d,.]+)/i);
      const invoiceRef = await page.$eval('h1', el => el.textContent?.trim()).catch(() => invId);

      log(`FIN-INV-${invId.slice(-4)}`, `Invoice ${invoiceRef}`, 'INFO',
        `Status: ${statusBtn.join(',')}, Record Payment: ${rpBtn ? 'YES' : 'NO'}, Balance: ${balanceMatch ? balanceMatch[1] : 'N/A'}`);

      await screenshot(page, `FIN-inv-${invId.slice(-4)}`);

      if (rpBtn) {
        console.log(`\nFound unpaid invoice: ${invId}`);
        await rpBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, `FIN-payment-modal-${invId.slice(-4)}`);

        // Full payment form test
        const modalFields = await page.$$eval('input, select, textarea',
          els => els.map(e => ({
            tag: e.tagName, type: e.getAttribute('type'),
            name: e.getAttribute('name'), value: e.getAttribute('value'),
            placeholder: e.getAttribute('placeholder')
          }))
        );
        log('FIN-PAY-FIELDS', 'Payment modal fields', 'PASS', JSON.stringify(modalFields));

        // Check min validation on amount
        const amountField = await page.$('input[type="number"][min="0.01"]');
        log('FIN-PAY-MIN', 'Amount field min validation', amountField ? 'PASS' : 'FAIL',
          amountField ? 'min=0.01 enforced by HTML' : 'NO minimum validation - SECURITY ISSUE');

        // Check amount validation: try negative
        if (amountField) {
          // HTML min="0.01" should prevent browser form submission of negative values
          // But server-side validation should also exist
          const currentVal = await amountField.inputValue();
          log('FIN-PAY-DEFAULT', 'Default amount', 'INFO', `Pre-filled: ${currentVal}`);
        }

        // Check methods
        const methodOpts = await page.$$eval('select option', os => os.map(o => ({ value: o.value, text: o.textContent?.trim() })));
        log('FIN-PAY-METHODS', 'Payment methods', 'PASS', JSON.stringify(methodOpts));

        // Close
        await page.$eval('button:has-text("Cancel")', b => b.click()).catch(() => {});
        await page.waitForTimeout(500);
        break;
      }
    } catch (e) {
      log(`FIN-INV-${invId.slice(-4)}`, `Invoice ${invId}`, 'FAIL', e.message);
    }
  }

  // ========= INVOICE STATUS FILTERS =========
  console.log('\n=== INVOICE STATUS FILTERS ===');

  await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Status filter dropdown
  const statusFilterBtn = await page.$('button:has-text("All Status")');
  if (statusFilterBtn) {
    await statusFilterBtn.click();
    await page.waitForTimeout(500);
    await screenshot(page, 'FIN-status-dropdown');

    const statusOptions = await page.$$eval('button', btns =>
      btns.map(b => b.textContent?.trim()).filter(t => ['Draft', 'Sent', 'Paid', 'Overdue', 'Proforma', 'Archived'].some(s => t === s))
    );
    log('FIN-STATUS-OPTS', 'Status filter options', statusOptions.length > 0 ? 'PASS' : 'WARN',
      `Options: ${statusOptions.join(', ')}`);

    // Click each status
    for (const status of statusOptions) {
      try {
        await page.$eval(`button:has-text("${status}")`, b => b.click());
        await page.waitForTimeout(1000);
        const rows = await page.$$('table tbody tr');
        log(`FIN-STATUS-${status}`, `Filter: ${status}`, 'PASS', `${rows.length} results`);
        await screenshot(page, `FIN-status-${status.toLowerCase()}`);

        // Re-open dropdown
        const resetBtn = await page.$(`button:has-text("${status}")`);
        if (resetBtn) await resetBtn.click();
        await page.waitForTimeout(300);
      } catch (e) {}
    }

    // Reset to All Status
    const allBtn = await page.$('button:has-text("All Status")');
    if (allBtn) {
      await allBtn.click();
      await page.waitForTimeout(300);
      const allOpt = await page.$('button:has-text("All Status")');
      if (allOpt) await allOpt.click();
    }
    await page.waitForTimeout(500);
  }

  // Type filter dropdown
  const typeFilterBtn = await page.$('button:has-text("All Types")');
  if (typeFilterBtn) {
    await typeFilterBtn.click();
    await page.waitForTimeout(500);
    await screenshot(page, 'FIN-type-dropdown');
    log('FIN-TYPE-FILTER', 'Type filter dropdown', 'PASS', 'Opened');

    // Click away
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // Sort columns
  for (const col of ['Invoice', 'Client', 'Type', 'Date', 'Amount', 'Status']) {
    try {
      const colBtn = await page.$(`button:has-text("${col}")`);
      if (colBtn) {
        await colBtn.click();
        await page.waitForTimeout(500);
        log(`FIN-SORT-${col}`, `Sort by ${col}`, 'PASS', 'Clicked');
      }
    } catch (e) {}
  }

  // ========= INVOICE NEW - CLIENT SELECTION =========
  console.log('\n=== NEW INVOICE - DETAILED ===');

  const newInvBtn = await page.$('button:has-text("New Invoice")');
  if (newInvBtn) {
    await newInvBtn.click();
    await page.waitForTimeout(2000);
    await screenshot(page, 'FIN-new-invoice-modal');

    // Try each invoice type button
    for (const type of ['GST Invoice', 'International', 'Non-GST', 'Pro Forma']) {
      try {
        const typeBtn = await page.$(`button:has-text("${type}")`);
        if (typeBtn) {
          await typeBtn.click();
          await page.waitForTimeout(500);
          await screenshot(page, `FIN-new-type-${type.replace(/\s+/g, '-').toLowerCase()}`);
          log(`FIN-NEW-TYPE-${type}`, `Invoice type: ${type}`, 'PASS', 'Selected');
        }
      } catch (e) {}
    }

    // Check client dropdown
    const clientSelect = await page.$('select');
    if (clientSelect) {
      const clientOptions = await clientSelect.$$eval('option', os => os.map(o => ({ value: o.value, text: o.textContent?.trim() })));
      log('FIN-NEW-CLIENTS', 'Client dropdown options', clientOptions.length > 1 ? 'PASS' : 'WARN',
        `${clientOptions.length} options: ${clientOptions.map(c => c.text).join(', ')}`);

      // Select first real client
      if (clientOptions.length > 1) {
        await clientSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        await screenshot(page, 'FIN-new-client-selected');
      }
    }

    // Test line items
    const descInput = await page.$('input[placeholder="Description"]');
    const qtyInput = await page.$('input[placeholder="1"]');
    const amountInput = await page.$('input[placeholder="Amount"]');

    if (descInput && qtyInput && amountInput) {
      await descInput.fill('Test Service - Website Development');
      await qtyInput.fill('1');
      await amountInput.fill('50000');
      await page.waitForTimeout(500);
      await screenshot(page, 'FIN-new-line-item');
      log('FIN-NEW-LINE', 'Line item fields', 'PASS', 'Filled description, qty, amount');

      // Check tax calculation
      const bodyText = await page.textContent('body');
      const subtotalMatch = bodyText.match(/Subtotal[\s:]*.*?([\d,.]+)/);
      const taxMatch = bodyText.match(/GST[\s:]*.*?([\d,.]+)/);
      const totalMatch = bodyText.match(/Total[\s:]*.*?([\d,.]+)/);
      log('FIN-NEW-CALC', 'Tax auto-calculation', 'INFO',
        `Subtotal: ${subtotalMatch ? subtotalMatch[1] : 'N/A'}, Tax: ${taxMatch ? taxMatch[1] : 'N/A'}, Total: ${totalMatch ? totalMatch[1] : 'N/A'}`);

      // Add another line item
      const addLineBtn = await page.$('button:has-text("Add item")');
      if (addLineBtn) {
        await addLineBtn.click();
        await page.waitForTimeout(500);
        const lineFields = await page.$$('input[placeholder="Description"]');
        log('FIN-NEW-ADDLINE', 'Add line item', lineFields.length > 1 ? 'PASS' : 'FAIL', `${lineFields.length} line item rows`);
      }

      // Test with very long description
      if (descInput) {
        await descInput.fill('A'.repeat(500));
        await page.waitForTimeout(300);
        log('FIN-NEW-LONGDESC', 'Long description', 'INFO', 'Entered 500-char description');
      }

      // Test zero amount
      await amountInput.fill('0');
      await page.waitForTimeout(300);
      log('FIN-NEW-ZEROAMT', 'Zero amount in line item', 'INFO', 'Set amount to 0');
    }

    // Cancel
    const cancelBtn = await page.$('button:has-text("Cancel")');
    if (cancelBtn) await cancelBtn.click();
    await page.waitForTimeout(500);
  }

  // ========= EXPENSE UPLOAD FLOW =========
  console.log('\n=== EXPENSE UPLOAD - FULL FLOW ===');

  await page.goto(`${BASE_URL}/expenses/upload`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);

  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    const sampleFile = '/Users/shyam/Desktop/Claude Dev Projects/WODO Ally/idfc-statement.xlsx';
    if (fs.existsSync(sampleFile)) {
      await fileInput.setInputFiles(sampleFile);
      await page.waitForTimeout(5000);
      await screenshot(page, 'FIN-expense-uploaded');

      // Check parsed transactions
      const txnTable = await page.$$('table tbody tr');
      log('FIN-EXP-PARSED', 'Parsed transactions', txnTable.length > 0 ? 'PASS' : 'WARN', `${txnTable.length} rows`);

      // Get some transaction data
      const txnData = await page.$$eval('table tbody tr',
        rows => rows.slice(0, 3).map(r => r.textContent?.trim()?.substring(0, 100))
      );
      log('FIN-EXP-DATA', 'Transaction data', 'INFO', txnData.join(' | '));

      // Check for Confirm Import button
      const confirmBtn = await page.$('button:has-text("Confirm Import")');
      log('FIN-EXP-CONFIRM', 'Confirm Import button', confirmBtn ? 'PASS' : 'WARN', confirmBtn ? 'Found' : 'Not found');

      // Don't click - would import test data

      // Check for Cancel button
      const cancelExpBtn = await page.$('button:has-text("Cancel")');
      log('FIN-EXP-CANCEL', 'Cancel button', cancelExpBtn ? 'PASS' : 'WARN', cancelExpBtn ? 'Found' : 'Not found');
    }
  }

  // ========= DOUBLE-CLICK PREVENTION =========
  console.log('\n=== DOUBLE-CLICK PREVENTION ===');

  await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Open new invoice and try double-click submit
  const newInvBtn2 = await page.$('button:has-text("New Invoice")');
  if (newInvBtn2) {
    await newInvBtn2.click();
    await page.waitForTimeout(2000);

    const saveBtn = await page.$('button:has-text("Save")');
    if (saveBtn) {
      // Double click
      await saveBtn.dblclick();
      await page.waitForTimeout(1000);
      await screenshot(page, 'FIN-double-click-save');

      // Check if disabled state exists
      const isDisabled = await saveBtn.isDisabled().catch(() => false);
      log('FIN-DBL-CLICK', 'Double-click save prevention', isDisabled ? 'PASS' : 'WARN',
        isDisabled ? 'Button disabled after click' : 'Button still active - potential duplicate submission risk');
    }

    const cancelBtn = await page.$('button:has-text("Cancel")');
    if (cancelBtn) await cancelBtn.click();
    await page.waitForTimeout(500);
  }

  // ========= CONSOLE ERRORS SUMMARY =========
  console.log(`\n=== CONSOLE ERRORS COLLECTED: ${consoleErrors.length} ===`);
  const uniqueErrors = [...new Set(consoleErrors.map(e => e.message))];
  for (const err of uniqueErrors.slice(0, 20)) {
    console.log(`  [ERROR] ${err.substring(0, 150)}`);
  }

  // Save
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results, consoleErrors }, null, 2));
  console.log(`\nFinal tests complete. ${results.length} tests, Console errors: ${consoleErrors.length}`);
  await browser.close();
})();
