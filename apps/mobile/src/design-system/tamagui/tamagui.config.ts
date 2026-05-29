import { createFont, createTamagui, createTokens } from "@tamagui/core"

const bodyFont = createFont({
  family: "System",
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 22,
    4: 24,
    5: 28,
    6: 32,
  },
  weight: {
    4: "400",
    6: "600",
    7: "700",
  },
  letterSpacing: {
    4: 0,
  },
})

const tokens = createTokens({
  color: {
    background: "#f4f6fb",
    surface: "#ffffff",
    text: "#111827",
    muted: "#6b7280",
    brand: "#f6851b",
    brandSoft: "#fff1e4",
    border: "#e5e7eb",
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 32,
  },
  size: {
    0: 0,
    1: 28,
    2: 36,
    3: 44,
    4: 52,
    5: 60,
  },
  radius: {
    0: 0,
    1: 8,
    2: 12,
    3: 16,
    4: 24,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
  },
})

export const tamaguiConfig = createTamagui({
  tokens,
  fonts: {
    body: bodyFont,
    heading: bodyFont,
  },
  themes: {
    light: {
      background: tokens.color.background,
      color: tokens.color.text,
      borderColor: tokens.color.border,
    },
    dark: {
      background: "#0f172a",
      color: "#f9fafb",
      borderColor: "#1f2937",
    },
  },
  defaultTheme: "light",
})

export type AppTamaguiConfig = typeof tamaguiConfig

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
