import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { haptics } from '@/lib/haptics';
import type { Icon } from '../icons';
import { useTheme } from '../theme';
import type { ColorTokens } from '../tokens/colors';
import { controlHeight, iconSize, radius, space } from '../tokens/spacing';
import { PressableScale } from './PressableScale';
import { Text, type TextTone } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'danger';
export type ButtonSize = 'lg' | 'md' | 'sm';

type VariantSpec = {
  background: keyof ColorTokens | null;
  foreground: keyof ColorTokens;
  tone: TextTone;
};

const variants: Record<ButtonVariant, VariantSpec> = {
  primary: { background: 'primary', foreground: 'onPrimary', tone: 'onPrimary' },
  secondary: { background: 'fill', foreground: 'textPrimary', tone: 'primary' },
  tertiary: { background: null, foreground: 'textPrimary', tone: 'primary' },
  accent: { background: 'accent', foreground: 'onAccent', tone: 'onAccent' },
  danger: { background: 'danger', foreground: 'onDanger', tone: 'primary' },
};

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: Icon;
  trailingIcon?: Icon;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = true,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const spec = variants[variant];
  const foreground = colors[spec.foreground];
  const inactive = disabled || loading;
  const glyphSize = size === 'sm' ? iconSize.sm : iconSize.md;

  return (
    <PressableScale
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        if (haptic) {
          haptics.light();
        }
        onPress?.();
      }}
      style={[
        styles.base,
        sizeStyles[size],
        spec.background !== null && { backgroundColor: colors[spec.background] },
        variant === 'tertiary' && styles.tertiary,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.content}>
          {LeadingIcon ? <LeadingIcon size={glyphSize} color={foreground} weight="bold" /> : null}
          <Text
            variant={size === 'sm' ? 'captionStrong' : 'labelStrong'}
            tone={spec.tone}
            style={{ color: foreground }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {TrailingIcon ? <TrailingIcon size={glyphSize} color={foreground} weight="bold" /> : null}
        </View>
      )}
    </PressableScale>
  );
}

const sizeStyles = StyleSheet.create({
  lg: { minHeight: controlHeight.lg, paddingHorizontal: space.lg, borderRadius: radius.md },
  md: { minHeight: controlHeight.md, paddingHorizontal: space.md, borderRadius: radius.md },
  sm: { minHeight: controlHeight.sm, paddingHorizontal: space.sm, borderRadius: radius.sm },
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  tertiary: {
    paddingHorizontal: space.xs,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.4,
  },
});
