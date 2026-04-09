# WODO Ally Design System

Source of truth: `src/app/dashboard-v2/` and `src/components/dashboard-v2/`

---

## Color Palette

### Background
- Page background image: `/white-bg.webp`, `backgroundSize: cover`, `backgroundAttachment: fixed`
- Page overlay: `rgba(255, 255, 255, 0.55)`
- Nav bar (scrolled): `rgba(255, 255, 255, 0.65)` + `backdropFilter: blur(24px)`

### Light Cards (frosted glass)
- Background: `rgba(255, 255, 255, 0.45)`
- Border: `rgba(255, 255, 255, 0.75)`
- Shadow: `0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)`
- Backdrop blur: `blur(24px)`
- Border radius: `16px` (`rounded-2xl`)

### Accordion / Compact Panels (light)
- Background: `rgba(255, 255, 255, 0.84)` + `backdropFilter: blur(14px)`
- Border: `rgba(255, 255, 255, 0.9)`
- Shadow: `0 1px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`

### Nav Pill
- Background: `#1e2030`
- Active tab bg: `#fd7e14`
- Active tab text: `#ffffff`
- Inactive tab text: `rgba(255,255,255,0.4)` (i.e. `text-gray-400` outside dark context)

### Dark Section
- Section background: `#1d1f2e`
- Inner card background: `rgba(255, 255, 255, 0.06)`
- Inner card border: `rgba(255, 255, 255, 0.08)`
- Inner card border-radius: `16px`
- Divider: `rgba(255, 255, 255, 0.05)` / `rgba(255, 255, 255, 0.06)`

### Accent
- Primary: `#fd7e14`
- Hover: `#e8720f`
- Light (15%): `rgba(253, 126, 20, 0.15)`
- Muted (10%): `rgba(253, 126, 20, 0.10)`
- Very faint (16 hex = ~10%): `${accentColor}16` pattern used for icon backgrounds

### Text on Light Background
- Primary: `#111827` (gray-900)
- Secondary: `#6b7280` (gray-500)
- Muted / label: `#9ca3af` (gray-400)
- Dark label (uppercase tracker): `#4b5563` (gray-600)

### Text in Dark Section
- Primary: `rgba(255, 255, 255, 0.92)`
- Secondary: `rgba(255, 255, 255, 0.60)`
- Muted: `rgba(255, 255, 255, 0.38)`
- Label (uppercase tracker): `rgba(255, 255, 255, 0.30)`

### Status Colors
- Success / up-trend: `#16a34a`
- Warning / neutral: `#f59e0b`
- Error / down-trend: `#ef4444`
- Info / blue accent: `#3b82f6`
- Neutral: `#9ca3af`

### Attention Item Left-Bar Colors (NeedsAttentionV2)
- Overdue: `#ef4444`
- Pending follow-up: `#f59e0b`
- Action needed: `rgba(255,255,255,0.15)` (dark variant) / `#9ca3af` (light variant)

### Surface Utilities (for hover/subtle backgrounds on light)
- Subtle bg: `rgba(0, 0, 0, 0.03)`
- Subtle bg hover: `rgba(0, 0, 0, 0.05)`
- Subtle border: `rgba(0, 0, 0, 0.05)`

---

## Typography

### Families
- All text: `var(--font-manrope)`, `system-ui`, `sans-serif`
- Numbers/tabular: same family with `tabular-nums` class

### Scale
| Role | Size | Weight | Notes |
|---|---|---|---|
| Page headline | `2.5rem` | `300` (font-light) | Hero section (`text-[2.5rem] font-light`) |
| KPI value | `2.4rem` | `300` (font-light) | `tabular-nums text-gray-900` |
| Page title (nav row 2) | `1.75rem` | `700` (font-bold) | `text-gray-900` |
| Card heading | `0.6875rem` (11px) | `600` | `uppercase tracking-widest text-gray-400` |
| Section label (dark) | `0.6875rem` (11px) | `700` | `uppercase tracking-widest rgba(255,255,255,0.3)` |
| Body / row text | `0.875rem` (14px) | `400-600` | `text-gray-600 / text-gray-900` |
| Caption / meta | `0.75rem` (12px) | `400-500` | `text-gray-400` |
| Nav tab | `0.75rem` (12px) | `600` | `font-semibold` in nav pill |
| Badge / tag | `0.625rem` (10px) | `700` | `uppercase tracking-widest` |

### Special Patterns
- Narrative text: `text-sm text-gray-500 leading-relaxed`
- Emphasis in narrative: `font-medium text-gray-800` / `font-medium text-green-600`
- KPI trend label: `text-xs font-semibold` in trend color

---

## Spacing

### Container
- Max width: `max-w-[1440px]`
- Horizontal padding: `px-10`
- Top padding: `pt-6`
- Bottom padding: `pb-16`

### Nav
- Nav bar height: `h-16`
- Nav horizontal padding: `px-10`
- Page title row: `px-10 pb-7 pt-2`

### Sections / Gaps
- Between major sections: `space-y-10`
- KPI card grid gap: `gap-7`
- Dark section padding: `p-10`
- Inner card padding: `p-6`
- KPI card padding: `p-7`, `minHeight: 172px`
- Card header margin bottom: `mb-5`
- KPI value to trend separator: `mt-4 pt-4 border-top`

### Component Internal
- Accordion panel item: `px-4 py-3`
- Attention list row: `px-6 py-5`
- Payments list row: `px-6 py-5`
- Dark tab bar: `p-1.5 rounded-full`, tabs: `px-4 py-2`

---

## Component Styles

### KPI Card (KpiCardV2)
```
background: rgba(255,255,255,0.45)
border: 1px solid rgba(255,255,255,0.75)
box-shadow: 0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)
backdropFilter: blur(24px)
border-radius: 16px (rounded-2xl)
padding: p-7
minHeight: 172px
```
- Title: `text-[11px] uppercase tracking-widest font-semibold text-gray-400`
- Value: `text-[2.4rem] font-light tabular-nums text-gray-900 leading-none`
- Icon container: `p-2 rounded-xl` with `${accentColor}16` background
- Trend row: `mt-4 pt-4 border-t border-black/[0.05] text-xs font-semibold`

### Dark Section (DarkSectionTabs)
```
background: #1d1f2e
border-radius: 24px (rounded-[24px])
padding: p-10
```

### Inner Card (inside Dark Section)
```
background: rgba(255,255,255,0.06)
border: 1px solid rgba(255,255,255,0.08)
border-radius: 16px
```

### Attention List Item (NeedsAttentionV2)
- Left accent bar: `w-[3px] self-stretch` with status color
- Dot: `w-2 h-2 rounded-full` with status color
- Row padding: `px-6 py-5`
- Divider: `1px solid rgba(255,255,255,0.05)` (dark) / `rgba(0,0,0,0.05)` (light)

### Progress Bars (FinancialTargetsV2)
- Track: `h-1.5 rounded-full` dark `rgba(255,255,255,0.08)` / light `#e5e7eb`
- Fill: `h-full rounded-full` in status color

### Buttons (Primary)
```
background: #fd7e14
color: #ffffff
border-radius: rounded-full
padding: px-5 py-2.5
font-size: text-sm font-semibold
```

### Buttons (Ghost / Secondary)
```
background: rgba(255,255,255,0.65)
border: 1px solid rgba(0,0,0,0.1)
color: #374151
border-radius: rounded-full
```

### Nav Tab (active)
```
background: #fd7e14
color: #ffffff
border-radius: rounded-full
padding: px-3.5 py-1
font-size: 12px font-semibold
```

### Quick Actions Dropdown
```
background: rgba(255,255,255,0.92)
backdropFilter: blur(20px)
border: 1px solid rgba(255,255,255,0.9)
box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)
border-radius: 16px (rounded-2xl)
```

### Accordion Panel (AccordionPanels in Hero)
```
background: rgba(255,255,255,0.84)
backdropFilter: blur(14px)
border: 1px solid rgba(255,255,255,0.9)
border-radius: 10px
box-shadow: 0 1px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)
```

### Circular Progress (Annual Progress in TargetsTab)
```
conic-gradient(#fd7e14 0% {pct}%, rgba(255,255,255,0.08) {pct}% 100%)
Inner circle: #1d1f2e background, text: #fd7e14
```

---

## Gradients

### Arc Chart (HeroProjectsGrowthChart)
All linear gradients, x1=0 y1=0 x2=1 y2=0 (horizontal):
- Arc 0 (outermost): `#FFF0E0` at 40% -> `#FFA230` at 70%
- Arc 1 (middle): `#FFF5EB` at 50% -> `#FFA230` at 35%
- Arc 2 (innermost): `#F5F0EB` at 35% -> `#FFA230` at 20%

### Accent Button
- `linear-gradient(135deg, #fd7e14, #e8720f)`

### KPI Card Icon tints
- Pattern: `${accentColor}16` for background (hex alpha 22% ~ rgba(color, 0.14))

---

## Layout Patterns

### Page Layout
```
<div style="background-image: url('/white-bg.webp'); background-size: cover; background-attachment: fixed">
  <div style="background: rgba(255,255,255,0.55)">
    <TopNavV2 />                                        // sticky, h-16
    <main class="max-w-[1440px] mx-auto px-10 pt-6 pb-16">
      {children}
    </main>
  </div>
</div>
```

### Dashboard Grid
- KPI row: `grid grid-cols-2 lg:grid-cols-4 gap-7`
- Hero: `grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14`

### Dark Section Content
- Attention/Payments/Targets: `grid grid-cols-1 lg:grid-cols-3 gap-7` (main 2 cols + summary 1 col)

---

## Border and Stroke Patterns

### Light Context
- Card border: `1px solid rgba(255,255,255,0.75)`
- Subtle divider: `1px solid rgba(0,0,0,0.05)`
- Subtle border: `1px solid rgba(0,0,0,0.08)`
- Input border: `1px solid rgba(0,0,0,0.10)`
- Input focus ring: `3px rgba(253,126,20,0.10)`

### Dark Section
- Inner card border: `1px solid rgba(255,255,255,0.08)`
- Row divider: `1px solid rgba(255,255,255,0.05)`
- Stat separator: `1px solid rgba(255,255,255,0.06)`

### Border Radius Reference
- Cards: `16px` (rounded-2xl)
- Dark section outer: `24px` (rounded-[24px])
- Icon containers: `12px` (rounded-xl)
- Buttons/pills: `9999px` (rounded-full)
- Small badges: `9999px` (rounded-full)
- Inputs: `10px` (rounded-[10px])

---

## Motion / Transitions

- Nav bar background: `transition-all duration-300`
- Nav tab active: `transition-all duration-150`
- Accordion open/close: `max-height 0.35s cubic-bezier(0.4,0,0.2,1)`, `opacity 0.25s ease`
- Caret rotation: `transition-transform duration-200`
- Auto-cycle panels: `setInterval 3000ms`, paused on hover/focus
- Chart arcs: `isAnimationActive={false}` (no animation)
- General hover: `transition-colors` / `transition-opacity` / `transition-all duration-150`
- Page entrance: `animate-fade-in` (0.3s ease-out opacity 0->1)

---

## Writing Rules

- Never use em dashes in any text, copy, or code comments. Use hyphens (-) instead.
- Currency: always prefix with `Rs.` for INR values (no rupee symbol)
- Labels: uppercase + tracking-widest for section labels
- Numbers: `font-light` + `tabular-nums` for large financial figures
