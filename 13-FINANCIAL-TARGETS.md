# 13 - Financial Targets & Goal Tracking

## Target Types

1. **Revenue Target**: Total revenue to achieve in a period
2. **MRR Target**: Monthly recurring revenue goal
3. **New Clients Target**: Number of new client signups
4. **Expense Reduction**: Keep expenses below a threshold
5. **Custom**: Any user-defined metric with a target value

## Target Form (`/analytics/targets`)

```
Title: [text] e.g., "Q4 Revenue Target"
Target Type: [dropdown]
Period: [Monthly / Quarterly / Annual]
Financial Year: [dropdown, default current FY]
Month/Quarter: [conditional, based on period]
Target Amount: [number]
Service Type Filter: [optional dropdown - All / SEO / Web Dev / Branding / etc.]
Notes: [text]
```

## Target Tracking

Current amount is auto-calculated based on target_type:

- Revenue: Sum of invoice_payments.amount_received_inr in the target period
- MRR: Sum of active retainer amounts at period end
- New Clients: Count of clients created in the period
- Expense Reduction: Total expenses in the period (target is a ceiling)
- Custom: Manually updated

## Targets Dashboard

### Visual Progress
- Each target shown as a glass card with:
  - Title and period
  - Circular progress indicator (donut) with percentage
  - Current / Target amounts
  - Days remaining in period
  - Trend indicator (on track / behind / ahead)

### On Track Calculation
```
expected_progress = (days_elapsed / total_days_in_period) * target_amount
actual_progress = current_amount
status = actual >= expected ? "on_track" : "behind"
```

If current_amount >= target_amount: "achieved" (green checkmark)
If behind by more than 20%: "at_risk" (red)

### Goal Grid Layout
- 2-3 columns on desktop, 1 on mobile
- Sort by: period (current first), then status (at_risk first)
- FY selector to view historical targets

### Dashboard Integration
The main dashboard shows a compact "Goals" section:
- Top 3 active targets with mini progress bars
- "View All" link to targets page
