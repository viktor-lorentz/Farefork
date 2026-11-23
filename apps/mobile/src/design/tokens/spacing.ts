export const space = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  huge: 64,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
} as const;

export const controlHeight = {
  sm: 36,
  md: 48,
  lg: 56,
} as const;

export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

export const breakpoints = {
  medium: 600,
  expanded: 1024,
  wide: 1440,
} as const;

export const layout = {
  gutter: 16,
  margin: 20,
  gutterWide: 32,
  panelWidth: 440,
  contentMaxWidth: 720,
  tabBarHeight: 56,
  topBarHeight: 64,
  sheetPeek: 380,
  sheetResultsRatio: 0.8,
  sheetMaxRatio: 0.9,
  mapSheetOverlap: 40,
} as const;

export type SpaceToken = keyof typeof space;
export type RadiusToken = keyof typeof radius;
