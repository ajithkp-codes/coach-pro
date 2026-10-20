/**
 * CoachPro brand design tokens — importable in JS/TS.
 * CSS custom properties are the source of truth at runtime (globals.css).
 * This file mirrors the key values so build-time code, emails, and
 * OG-image generators can reference the same palette.
 */

export const brand = {
  colors: {
    primary: { light: "#6D5CFF", dark: "#8B7DFF" },
    accent: { light: "#00F5D4", dark: "#00FFE0" },
    energy: { light: "#FF6B6B", dark: "#FF8585" },
    gold: { light: "#FFB800", dark: "#FFD93D" },

    background: { light: "#F8FAFC", dark: "#050810" },
    card: { light: "#FFFFFF", dark: "#0A0F1C" },
    elevated: { light: "#FFFFFF", dark: "#10162A" },
    muted: { light: "#F1F5F9", dark: "#131B30" },
    border: { light: "#E2E8F0", dark: "#1A2540" },
    foreground: { light: "#0C1222", dark: "#EEF1F8" },
    mutedForeground: { light: "#64748B", dark: "#8494AB" },

    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
  },

  gradients: {
    brand: "linear-gradient(135deg, #6D5CFF 0%, #00F5D4 100%)",
    energy: "linear-gradient(135deg, #FF6B6B 0%, #FFB800 100%)",
    premium: "linear-gradient(135deg, #6D5CFF 0%, #FF6B6B 100%)",
    brandDark: "linear-gradient(135deg, #8B7DFF 0%, #00FFE0 100%)",
  },

  radius: {
    sm: "0.5rem",
    md: "0.875rem",
    lg: "1.25rem",
    xl: "1.5rem",
    full: "9999px",
  },

  fonts: {
    sans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
  },
} as const;
