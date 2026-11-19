import type { ColorScheme } from './colors';

export type ElevationTokens = {
  raised: string;
  overlay: string;
  sheet: string;
};

export const elevations: Record<ColorScheme, ElevationTokens> = {
  light: {
    raised: '0px 1px 2px rgba(0, 0, 0, 0.06), 0px 4px 12px rgba(0, 0, 0, 0.08)',
    overlay: '0px 12px 32px rgba(0, 0, 0, 0.16)',
    sheet: '0px -1px 0px rgba(0, 0, 0, 0.04), 0px -8px 24px rgba(0, 0, 0, 0.08)',
  },
  dark: {
    raised: '0px 0px 0px 1px rgba(255, 255, 255, 0.08)',
    overlay: '0px 0px 0px 1px rgba(255, 255, 255, 0.10), 0px 16px 40px rgba(0, 0, 0, 0.6)',
    sheet: '0px -1px 0px rgba(255, 255, 255, 0.08)',
  },
};
