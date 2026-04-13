// Design tokens for Smart Health Reminder
// Dark-first palette, elderly-friendly large touch targets

export const Colors = {
  // Backgrounds
  bg: "#0D1117",
  bgCard: "#161B22",
  bgElevated: "#1C2128",
  bgGlass: "rgba(28, 33, 40, 0.85)",

  // Brand
  accent: "#7B61FF",
  accentLight: "rgba(123, 97, 255, 0.15)",
  accentMid: "rgba(123, 97, 255, 0.3)",
  teal: "#00D4AA",
  tealLight: "rgba(0, 212, 170, 0.15)",

  // Status
  success: "#3FB950",
  successLight: "rgba(63, 185, 80, 0.15)",
  warning: "#D29922",
  warningLight: "rgba(210, 153, 34, 0.15)",
  danger: "#F85149",
  dangerLight: "rgba(248, 81, 73, 0.15)",
  info: "#58A6FF",
  infoLight: "rgba(88, 166, 255, 0.15)",

  // Text
  textPrimary: "#F0F6FC",
  textSecondary: "#8B949E",
  textMuted: "#484F58",
  textOnAccent: "#FFFFFF",

  // Borders & Dividers
  border: "#30363D",
  borderSubtle: "#21262D",

  // Misc
  overlay: "rgba(0, 0, 0, 0.6)",
  white: "#FFFFFF",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 36,
} as const;

export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const Shadow = {
  sm: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// Minimum 44pt touch target for elderly accessibility (NFR-007)
export const TouchTarget = 48;
