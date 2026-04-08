import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#685BC7",
          hover:   "#5549B0",
          light:   "#EDE9FF",
        },
        accent: {
          DEFAULT: "#B5ED18",
          hover:   "#A0D614",
        },
        dark: {
          DEFAULT: "#1A1A2E",
          card:    "#222236",
          muted:   "rgba(255,255,255,0.08)",
        },
        bg:   { DEFAULT: "#FAFAFA", card: "#FFFFFF" },
        text: { DEFAULT: "#1A1A2E", muted: "#6B7280", subtle: "#9CA3AF" },
        success: { DEFAULT: "#22C55E", light: "#F0FDF4" },
        error:   { DEFAULT: "#EF4444", light: "#FEF2F2" },
        warning: { DEFAULT: "#F59E0B", light: "#FFFBEB" },
        locked:  { DEFAULT: "#D1D5DB" },
        border:  "#F0F0F5",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
      },
      borderRadius: {
        "sm":  "8px",
        "md":  "12px",   // кнопки, поля
        "lg":  "16px",   // маленькие карточки
        "xl":  "20px",   // карточки
        "2xl": "24px",   // большие карточки
        "3xl": "32px",   // hero-блоки
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      boxShadow: {
        "card":      "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
        "card-md":   "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)",
        "primary":   "0 4px 14px rgba(104,91,199,0.30)",
        "accent":    "0 4px 14px rgba(181,237,24,0.40)",
        "dark":      "0 8px 32px rgba(26,26,46,0.24)",
        "inner-sm":  "inset 0 1px 3px rgba(0,0,0,0.06)",
      },
      animation: {
        "xp-pop":   "xpPop 0.45s cubic-bezier(0.175,0.885,0.32,1.275)",
        "fade-in":  "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.28s cubic-bezier(0.16,1,0.3,1)",
        "bounce-in":"bounceIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)",
        "pulse-soft":"pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        xpPop:   { "0%": { transform: "scale(0.5)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        bounceIn:{ "0%": { transform: "scale(0.3)", opacity: "0" }, "60%": { transform: "scale(1.1)" }, "100%": { transform: "scale(1)", opacity: "1" } },
        pulseSoft:{ "0%,100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
      },
    },
  },
  plugins: [],
};

export default config;
