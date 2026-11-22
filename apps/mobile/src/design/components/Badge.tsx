import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Icon } from '../icons';
import { useTheme } from '../theme';
import type { ColorTokens } from '../tokens/colors';
import { radius, space } from '../tokens/spacing';
import { Text } from './Text';

export type BadgeTone = 'accent' | 'neutral' | 'inverse' | 'outline' | 'danger';

type ToneSpec = {
  background: keyof ColorTokens | null;
  foreground: keyof ColorTokens;
  border: keyof ColorTokens | null;
};

const tones: Record<BadgeTone, ToneSpec> = {
  accent: { background: 'accent', foreground: 'onAccent', border: null },
  neutral: { background: 'fill', foreground: 'textPrimary', border: null },
  inverse: { background: 'primary', foreground: 'onPrimary', border: null },
  outline: { background: null, foreground: 'textPrimary', border: 'borderStrong' },
  danger: { background: null, foreground: 'danger', border: null },
};

export type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: Icon;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = 'neutral', icon: Glyph, style }: BadgeProps) {
  const { colors } = useTheme();
  const spec = tones[tone];
  const foreground = colors[spec.foreground];
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        styles.base,
        spec.background !== null && { backgroundColor: colors[spec.background] },
        spec.border !== null && { borderWidth: 1, borderColor: colors[spec.border] },
        tone === 'danger' && styles.bare,
        style,
      ]}
    >
      {Glyph ? <Glyph size={12} color={foreground} weight="fill" /> : null}
      <Text variant="captionStrong" style={[styles.label, { color: foreground }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xxs,
    minHeight: 22,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
  bare: {
    paddingHorizontal: 0,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});
