import { Platform } from 'react-native';

export const fontFamilies = {
  display: 'YoungSerif_400Regular',
  system: Platform.select({
    web: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    default: undefined,
  }),
} as const;

export type FontWeight = '400' | '500' | '600' | '700';

export type TypeStyle = {
  fontFamily: string | undefined;
  fontWeight: FontWeight;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  tabular: boolean;
  maxScale: number;
};

export const fontSize = {
  largeTitle: 34,
  title1: 28,
  title2: 22,
  headline: 17,
  subhead: 15,
  footnote: 13,
  caption: 11,
} as const;

type TypeStyleOptions = Partial<Pick<TypeStyle, 'tabular' | 'maxScale' | 'fontFamily'>>;

function typeStyle(
  fontWeight: FontWeight,
  size: number,
  lineHeight: number,
  letterSpacing: number,
  options: TypeStyleOptions = {},
): TypeStyle {
  return {
    fontFamily: options.fontFamily ?? fontFamilies.system,
    fontWeight,
    fontSize: size,
    lineHeight,
    letterSpacing,
    tabular: options.tabular ?? false,
    maxScale: options.maxScale ?? 1.6,
  };
}

const display = { fontFamily: fontFamilies.display };

export const typeScale = {
  brand: typeStyle('400', fontSize.largeTitle, 40, -0.6, { ...display, maxScale: 1.15 }),
  brandM: typeStyle('400', fontSize.title1, 34, -0.4, { ...display, maxScale: 1.2 }),
  brandS: typeStyle('400', fontSize.title2, 26, -0.3, { ...display, maxScale: 1.2 }),
  display: typeStyle('700', fontSize.largeTitle, 41, 0.37, { maxScale: 1.15 }),
  titleXL: typeStyle('700', fontSize.largeTitle, 41, 0.37, { maxScale: 1.2 }),
  titleL: typeStyle('700', fontSize.title1, 34, 0.36, { maxScale: 1.25 }),
  titleM: typeStyle('700', fontSize.title2, 28, 0.35, { maxScale: 1.3 }),
  titleS: typeStyle('600', fontSize.headline, 22, -0.41, { maxScale: 1.4 }),
  bodyL: typeStyle('400', fontSize.headline, 22, -0.41),
  body: typeStyle('400', fontSize.headline, 22, -0.41),
  bodyStrong: typeStyle('600', fontSize.headline, 22, -0.41),
  label: typeStyle('400', fontSize.subhead, 20, -0.24),
  labelStrong: typeStyle('600', fontSize.subhead, 20, -0.24),
  caption: typeStyle('400', fontSize.footnote, 18, -0.08),
  captionStrong: typeStyle('600', fontSize.footnote, 18, -0.08),
  micro: typeStyle('500', fontSize.caption, 13, 0.06, { maxScale: 1.4 }),
  priceXL: typeStyle('700', fontSize.largeTitle, 40, -0.4, { tabular: true, maxScale: 1.2 }),
  priceL: typeStyle('700', fontSize.title2, 28, -0.2, { tabular: true, maxScale: 1.3 }),
  priceM: typeStyle('600', fontSize.headline, 22, -0.41, { tabular: true, maxScale: 1.35 }),
  priceS: typeStyle('600', fontSize.subhead, 20, -0.24, { tabular: true, maxScale: 1.4 }),
} as const satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof typeScale;
