# Task: Extract Design System from dashboard-v2 and Apply Site-wide

## Step 1: Audit dashboard-v2

Scan every component, style, gradient, layout, and pattern used in the `dashboard-v2` page. This is the single source of truth for the entire app's design going forward.

## Step 2: Create DESIGN_SYSTEM.md at project root

Extract and document everything you find in dashboard-v2 into a living reference file. Cover:

- Full color palette (every hex, rgba, opacity value found)
- All gradient definitions (direction, stops, opacities)
- Typography scale (sizes, weights, families, spacing, transforms)
- Spacing patterns (padding, margins, gaps)
- Component styles (cards, charts, stats, buttons, labels, captions)
- Stroke and border patterns (radius, width, color, opacity)
- Layout patterns (grid, flex, container widths, responsive behavior)
- Motion/transitions if any
- Writing rules: never use em dashes in any content or copy

Do not invent values. Only document what is actually implemented in dashboard-v2.

## Step 3: Create theme tokens

Based on what you extracted, update the project's theme configuration:

- Add all extracted colors to tailwind.config (or equivalent) as named tokens
- Set CSS custom properties in globals.css for every theme color and gradient
- Remove any old/conflicting color or style definitions that contradict dashboard-v2

## Step 4: Apply site-wide

Go through every file in the project. For each component and page:

- Replace all hardcoded color values with the new theme tokens
- Match typography, spacing, borders, shadows, and gradients to dashboard-v2 patterns
- Ensure charts, cards, labels, and interactive elements all use the same visual language
- Update hover/focus/active states to use the accent palette

## Step 5: Clean up

- Delete any components, styles, utility classes, or files that are no longer referenced after the migration
- Remove unused CSS rules and Tailwind classes
- Remove any old theme or color configurations that were replaced
- If dashboard-v2 was a separate route/page for testing, consolidate it into the main dashboard route

## Step 6: Verify

- Run the build and fix any errors
- Run the linter and fix warnings
- Confirm no component still uses old hardcoded colors outside the theme tokens
- Run grep for any stray hex values that should have been replaced with tokens

## Rules

- dashboard-v2 is the single source of truth. Do not guess or assume any values.
- Every design decision must trace back to an actual implementation in dashboard-v2.
- The DESIGN_SYSTEM.md file must stay updated as the reference for all future work.
