import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0a0a0f",
          elevated: "#12121a",
          card: "rgba(255,255,255,0.03)",
        },
        surface: {
          DEFAULT: "rgba(255,255,255,0.05)",
          hover: "rgba(255,255,255,0.08)",
          active: "rgba(255,255,255,0.12)",
          border: "rgba(255,255,255,0.08)",
        },
        accent: {
          DEFAULT: "#fd7e14",
          hover: "#e8720f",
          light: "rgba(253,126,20,0.15)",
          muted: "rgba(253,126,20,0.08)",
        },
        text: {
          primary: "rgba(255,255,255,0.92)",
          secondary: "rgba(255,255,255,0.60)",
          muted: "rgba(255,255,255,0.38)",
          accent: "#fd7e14",
        },
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
        display: ["2.5rem", { lineHeight: "1.1", fontWeight: "700" }],
        h1: ["1.875rem", { lineHeight: "1.2", fontWeight: "600" }],
        h2: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["1.25rem", { lineHeight: "1.4", fontWeight: "500" }],
        body: ["0.9375rem", { lineHeight: "1.6", fontWeight: "400" }],
        small: ["0.8125rem", { lineHeight: "1.5", fontWeight: "400" }],
        xs: ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
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
