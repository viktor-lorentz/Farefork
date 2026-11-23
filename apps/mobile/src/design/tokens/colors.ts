export type ColorScheme = 'light' | 'dark';

export const brandColors = {
  ink: '#0E1424',
  paper: '#F7F7F5',
  night: '#0A0E19',
  streetlight: '#FFB443',
  savings: '#1E9E6A',
  surge: '#D9483B',
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
  accentText: string;
  accentSoft: string;
  savings: string;
  savingsText: string;
  savingsSoft: string;
  surge: string;
  surgeText: string;
  surgeSoft: string;
  danger: string;
  onDanger: string;
  scrim: string;
  skeleton: string;
  focus: string;
  glassFallback: string;
  logoPlate: string;
  logoPlateDark: string;
  logoPlateBorder: string;
  logoPlateBlack: string;
  logoPlateBlackBorder: string;
  onSky: string;
  onSkySecondary: string;
  white: string;
  transparent: string;
};

export const lightColors: ColorTokens = {
  background: brandColors.paper,
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  fill: '#EFEFEC',
  fillStrong: '#E4E4E0',
  pressed: '#E9E9E5',
  border: '#E0E1DD',
  borderStrong: '#C6C8C3',
  textPrimary: brandColors.ink,
  textSecondary: '#474E60',
  textTertiary: '#5C6273',
  textDisabled: '#A3A7B0',
  primary: brandColors.ink,
  onPrimary: '#FFFFFF',
  accent: brandColors.streetlight,
  onAccent: brandColors.ink,
  accentText: '#875700',
  accentSoft: '#FFF2DE',
  savings: brandColors.savings,
  savingsText: '#14744D',
  savingsSoft: '#E3F4EC',
  surge: brandColors.surge,
  surgeText: '#B13529',
  surgeSoft: '#FBE8E6',
  danger: '#B13529',
  onDanger: '#FFFFFF',
  scrim: 'rgba(14, 20, 36, 0.40)',
  skeleton: '#E9E9E5',
  focus: brandColors.ink,
  glassFallback: 'rgba(255, 255, 255, 0.88)',
  logoPlate: '#FFFFFF',
  logoPlateDark: brandColors.ink,
  logoPlateBorder: '#E0E1DD',
  logoPlateBlack: '#000000',
  logoPlateBlackBorder: '#E0E1DD',
  onSky: brandColors.ink,
  onSkySecondary: 'rgba(14, 20, 36, 0.72)',
  white: '#FFFFFF',
  transparent: 'transparent',
};

export const darkColors: ColorTokens = {
  background: brandColors.night,
  surface: '#141A29',
  surfaceRaised: '#1A2133',
  fill: '#1A2133',
  fillStrong: '#232B3F',
  pressed: '#1F2638',
  border: '#252D41',
  borderStrong: '#38415A',
  textPrimary: '#F1F2F5',
  textSecondary: '#A8AEBE',
  textTertiary: '#8C93A5',
  textDisabled: '#566076',
  primary: '#F1F2F5',
  onPrimary: brandColors.ink,
  accent: brandColors.streetlight,
  onAccent: brandColors.ink,
  accentText: brandColors.streetlight,
  accentSoft: '#2A2416',
  savings: '#2DAF7A',
  savingsText: '#3CC28B',
  savingsSoft: '#132A24',
  surge: '#E5594C',
  surgeText: '#F2766A',
  surgeSoft: '#2E1A1C',
  danger: '#F2766A',
  onDanger: brandColors.ink,
  scrim: 'rgba(0, 0, 0, 0.60)',
  skeleton: '#1F2638',
  focus: brandColors.streetlight,
  glassFallback: 'rgba(20, 26, 41, 0.90)',
  logoPlate: '#FFFFFF',
  logoPlateDark: brandColors.ink,
  logoPlateBorder: '#2C354B',
  logoPlateBlack: '#000000',
  logoPlateBlackBorder: '#2A2A2A',
  onSky: '#F1F2F5',
  onSkySecondary: 'rgba(241, 242, 245, 0.76)',
  white: '#FFFFFF',
  transparent: 'transparent',
};

export const colorSchemes: Record<ColorScheme, ColorTokens> = {
  light: lightColors,
  dark: darkColors,
};
