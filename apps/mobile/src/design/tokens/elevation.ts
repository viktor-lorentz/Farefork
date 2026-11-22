import type { ColorScheme } from './colors';

export type ElevationTokens = {
  raised: string;
};

export const elevations: Record<ColorScheme, ElevationTokens> = {
  light: {
    raised: '0px 6px 20px rgba(14, 20, 36, 0.10)',
  },
  dark: {
    raised: '0px 8px 24px rgba(0, 0, 0, 0.45)',
  },
};
