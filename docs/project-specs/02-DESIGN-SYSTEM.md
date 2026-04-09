# 02 - Design System

## IMPORTANT: Also read elite-ui-ux-designer-skill.md in the project root before building any UI.

## Design Philosophy

WODO Ally uses a dark-theme glass morphism design inspired by the user's reference images. The aesthetic is premium, minimal, and functional - like a high-end fintech dashboard. Key principles:

- Dark base with glass card overlays creating depth
- Orange (#fd7e14) as the singular accent color for CTAs, highlights, active states
- Abstract orange wave background image (bg-wave.jpg) behind the main content area providing color bleed through glass elements
- Generous spacing, rounded corners (12px-16px), and subtle animations
- Information density balanced with whitespace
- Mobile-first responsive design

## Color Tokens

Add to `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base palette
        background: {
          DEFAULT: "#0a0a0f",        // Deepest background
          elevated: "#12121a",       // Sidebar, elevated surfaces
          card: "rgba(255,255,255,0.03)", // Glass card base
        },
        surface: {
          DEFAULT: "rgba(255,255,255,0.05)",  // Subtle surface
          hover: "rgba(255,255,255,0.08)",     // Hover state
          active: "rgba(255,255,255,0.12)",    // Active/pressed
          border: "rgba(255,255,255,0.08)",    // Default border
        },
        // Brand accent
        accent: {
          DEFAULT: "#fd7e14",        // Primary orange
          hover: "#e8720f",          // Darker on hover
          light: "rgba(253,126,20,0.15)", // Orange glow/tint
          muted: "rgba(253,126,20,0.08)", // Subtle orange tint
        },
        // Text hierarchy
        text: {
          primary: "rgba(255,255,255,0.92)",   // Headings, primary text
          secondary: "rgba(255,255,255,0.60)", // Body text, descriptions
          muted: "rgba(255,255,255,0.38)",     // Placeholders, disabled
          accent: "#fd7e14",                    // Highlighted text
        },
        // Status colors
        status: {
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
          info: "#3b82f6",
        },
      },
      borderRadius: {
        glass: "16px",
        card: "12px",
        button: "10px",
      },
      backdropBlur: {
        glass: "20px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glass-hover": "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        glow: "0 0 20px rgba(253,126,20,0.15)",
        "glow-strong": "0 0 30px rgba(253,126,20,0.25)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display": ["2.5rem", { lineHeight: "1.1", fontWeight: "700" }],
        "h1": ["1.875rem", { lineHeight: "1.2", fontWeight: "600" }],
        "h2": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        "h3": ["1.25rem", { lineHeight: "1.4", fontWeight: "500" }],
        "body": ["0.9375rem", { lineHeight: "1.6", fontWeight: "400" }],
        "small": ["0.8125rem", { lineHeight: "1.5", fontWeight: "400" }],
        "xs": ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "glass-shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

## Global Styles

In `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

@layer base {
  :root {
    --accent: 253 126 20;
    --background: 10 10 15;
  }

  body {
    @apply bg-background-DEFAULT text-text-primary font-sans antialiased;
  }
}

@layer components {
  /* Glass Card - Primary container component */
  .glass-card {
    @apply relative overflow-hidden;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .glass-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  /* Glass Card with accent glow */
  .glass-card-accent {
    @apply glass-card;
    border-color: rgba(253, 126, 20, 0.15);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
                0 0 20px rgba(253, 126, 20, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  /* Sidebar glass */
  .glass-sidebar {
    background: rgba(18, 18, 26, 0.85);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* Input fields */
  .glass-input {
    @apply w-full rounded-button px-3 py-2 text-body transition-all duration-200;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.92);
  }

  .glass-input:focus {
    outline: none;
    border-color: rgba(253, 126, 20, 0.5);
    box-shadow: 0 0 0 3px rgba(253, 126, 20, 0.1);
  }

  .glass-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}
```

## Core Reusable Components

### GlassCard Component

Create `src/components/shared/glass-card.tsx`. This is the foundational container used everywhere. Implement with these props: `variant` ("default" | "accent" | "stat"), `className`, `children`, `padding` ("sm" | "md" | "lg"). Default padding is "md" (p-5). The accent variant adds the orange border glow. The stat variant is compact for KPI cards.

### StatCard Component

Create `src/components/shared/stat-card.tsx`. Used on dashboard for KPI display. Props: `title` (string), `value` (string/number), `change` (percentage with +/- prefix), `icon` (LucideIcon), `trend` ("up" | "down" | "neutral"). Show the value in large display font, title in text-muted, change with green/red color based on trend. Use GlassCard with variant="stat".

### StatusBadge Component

Create `src/components/shared/status-badge.tsx`. Pill-shaped badges for invoice/project statuses. Map statuses to colors:
- draft: surface bg, muted text
- sent/active: accent bg with 15% opacity, accent text
- paid/completed: success bg with 15% opacity, success text
- overdue: error bg with 15% opacity, error text
- cancelled: muted bg, muted text
- viewed: info bg with 15% opacity, info text

### CurrencyDisplay Component

Create `src/components/shared/currency-display.tsx`. Formats amounts with currency symbol. Props: `amount`, `currency` ("INR" | "USD" | "AED" | "GBP"), `size` ("sm" | "md" | "lg"). INR uses Rs. prefix, USD uses $, AED uses AED prefix. Use `Intl.NumberFormat` with Indian number system for INR (lakhs/crores grouping).

## Layout Structure

### Main Layout (Dashboard)

The dashboard layout has:
1. **Fixed sidebar** (260px wide on desktop, collapsible sheet on mobile)
2. **Main content area** with the bg-wave.jpg as a fixed background with low opacity (5-8%) so glass cards have something to blur against
3. **Top header** inside content area with breadcrumbs and user avatar

Background implementation:
```css
/* On the main content wrapper */
.content-area {
  position: relative;
  min-height: 100vh;
}
.content-area::before {
  content: '';
  position: fixed;
  top: 0;
  left: 260px; /* sidebar width */
  right: 0;
  bottom: 0;
  background: url('/bg-wave.jpg') center/cover no-repeat;
  opacity: 0.06;
  z-index: 0;
  pointer-events: none;
}
```

### Sidebar Navigation Items

```
Dashboard          (LayoutDashboard icon)
Clients            (Users icon)
Projects           (FolderKanban icon)
Invoices           (FileText icon)
Contracts          (FileSignature icon)
Payments           (CreditCard icon)
---separator---
Expenses           (Receipt icon)
Analytics          (BarChart3 icon)
Targets            (Target icon)
---separator---
Investor Reports   (PieChart icon)
Settings           (Settings icon)
```

Active nav item: accent left border (3px), text-accent color, surface-active background.

## Typography Rules

- Page titles: text-h1, text-text-primary
- Section headings: text-h2, text-text-primary
- Card titles: text-h3, text-text-primary
- Body content: text-body, text-text-secondary
- Labels/captions: text-small, text-text-muted
- Monetary values: font-mono, tabular-nums for alignment
- Never use em dashes. Use hyphens.

## Chart Styling (Recharts)

All charts follow this dark theme:
- Background: transparent
- Grid lines: rgba(255,255,255,0.05)
- Axis text: rgba(255,255,255,0.4), 12px
- Primary data color: #fd7e14 (accent)
- Secondary data color: #22c55e (success)
- Tertiary: #3b82f6 (info)
- Tooltip: glass-card style background with backdrop blur
- No chart borders or outlines

## Responsive Breakpoints

- Mobile: < 768px (sidebar becomes sheet, single column layouts)
- Tablet: 768px-1024px (compact sidebar, 2-column grids)
- Desktop: > 1024px (full sidebar, multi-column grids)

## Animation Guidelines

- Page transitions: fade-in 300ms
- Card hover: transform scale(1.01) over 200ms
- Loading states: skeleton shimmer animation
- Number changes: count-up animation for stat values
- Modals/sheets: slide-up 300ms with fade

## Accessibility

- All interactive elements must have focus-visible outlines (accent ring)
- Minimum contrast ratio 4.5:1 for body text
- ARIA labels on icon-only buttons
- Keyboard navigation for all forms and tables
