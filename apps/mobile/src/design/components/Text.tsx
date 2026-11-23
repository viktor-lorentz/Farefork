import { Text as NativeText, StyleSheet, type TextProps as NativeTextProps } from 'react-native';
import { useTheme } from '../theme';
import type { ColorTokens } from '../tokens/colors';
import { typeScale, type TypeVariant } from '../tokens/typography';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'onPrimary'
  | 'onAccent'
  | 'danger'
  | 'accent'
  | 'savings'
  | 'surge';

const toneColor: Record<TextTone, keyof ColorTokens> = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  disabled: 'textDisabled',
  onPrimary: 'onPrimary',
  onAccent: 'onAccent',
  danger: 'danger',
  accent: 'accentText',
  savings: 'savingsText',
  surge: 'surgeText',
};

export type TextProps = NativeTextProps & {
  variant?: TypeVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
  tabular?: boolean;
  strikethrough?: boolean;
};

export function Text({
  variant = 'body',
  tone = 'primary',
  align,
  tabular,
  strikethrough = false,
  maxFontSizeMultiplier,
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  const spec = typeScale[variant];
  return (
    <NativeText
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? spec.maxScale}
      {...rest}
      style={[
        {
          fontFamily: spec.fontFamily,
          fontWeight: spec.fontWeight,
          fontSize: spec.fontSize,
          lineHeight: spec.lineHeight,
          letterSpacing: spec.letterSpacing,
          color: colors[toneColor[tone]],
        },
        (tabular ?? spec.tabular) && styles.tabular,
        strikethrough && styles.strikethrough,
        align !== undefined && { textAlign: align },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tabular: { fontVariant: ['tabular-nums'] },
  strikethrough: { textDecorationLine: 'line-through' },
});
