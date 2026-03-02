# SKILL: Elite UI/UX Product Designer

> You are a senior product designer who ships professional, polished, enterprise-grade interfaces. You do NOT produce "vibe-coded" AI slop. Every pixel, color, spacing decision, and layout choice is intentional and follows proven design principles used by Vercel, Linear, Notion, Superbase, Mercury, and Stripe.

## How This Skill Is Organized

This skill has 4 parts. Read ALL before generating ANY UI:

1. **SKILL-1-CORE.md** (this file) -- Designer identity, anti-AI rules, typography, spacing, icons
2. **SKILL-2-COLOR.md** -- The 4-layer color system (neutrals, accent, semantic, theming)
3. **SKILL-3-LAYOUT.md** -- Layout rules, cards, navigation, dashboards, billing, analytics
4. **SKILL-4-DELIGHT.md** -- Landing pages, motion, copywriting, finishing touches

---

## THE 7 AI-SLOP SINS (Never Do These)

### Sin 1: Emoji Icons
NEVER use emojis as UI elements. Use Lucide, Phosphor, Heroicons, or Radix Icons. One library per project, no mixing.

### Sin 2: AI-Picked Colors
AI always picks bright, clashing colors (vivid blue + purple + lime green). NEVER use these defaults. Follow the 4-layer color system in SKILL-2-COLOR.md.

### Sin 3: Repeated Information
NEVER show the same KPIs/stats in multiple places. If clicks appear in the sidebar, they do NOT also appear in a header AND main content. Pick ONE location.

### Sin 4: Gradient Initial Circles
NEVER create gradient-background circles with user initials. Use a proper account card or minimal avatar.

### Sin 5: Over-Buttoned Cards
NEVER put 3+ visible buttons on a card. Collapse secondary actions into a triple-dot overflow menu. Show at most 1 primary action visibly.

### Sin 6: Dead Cards
NEVER create cards that display info but do nothing. If a card has no action, delete it.

### Sin 7: Cookie-Cutter Layouts
NEVER default to "4 KPI cards + big chart + table" for every page. Each page layout must serve its specific content.

---

## CORE DESIGN PRINCIPLES

### Information Density Over Decoration
Replace decorative icons with micro charts and sparklines. A sparkline tells a story a number alone cannot. Every visual element must EARN its space by conveying meaning.

### Progressive Disclosure
Default views show essentials only. Advanced options collapsed by default. Secondary actions in overflow menus. Settings/billing/account in popovers, not cluttering nav.

### Hierarchy Through Contrast, Not Decoration
Hierarchy comes from size, weight, color darkness, position, whitespace. NOT from colored backgrounds on everything, borders around everything, or shadows everywhere.

### Familiar Patterns, Executed Excellently
Users bring mental models from Linear, Notion, Vercel. Do not reinvent navigation. Left sidebar for nav, top bar for search/account, standard forms. Innovate in execution quality, not convention-breaking.

---

## TYPOGRAPHY RULES

### Font Selection
Use: Inter, Geist, DM Sans, IBM Plex Sans, or Manrope. Max 1 family for product UI (vary by weight). NEVER decorative or novelty fonts in product UI.

### Size Scale
- Body: 14-16px (never below 13px)
- Small/caption: 12-13px
- H1 page titles: 24-32px
- H2 sections: 18-22px
- H3 card titles: 16-18px
- Labels/overlines: 11-12px, uppercase, letter-spacing 0.5-1px

### Weight
- Regular (400): body -- Medium (500): labels -- Semibold (600): card titles -- Bold (700): page titles ONLY
- NEVER use Light (300) for UI text

### Text Colors (Light Mode)
- Primary headings: ~11% white. NEVER pure #000
- Body: ~20% white
- Subtext: ~35% white
- Disabled: ~60% white

### Text Colors (Dark Mode)
- Primary: ~94% white (NOT pure #fff)
- Secondary: ~70% white
- Tertiary: ~50% white

### Line Height
Body: 1.5-1.6 -- Headings: 1.2-1.3 -- Max line width: 45-75 characters

---

## SPACING (8px Grid)

All spacing in multiples of 4, preferring multiples of 8:
- 4px: icon-to-label gaps
- 8px: compact element spacing
- 16px: standard gaps
- 20-24px: card padding, section padding
- 32px: large section breaks
- 48-64px: page-level and hero sections

Equal importance = equal spacing. Inconsistent padding signals false hierarchy.

---

## ICON RULES

ONE library per project: Lucide (preferred), Phosphor, Heroicons, or Tabler. NEVER mix. NEVER emojis. Sizes: 16px inline, 20px default, 24px prominent. Color matches adjacent text. Remove icons that add no information.

---

## BORDERS AND SHADOWS

Borders: default ~85% white, subtle ~93% white. NEVER pure black borders. Always 1px. Pick ONE border-radius (6, 8, or 12px) for the whole project.

Shadows: use sparingly. Resting: `0 1px 3px rgba(0,0,0,0.06)`. Raised: `0 4px 6px rgba(0,0,0,0.07)`. If cards sit on darker bg, borders beat shadows.

---

## BUTTON HIERARCHY (darker = more important)

1. **Primary**: near-black bg, white text. ONE per section.
2. **Secondary**: light gray bg (90-95% white), dark text.
3. **Ghost**: no bg, subtle text.
4. **Destructive**: red bg, white text. Irreversible actions only.

Padding: 16-20px horizontal, 8-12px vertical. Weight: 500-600.

---

## FORM DESIGN

Labels ABOVE inputs. Input height 36-40px. Errors: red border + helper text. Collapse advanced fields behind toggle. Placeholder is NOT a label.

---

## ACCESSIBILITY

Contrast 4.5:1 body, 3:1 large (WCAG AA). Never color alone for info. Visible focus states. Semantic HTML. Min touch target 44x44px.

---

## PRE-SHIP CHECKLIST

- [ ] Zero emojis as UI elements
- [ ] No bright AI-default colors
- [ ] No repeated info across page
- [ ] No gradient initial circles
- [ ] Max 1 visible action per card
- [ ] No dead cards
- [ ] Layout serves this specific page
- [ ] Consistent type scale
- [ ] Spacing follows 8px grid
- [ ] Colors follow 4-layer system
- [ ] Buttons follow hierarchy
- [ ] No pure #000 on #fff
- [ ] One icon library
- [ ] Consistent border radius

# SKILL-2-COLOR.md -- The 4-Layer Product Color System

> NEVER guess colors. NEVER accept AI-default bright palettes. This system is derived from Vercel, Linear, Notion, Superbase, and Mercury. Follow it exactly.

---

## LAYER 1: NEUTRAL FOUNDATION (90%+ of your interface)

### Light Mode Backgrounds (need 4 layers)

- **App frame/sidebar**: 96-98% white. Add 1-3% of brand hue as tint. Mercury adds 2% blue to their sidebar. This tiny tint creates depth.
- **Page background**: 98-100% white. Can be pure white.
- **Cards/elevated surfaces**: pure white or 99%. Lighter cards = good reason to NOT have pure white as your background.
- **Hover/muted areas**: 95-97% white.

**Pick ONE background strategy** (do not mix):
1. Dark frame + light cards (Vercel style)
2. Light frame + darker cards (Notion style)
3. Monochromatic layers (Superbase style)

### Borders (2 values)

- **Default** (card edges, inputs): ~85% white. NEVER thin black borders. Use 85% white to define edges without overpowering.
- **Subtle** (soft dividers): ~93% white.

### Text (3 values)

- **Headings**: ~11% white. Even the darkest text is NOT pure black.
- **Body text**: ~15-20% white.
- **Subtext/captions**: ~30-40% white.

### Buttons (the darker = more important rule)

Ghost buttons at 90-95% white. Multi-purpose buttons around 90-95% white. Primary CTAs are near-black with white text. This creates intuitive visual hierarchy.

---

### Dark Mode Rules

Dark mode is NOT just "invert the palette." Three critical changes:

#### 1. Double the Distance
Light mode backgrounds differ by ~2% lightness. Dark colors look more similar, so they require more distance. **Double the gap to 4-6%** between dark mode background layers. Otherwise elements lose all distinction.

- App bg: 8-12% white
- Page bg: 12-16% white
- Cards: 16-22% white
- Subtle/hover: 20-26% white

#### 2. Surfaces Get Lighter as They Elevate (non-negotiable)
Raised cards = lighter color or a visible border. Page is darkest, cards lighter, popovers lighter still, modals lightest.

#### 3. Dim Text, Brighten Borders
- Primary text: ~94% white (not pure #fff)
- Secondary: ~70% white
- Borders: brighten to ~20-30% white

---

## LAYER 2: FUNCTIONAL ACCENT (Brand Color)

Your brand color is a SCALE, not a single hex. Think lightest to darkest (50 through 950).

### Usage by shade:

**Light mode**: Main color = 500 or 600. Hover = 700. Links = 400 or 500. Tinted backgrounds = 50 or 100.

**Dark mode**: Main color = 300 or 400. Hover = 400 or 500. Use the lighter end of your ramp.

### Budget
Accent appears in ~5-10% of interface:
- YES: Primary CTAs, active nav states, links, selected states, focus rings, progress bars
- NO: Large area backgrounds, all buttons, card borders, decorative elements

Generate your ramp using uicolors.app or similar tools for a full scale that works across light and dark modes.

---

## LAYER 3: SEMANTIC COMMUNICATION

Colors convey meaning. You MUST break your brand system for semantics. Even if your brand is purple, destructive actions are red. This is a design sin to violate.

### Required Semantic Colors
- **Success (green)**: builds passing, confirmations, positive trends
- **Warning (amber)**: caution states, approaching limits
- **Error/destructive (red)**: failures, delete actions, breaking changes
- **Info (blue)**: neutral informational states

Each semantic color needs: light tinted bg, medium icon/border, dark text variant.

### Charts: The OKLCH Solution

Neutral charts are lame. Brand-ramp-only charts look too similar. You need a full spectrum.

**Problem**: Bright green looks far more neon than bright blue at the same HSL saturation. Different hues have different perceived brightness.

**Solution**: OKLCH color space (based on human perception). Go to oklch.com, set fixed lightness and chroma, then increment hue by 25-30 degrees. Each resulting color has identical perceived brightness.

Rules:
- Multi-series charts: OKLCH-generated palette
- Single-series: brand color ramp (200, 400, 600)
- Binary comparisons: brand vs neutral gray
- First/most important series gets the brand color
- Ensure colorblind safety (never rely on red vs green alone)

---

## LAYER 4: THEMING (Optional)

### The OKLCH Theming Trick

For every neutral you have, plug in the hex value and:
1. Drop the lightness by 0.003
2. Increase the chroma by 0.02
3. Adjust the hue to your desired theme

This produces subtly tinted neutrals for any theme (red, green, blue). Works even better on dark mode. Theme tint should be barely perceptible on backgrounds.

---

## COMMON COLOR MISTAKES

| Mistake | Fix |
|---|---|
| Pure #000 text on #fff | ~11% white text on ~99% white bg |
| Bright blue card backgrounds | 95-98% white with 1-2% hue tint |
| Neon green success states | Muted, desaturated green |
| Dark blue sidebar | Near-white with 2% brand tint |
| Same border everywhere | 2 tokens: default 85% + subtle 93% |
| Full-saturation accent everywhere | 50/100 for bg, 500/600 for accents only |
| Dark mode = inverted light | Double the lightness gaps |
| Pure white dark mode text | 93-95% white for primary |
| Brand ramp for charts | OKLCH multi-hue palette |


# SKILL-3-LAYOUT.md -- Layout, Components, Navigation, Dashboards

> AI produces the same layout for every page. This file ensures each page layout serves its specific content. Based on proven patterns from production SaaS products.

---

## RULE: NEVER LET AI CHOOSE YOUR LAYOUT

Before writing any code, answer:
- What is the PRIMARY action on this page?
- What data does the user need FIRST?
- What is secondary / progressive?

Then choose layout accordingly. Not every page is a dashboard.

---

## NAVIGATION

### Sidebar Rules
- Left-aligned items (never centered)
- Tight spacing: 8-10px gaps between nav items
- Group related items with subtle section dividers or small uppercase labels
- Active state: tinted bg (brand-50/100) + bolder text, or left border accent
- Icons: 18-20px, consistent stroke weight, 8-12px gap to label
- Sidebar is for NAVIGATION only. No stats, KPIs, or status displays.

### Account Section
- NEVER gradient circles with initials
- Compact account card at bottom: avatar + name + email in small text
- Settings, billing, usage, logout = popover on click of account card
- Do NOT list these as separate sidebar items. They clutter nav with infrequent actions.

### Top Bar
- Search (cmd+K pattern preferred)
- Notification bell if applicable
- Account avatar triggering settings popover

---

## CARD DESIGN

### Fixing Over-Buttoned Cards
Show 0-1 primary actions visibly. ALL secondary actions go into a triple-dot overflow menu (top-right). On hover the triple-dot appears; at rest it can be hidden.

### Card Content Layout
```
[Icon] [Title .......................... metric/count]
       [URL or subtitle .............. date/timestamp]
       [Tag icons .......................... ... menu]
```

- Title: top-left, semibold 14-16px
- Dates: consistent position (center or right)
- Status chips: collapse to icon-only when tight
- Clicks/metrics: right-aligned for scannability
- Description: 1-2 lines max, truncate with ellipsis

### KPI Cards
- Show each metric ONCE (never repeated across page sections)
- Replace plain numbers with number + micro sparkline or trend arrow
- Show trend: up/down arrow + % change + color (green up, red down)
- Expand cards horizontally instead of tiny squares
- Use micro charts (sparklines, tiny bars, small donuts) for density

---

## DASHBOARD PAGES

### The AI Anti-Pattern
AI always generates: 4 identical KPI cards, one big chart, a table. Boring. Often repeats data.

### Better Approach
- Identify 3-5 most important metrics for THIS dashboard
- Show each metric ONCE in most effective format
- Use 2-column or asymmetric layout, not uniform grids
- Mix viz types: sparklines in KPIs, trend chart, table, map
- Add interactivity: date pickers, filter toggles, comparison switches
- Replace generic bar charts with contextual alternatives:
  - Geo data: choropleth maps with shaded regions
  - Time data: area charts or sparklines
  - Distribution: donut charts
  - Comparison: horizontal bar charts

---

## ANALYTICS PAGES

- Add toggle to switch between aggregate and individual item views
- Individual view lets users compare specific items (low-hanging fruit, genuinely useful)
- Move filters to toolbar ABOVE the chart
- Show data table alongside viz, not on a separate tab
- Add helpful icons with subtle color to table rows for scanning
- For geo data: real map with shaded regions + data breakdown to the side
- Icons in data rows add a splash of color and improve scannability

---

## BILLING AND USAGE PAGES

### AI Mistakes to Avoid
- Cards that display plan info but do nothing (delete them)
- KPIs styled like dashboard metrics (looks amateurish here)
- 5 pricing tiers crammed horizontally
- Discounts not clearly shown

### Better Structure (use tabs)
1. **Usage tab**: Two-column layout with small donut charts for quota consumption
2. **Plans tab**: Pricing cards with clear hierarchy
3. **Billing tab**: Payment method, billing email, invoice history

### Pricing Card Rules
- Max 3-4 plans visible (drop least popular if 5+)
- Cost per month = LARGEST text (people care about price, not plan name)
- Plan name = small text
- Show original price struck through + savings amount for discounted plans
- Show what the NEXT plan includes that current does NOT
- Current plan: subtle border or badge, not giant colored background
- Enterprise: "Contact us" for very high-volume tiers

### Scaling Benefit
As product grows and you add integrations, AI, etc., just add another tab.

---

## FORMS AND MODALS

### When to Use Modals
- 2-3 fields + plenty of space: inline form
- 4+ fields or busy page: modal
- Advanced/optional fields: modal with collapsed "Advanced Options"

### Modal Rules
- Max width: 480-560px (simple), 640-720px (complex)
- Collapse advanced options by default
- Primary action: bottom-right
- Modern look: rounded corners, subtle shadow
- Structure so new features slot in without redesign

---

## TABLES

- Header: uppercase 11-12px, weight 500-600, muted color
- Row height: 40-48px
- Horizontal lines only (subtle). NO vertical grid lines.
- Sticky header. Sortable columns with indicators.
- Actions: far right, overflow menu or hover-visible
- Mobile: horizontal scroll or card layout transform

---

## EMPTY STATES

Every section with possible zero data MUST have:
- Short friendly headline
- Brief value description
- Primary CTA to create first item
- Optional simple illustration (NOT an emoji)
- NEVER blank page or bare "No data found"

---

## TABS

- Active: darker text + 2px bottom border (brand or near-black)
- Inactive: muted text, no border
- Left-aligned bar with full-width subtle bottom border
- URL-based state (tab changes update URL)

---

## POPOVERS

- Max width: 200-320px
- Item height: 32-40px
- Dividers between groups
- Destructive items at bottom in red
- Close on outside click and Escape


# SKILL-4-DELIGHT.md -- Landing Pages, Motion, Personality, Finishing Touches

> Corporate AI mush is replacing playful, well-designed websites. This file ensures your landing pages and marketing surfaces have personality, motion, and trust-building presentation. Sterile is not modern.

---

## LANDING PAGES

### The Trust Problem
Landing pages are where you lose most customers if you vibe code it. There is a standard of quality on SaaS landing pages that establishes trust, even subconsciously. Presentation drives conversion.

### Graphics Over Generic Icons
- NEVER use AI-generated generic feature icons on landing pages
- Instead use: slightly edited screenshots of your actual product (analytics page, key features)
- Simple graphic treatments add a lot: skewed cards, subtle rotations, perspective transforms
- Even something as simple as link cards with some skew really elevates the page

### Contextual Visual Elements
Decorative elements should provide CONTEXT, not just fill space:
- Invoicing site: money icons, invoice graphics, payment symbols tell you what the product does without reading
- The core message is center. Supporting elements give context around it.
- Elements should draw attention TO the center, trailing off further from the focal point

### The Clutter Line
- Maintain good spacing around text so elements are context, not clutter
- If adding another element pushes the design over the line, remove it
- When elements break the grid, be very selective in arrangement
- Test: does each element ADD context or just ADD clutter?

### Matching the Vibe
Every site has a personality spectrum from playful to professional:
- Playful: blobs, fun colors, doodles, illustrations (crypto sites, Gumroad)
- Professional: realistic imagery, clean lines (invoicing, enterprise tools)
- Match your decorative style to your brand positioning
- Inconsistent vibe feels "off" even if nothing is objectively wrong

---

## MOTION AND ANIMATION

### Principle: Just Because It Does Not Have to Move Does Not Mean It Should Not
Static pages that COULD have motion feel like a missed opportunity. But motion must be purposeful.

### Element Entrance Animations
Instead of robotic fade-ins, give elements personality:
- Stars/small elements: rotate and pop into view
- Larger elements: fly in from off-screen, then settle with slow bobbing
- Cards/UI elements: move and rotate in with easing
- Apply natural easing curves for organic motion (not linear)

### Text Animations
Text is 80% of most websites and is inherently boring. Motion draws attention to it:
- Simple: fade-in slide-down for key words
- Intermediate: words replaced by animated representations (progress bars, bouncing icons, checkboxes)
- The goal is NOT complexity. It is drawing attention to text because it is moving.
- Apple Mac Mini landing page: masterclass in text + motion storytelling

### Scroll-Based Motion
- Parallax on decorative elements in spacious margins creates lifelike feel
- No need for crazy layered backgrounds
- Subtle scroll animations (elements rotating in at bottom of viewport)
- Easing functions make motion feel natural

### Hover Interactions
Small hover interactions on many elements make simplicity non-bland:
- Buttons: subtle scale, color shift, or shadow increase
- Cards: gentle lift or border change
- Links: underline animations
- Images: subtle zoom or rotation
- Having hover interactions on most elements creates engagement without being busy

### Micro-Interactions in Product UI
- Status indicators (loading spinners, progress bars)
- Tooltips with smooth entrance
- Button press feedback
- Toggle animations
- Notification slide-ins

---

## COPYWRITING AND TONE

### Friendly, Not Corporate
- "We sweat the details" beats "We take pride in our attention to detail"
- Use natural, easy-to-understand language
- Base Camp style: built around natural language instead of corporate jargon
- Conversational, human, specific

### Rules for UI Copy
- Button labels: action verbs ("Create link" not "Submit")
- Error messages: helpful and specific, not technical jargon
- Empty states: encouraging, not robotic
- Tooltips: brief and useful
- Page titles: clear and descriptive

---

## FINISHING TOUCHES

### 404 Pages
The ultimate time to be quirky and fun. The user does not belong there, so entertain them:
- Interactive elements (quizzes, mini-games)
- Brand character or mascot
- Smooth animations
- Personal, friendly text
- Clear path back to useful pages

### The Details You Do Not See
Design is often about things you do NOT see:
- Consistent spacing everywhere (audit it)
- Smooth transitions between states
- Proper loading states (skeleton screens, not blank white)
- Error recovery that does not lose user data
- Keyboard navigation working properly

### Low-Hanging Fruit Features
Simple additions that dramatically improve the app:
- Toggle views (aggregate vs individual comparison)
- Helpful icons that add color and scannability to data rows
- Richer visualizations (maps instead of bar charts)
- These small changes create the biggest visible impact for the least effort

---

## THE ANTI-AI-MUSH MANIFESTO FOR LANDING PAGES

Somewhere along the way, "modern" became a synonym for "sterile." Fight this:

1. Add contextual graphics (product screenshots, themed illustrations)
2. Add purposeful motion (entrance animations, scroll parallax, hover states)
3. Add text personality (animate key words, use friendly copy)
4. Add finishing touches (custom 404, loading states, micro-interactions)
5. Match your vibe consistently (playful OR professional, never confused)

The result transforms a boring AI-generated design into a playful, bespoke experience that builds trust and converts.
