export type ColorScheme = 'light' | 'dark';

export const brandColors = {
  signal: '#FFD400',
  ink: '#000000',
  paper: '#FFFFFF',
} as const;

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceRaised: string;
  fill: string;
  fillStrong: string;
  pressed: string;
  border: string;
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  primary: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  danger: string;
  onDanger: string;
  scrim: string;
  skeleton: string;
  focus: string;
  logoPlate: string;
  logoPlateBorder: string;
};

export const lightColors: ColorTokens = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  fill: '#F3F3F3',
  fillStrong: '#E8E8E8',
  pressed: '#EDEDED',
  border: '#E8E8E8',
  borderStrong: '#CDCDCD',
  textPrimary: '#000000',
  textSecondary: '#545454',
  textTertiary: '#6B6B6B',
  textDisabled: '#A6A6A6',
  primary: '#000000',
  onPrimary: '#FFFFFF',
  accent: brandColors.signal,
  onAccent: '#000000',
  danger: '#D7261E',
  onDanger: '#FFFFFF',
  scrim: 'rgba(0, 0, 0, 0.40)',
  skeleton: '#EEEEEE',
  focus: '#000000',
  logoPlate: '#FFFFFF',
  logoPlateBorder: '#E8E8E8',
};

export const darkColors: ColorTokens = {
  background: '#000000',
  surface: '#121212',
  surfaceRaised: '#1B1B1B',
  fill: '#1F1F1F',
  fillStrong: '#2A2A2A',
  pressed: '#262626',
  border: '#262626',
  borderStrong: '#3B3B3B',
  textPrimary: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textTertiary: '#8C8C8C',
  textDisabled: '#5C5C5C',
  primary: '#FFFFFF',
  onPrimary: '#000000',
  accent: brandColors.signal,
  onAccent: '#000000',
  danger: '#FF5A4F',
  onDanger: '#000000',
  scrim: 'rgba(0, 0, 0, 0.60)',
  skeleton: '#1F1F1F',
  focus: '#FFFFFF',
  logoPlate: '#FFFFFF',
  logoPlateBorder: '#FFFFFF',
};

export const colorSchemes: Record<ColorScheme, ColorTokens> = {
  light: lightColors,
  dark: darkColors,
};
