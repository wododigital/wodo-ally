import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "transparent",
          card: "rgba(255,255,255,0.45)",
        },
        surface: {
          DEFAULT: "rgba(0,0,0,0.03)",
          hover: "rgba(0,0,0,0.05)",
          active: "rgba(0,0,0,0.08)",
          border: "rgba(0,0,0,0.05)",
        },
        accent: {
          DEFAULT: "#fd7e14",
          hover: "#e8720f",
          light: "rgba(253,126,20,0.15)",
          muted: "rgba(253,126,20,0.10)",
        },
        text: {
          primary: "#111827",
          secondary: "#6b7280",
          muted: "#9ca3af",
          accent: "#fd7e14",
        },
        status: {
          success: "#16a34a",
          warning: "#f59e0b",
          error: "#ef4444",
          info: "#3b82f6",
          neutral: "#9ca3af",
        },
        dark: {
          section: "#1d1f2e",
          card: "rgba(255,255,255,0.06)",
          border: "rgba(255,255,255,0.08)",
          divider: "rgba(255,255,255,0.05)",
        },
        nav: {
          bg: "#1e2030",
          active: "#fd7e14",
        },
      },
      borderRadius: {
        glass: "16px",
        card: "16px",
        button: "9999px",
        input: "10px",
        dark: "24px",
        icon: "12px",
      },
      backdropBlur: {
        glass: "24px",
        accordion: "14px",
        dropdown: "20px",
      },
      boxShadow: {
        glass: "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        "glass-hover": "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
        accordion: "0 1px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        dropdown: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        glow: "0 0 20px rgba(253,126,20,0.15)",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["2.5rem", { lineHeight: "1.1", fontWeight: "300" }],
        h1: ["1.75rem", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["1.25rem", { lineHeight: "1.4", fontWeight: "500" }],
        body: ["0.875rem", { lineHeight: "1.6", fontWeight: "400" }],
        small: ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
        xs: ["0.6875rem", { lineHeight: "1.5", fontWeight: "400" }],
        kpi: ["2.4rem", { lineHeight: "1", fontWeight: "300" }],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
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
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
