// Dark PadosiPro tokens from PADOSIPRO-MOBILE-UI-DESIGN-FINAL.md.
// Components use these names only; do not add one-off colors in screens.

export const colors = {
  bg: "#000000",
  surface: "#0A0A0A",
  surfaceRaised: "#141414",
  surfaceSelected: "#0F2115",

  accent: "#3E5F44",
  accentPressed: "#314B36",
  accentSoft: "#18301F",

  textPrimary: "#F0F0F0",
  textSecondary: "#999999",
  textOnAccent: "#FFFFFF",

  borderSubtle: "#252A26",
  borderInput: "#5F665F",

  success: "#8FB99A",
  error: "#F3727F",
  warning: "#FFA42B",
  info: "#539DF5",

  disabledBg: "#1C1C1C",
  disabledText: "#707070",
  scrim: "rgba(0,0,0,0.60)",
} as const;

export const type = {
  display: { fontSize: 28, lineHeight: 36, fontWeight: "700" as const },
  title: { fontSize: 22, lineHeight: 30, fontWeight: "700" as const },
  heading: { fontSize: 18, lineHeight: 26, fontWeight: "500" as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: "500" as const },
  small: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const layout = {
  screenPadding: 20,
  minTouch: 48,
  controlHeight: 52,
  maxContentWidth: 480,
} as const;

export const motion = {
  pressMs: 120,
  transitionMs: 180,
  sheetMs: 250,
} as const;
