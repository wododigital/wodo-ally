# Financial Dashboard -- Full Production Audit & Release Instructions

You are performing a comprehensive audit of our financial dashboard application (Next.js) to prepare it for final production release. This is a systematic, multi-phase process. Do NOT skip steps. Do NOT make assumptions. Read every file, trace every data flow, and verify every calculation before making changes.

**IMPORTANT: Never use em dashes in any content or copy throughout the entire codebase.**

---

## PHASE 1: Full Codebase Inventory

Before changing anything, build a complete map of the project.

1. List every file in the project recursively. Create a checklist of every component, page, utility, hook, context, API route, and config file.

2. Map out the full routing structure. Document every route defined in the app (whether using App Router or Pages Router). For each route, note which page component renders, what layout wraps it, and what data it depends on.

3. Identify every third-party package in package.json (both dependencies and devDependencies). For each one, search the entire codebase to confirm whether it is actually imported or used anywhere. Build a list of unused packages.

4. Identify every internal component, utility function, hook, context provider, and type definition. For each one, search the codebase to confirm it is imported and used somewhere. Build a list of unused internal code.

**Output after Phase 1:** A markdown file called AUDIT_MAP.md in the project root with the full inventory, unused items flagged, and the route map.

---

## PHASE 2: Remove All Dead Code and Unused Dependencies

Using the inventory from Phase 1:

1. Uninstall every unused npm package using `npm uninstall <package>`. Do this one at a time and run `npm run build` after each removal to confirm nothing breaks.

2. Delete every unused component file, utility file, hook, context, and type definition. After each batch of deletions, run `npm run build` to confirm the project still compiles.

3. Remove any unused CSS classes, Tailwind utilities, or style files that are no longer referenced.

4. Remove any unused images, icons, or static assets from the public folder or assets directory.

5. Clean up any unused environment variables from .env files and their references.

6. Check for commented-out code blocks throughout the project. Remove them unless they contain critical TODOs with clear context.

**Validation after Phase 2:** Run `npm run build` and confirm zero errors. Run `npm run lint` and fix all warnings.

---

## PHASE 3: Route and Navigation Audit

Check every single link and navigation path in the application.

1. For every `<Link>` component, `router.push()`, `router.replace()`, and `<a>` tag in the codebase, verify the target route exists and renders the correct page.

2. For every dynamic route (e.g., `/invoices/[id]`, `/projects/[slug]`), verify the dynamic segment is properly handled, the page fetches data based on the parameter, and it renders correctly with sample data. Test with edge cases like non-existent IDs.

3. Check the sidebar navigation, top navigation bar, breadcrumbs, and any tabbed interfaces. Confirm every link points to a valid, working route. Fix or remove any links that point to pages that do not exist or are not yet implemented.

4. Verify all redirect logic. If there are any conditional redirects (auth guards, role-based routing, etc.), trace each path and confirm they land on the correct destination.

5. Check for any 404 fallback or error boundary pages. If they don't exist, create them. Make sure unknown routes display a proper 404 page, not a blank screen or crash.

6. Verify that the browser back/forward buttons work correctly on all pages without causing state issues or blank renders.

**Validation after Phase 3:** Click through every navigation item and confirm zero broken links, zero blank pages, zero console errors.

---

## PHASE 4: Dynamic Data and State Management Audit

This is the most critical phase. Every piece of dynamic content must display correct, live data.

### 4A: Dashboard Cards / Summary Widgets

For every summary card on any dashboard or overview page (e.g., "Total Revenue", "Outstanding Invoices", "Total Expenses", "Active Projects", "Profit Margin"):

1. Trace the data source. Where does the number come from? Is it fetched from an API, calculated from a data store, or derived from local state?

2. Verify the calculation logic is correct. Open the data source and manually verify the formula. For example:
   - "Total Revenue" should sum all paid invoice amounts (not pending, not cancelled)
   - "Outstanding Invoices" should count/sum only invoices with status "pending" or "overdue"
   - "Total Expenses" should sum all expense records for the selected time period
   - "Profit Margin" should be ((Revenue - Expenses) / Revenue) * 100
   - "Active Projects" should count projects with status "active" or "in-progress" (not completed or archived)

3. Verify the card updates dynamically when the underlying data changes. If I add a new invoice, does "Total Revenue" or "Outstanding Invoices" update without a full page reload? If it requires a refresh, implement proper state updates or data revalidation.

4. Check number formatting. Currency values should display with proper currency symbols, thousand separators, and decimal places. Percentages should display with the % symbol. Counts should be whole numbers.

5. Check for loading states. Every card should show a skeleton or spinner while data is being fetched, not "0" or "undefined" or blank.

6. Check for empty states. If there is no data (e.g., no invoices yet), the card should show "0" or an appropriate empty state, not "NaN", "undefined", "null", or crash.

### 4B: Charts and Graphs

For every chart/graph in the application (bar charts, line charts, pie charts, area charts, etc.):

1. Identify the data source feeding each chart. Trace it from the component back to the API or data store.

2. Verify the data transformation is correct. Check that the data is being correctly mapped, aggregated, grouped, and formatted before being passed to the chart library. Common issues to check:
   - Date-based charts: Are dates being parsed and sorted correctly? Are gaps in dates handled?
   - Category-based charts: Are categories being grouped correctly? Are "Other" categories being calculated?
   - Comparison charts: Are the comparison periods correct (month-over-month, year-over-year)?
   - Percentage charts: Do the segments add up to 100%?

3. Verify the charts render with actual data, not placeholder/mock/hardcoded data. Search for any hardcoded arrays or objects being passed to charts and replace them with real data sources.

4. Verify the charts update when filters change. If there is a date range picker, project selector, or category filter, changing it should update the chart data. Test this for every filter on every chart.

5. Check chart responsiveness. Charts should resize properly on different screen sizes without overlapping labels, cut-off legends, or broken layouts.

6. Check chart tooltips. Hovering over data points should show correct, properly formatted values.

7. Check for empty chart states. If no data matches the current filters, show a meaningful empty state message, not a broken or blank chart.

8. Verify axis labels, legends, and titles are correct and not showing raw field names or "undefined".

### 4C: Tables and Data Lists

For every data table (invoices list, expenses list, projects list, transactions, etc.):

1. Verify data loads correctly with pagination (if applicable). First page, last page, and middle pages should all display correct data.

2. Verify sorting works on every sortable column. Click each column header and confirm the data reorders correctly in both ascending and descending directions. Check that numeric sorting is numeric (not alphabetical).

3. Verify filtering works. Every filter dropdown, search input, status filter, and date range filter should correctly narrow the displayed data.

4. Verify row actions work. Edit, delete, view, duplicate, or any other row action buttons should function correctly and update the table afterward.

5. Check that table totals/summaries (if present in footer rows) recalculate when filters change.

6. Verify status badges and labels display correctly with proper colors and text.

### 4D: Forms and Data Entry

For every form in the application (create invoice, add expense, new project, edit client, etc.):

1. Verify form submission actually persists data. After submitting, navigate away and come back to confirm the data saved.

2. Verify form validation works for all fields. Test required fields, numeric fields with non-numeric input, date fields with invalid dates, email fields with invalid emails.

3. Verify edit forms pre-populate with existing data correctly. No fields should be blank when editing an existing record.

4. Verify that after creating or editing a record, all related dashboard cards, charts, and lists update to reflect the change.

5. Check for proper error handling on failed submissions. Network errors and validation errors should display user-friendly messages.

---

## PHASE 5: Calculations Deep Dive

Go through every financial calculation in the codebase and verify correctness.

1. Search the entire codebase for arithmetic operations on financial data: addition, subtraction, multiplication, division, and any use of `.reduce()`, `.map()`, `.filter()` on financial arrays.

2. For each calculation, verify:
   - Floating point handling: Are you using proper methods to avoid floating point errors? (e.g., rounding to 2 decimal places for currency)
   - Division by zero: Is there a check before any division? Does dividing by zero show 0% or N/A, not Infinity or NaN?
   - Null/undefined handling: What happens if a data field is missing? The calculation should not return NaN.
   - Date range consistency: If calculations are time-period based, are the date boundaries inclusive/exclusive as expected?
   - Tax calculations: If applicable, verify tax rate application, rounding, and totals.
   - Discount calculations: If applicable, verify percentage vs. fixed discounts are applied correctly.
   - Currency consistency: If handling multiple currencies, verify conversion logic.

3. Create a test scenario: Manually calculate expected values for a small dataset, then verify the application produces the same results.

4. Specific calculations to verify (check all that exist in the app):
   - Invoice total = sum of line items * quantities, minus discounts, plus tax
   - Project profitability = project revenue minus project expenses
   - Monthly revenue = sum of all paid invoices within the calendar month
   - Year-to-date revenue = sum of all paid invoices from Jan 1 to current date
   - Outstanding balance = total invoiced minus total paid
   - Expense breakdown by category = sum of expenses grouped by category
   - Profit margin = ((revenue - expenses) / revenue) * 100
   - Average invoice value = total revenue / number of invoices
   - Overdue amount = sum of invoices past due date that are unpaid

---

## PHASE 6: Analytics and Reporting Accuracy

1. If there is an analytics/reporting section, verify every metric matches the raw data. Cross-reference report outputs with the actual database/store records.

2. Verify date-based reports generate correct data for:
   - Today
   - This week
   - This month
   - Last month
   - This quarter
   - This year
   - Custom date ranges

3. Verify comparison metrics (e.g., "vs last month") calculate the delta correctly, both as absolute values and percentages. The direction indicators (up/down arrows, green/red colors) should match the actual trend.

4. Verify any export functionality (PDF export, CSV export) produces files with the same data shown on screen.

5. If there are real-time or auto-refreshing elements, verify they actually update and do not show stale data.

---

## PHASE 7: Error Handling and Edge Cases

1. Test every page with empty data (no invoices, no expenses, no projects). Nothing should crash. Every page should have a meaningful empty state.

2. Test every page with a single record. Averages, percentages, and charts should still render correctly.

3. Test with large datasets if possible. Check for performance issues, pagination correctness, and chart rendering with many data points.

4. Verify all API error states are handled gracefully with user-friendly error messages.

5. Check that loading states are shown during data fetches on every page and component.

6. Verify that deleting a record does not leave orphaned references (e.g., deleting a project does not break invoices linked to it).

---

## PHASE 8: Final Cleanup and Production Prep

1. Remove all `console.log`, `console.warn`, `console.error` statements used for debugging. Keep only intentional error logging.

2. Remove any TODO comments that are no longer relevant. For remaining TODOs, add them to a BACKLOG.md file with context.

3. Verify all environment variables are properly configured for production.

4. Run `npm run build` one final time and confirm zero errors, zero warnings.

5. Run the linter (`npm run lint`) and fix all remaining issues.

6. Test the production build locally (`npm run start` after build) and do a full click-through of every page and feature.

7. Check the browser console on every page in the production build. There should be zero errors and zero warnings.

8. Verify favicon, page titles, and meta tags are set correctly for all pages.

9. Check that all images and assets load correctly (no broken image icons).

10. Verify responsive design works on mobile, tablet, and desktop viewports for all pages.


---

## Summary Checklist

- [ ] Full codebase inventory completed
- [ ] All unused packages removed
- [ ] All unused components, files, and code removed
- [ ] All routes verified and working
- [ ] All navigation links verified
- [ ] 404 and error pages in place
- [ ] All dashboard cards showing correct, dynamic data
- [ ] All charts rendering with real data and responding to filters
- [ ] All tables sorting, filtering, and paginating correctly
- [ ] All forms submitting and persisting data correctly
- [ ] All financial calculations verified for correctness
- [ ] Floating point, division by zero, and null cases handled
- [ ] Analytics and reporting data verified against raw data
- [ ] Empty states handled on all pages
- [ ] Loading states shown during all data fetches
- [ ] All console.log statements removed
- [ ] Linter passing with zero warnings
- [ ] Production build compiles with zero errors
- [ ] Full click-through tested on production build
- [ ] Browser console clean on all pages
