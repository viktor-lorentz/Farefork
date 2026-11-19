import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { colorSchemes, type ColorScheme, type ColorTokens } from './tokens/colors';

type Pair = [foreground: keyof ColorTokens, background: keyof ColorTokens];

const textPairs: Pair[] = [
  ['textPrimary', 'background'],
  ['textPrimary', 'surface'],
  ['textPrimary', 'surfaceRaised'],
  ['textPrimary', 'fill'],
  ['textSecondary', 'background'],
  ['textSecondary', 'surface'],
  ['textSecondary', 'surfaceRaised'],
  ['textSecondary', 'fill'],
  ['textTertiary', 'background'],
  ['textTertiary', 'surface'],
  ['textTertiary', 'surfaceRaised'],
  ['textTertiary', 'fill'],
  ['onPrimary', 'primary'],
  ['onAccent', 'accent'],
  ['onDanger', 'danger'],
  ['danger', 'surface'],
  ['danger', 'fill'],
];

const schemes: ColorScheme[] = ['light', 'dark'];

describe.each(schemes)('%s theme', (scheme) => {
  const colors = colorSchemes[scheme];

  it.each(textPairs)('%s on %s meets WCAG AA for body text', (foreground, background) => {
    expect(contrastRatio(colors[foreground], colors[background])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the accent fill distinct from the surface it sits on', () => {
    expect(colors.accent).not.toBe(colors.surface);
  });
});

describe('contrastRatio', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#FFD400', '#000000')).toBeCloseTo(contrastRatio('#000000', '#FFD400'));
  });
});
