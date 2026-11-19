export const fontFamilies = {
  regular: 'Satoshi-Regular',
  medium: 'Satoshi-Medium',
  bold: 'Satoshi-Bold',
  black: 'Satoshi-Black',
} as const;

export type FontWeightName = keyof typeof fontFamilies;

export type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  tabular: boolean;
  uppercase: boolean;
  maxScale: number;
};

type TypeStyleOptions = Partial<Pick<TypeStyle, 'tabular' | 'uppercase' | 'maxScale'>>;

function typeStyle(
  weight: FontWeightName,
  fontSize: number,
  lineHeight: number,
  letterSpacing: number,
  options: TypeStyleOptions = {},
): TypeStyle {
  return {
    fontFamily: fontFamilies[weight],
    fontSize,
    lineHeight,
    letterSpacing,
    tabular: options.tabular ?? false,
    uppercase: options.uppercase ?? false,
    maxScale: options.maxScale ?? 1.6,
  };
}

export const typeScale = {
  display: typeStyle('black', 40, 44, -1.2, { maxScale: 1.15 }),
  titleXL: typeStyle('bold', 32, 38, -0.8, { maxScale: 1.2 }),
  titleL: typeStyle('bold', 26, 32, -0.5, { maxScale: 1.25 }),
  titleM: typeStyle('bold', 21, 26, -0.3, { maxScale: 1.3 }),
  titleS: typeStyle('bold', 18, 24, -0.2, { maxScale: 1.35 }),
  bodyL: typeStyle('medium', 17, 24, -0.1),
  body: typeStyle('regular', 16, 22, 0),
  bodyStrong: typeStyle('medium', 16, 22, 0),
  label: typeStyle('medium', 15, 20, 0),
  labelStrong: typeStyle('bold', 15, 20, 0),
  caption: typeStyle('medium', 13, 18, 0.1),
  captionStrong: typeStyle('bold', 13, 18, 0.1),
  micro: typeStyle('bold', 11, 14, 0.6, { uppercase: true, maxScale: 1.3 }),
  priceXL: typeStyle('black', 34, 38, -0.8, { tabular: true, maxScale: 1.2 }),
  priceL: typeStyle('black', 24, 28, -0.4, { tabular: true, maxScale: 1.25 }),
  priceM: typeStyle('bold', 18, 22, -0.2, { tabular: true, maxScale: 1.3 }),
  priceS: typeStyle('bold', 15, 20, 0, { tabular: true, maxScale: 1.35 }),
} as const satisfies Record<string, TypeStyle>;

export type TypeVariant = keyof typeof typeScale;
