import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { haptics } from '@/lib/haptics';
import type { Icon } from '../icons';
import { useTheme } from '../theme';
import { iconSize, radius } from '../tokens/spacing';
import { PressableScale } from './PressableScale';

export type IconButtonVariant = 'plain' | 'filled' | 'raised';

export type IconButtonProps = {
  icon: Icon;
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: IconButtonVariant;
  size?: 36 | 44 | 48;
  disabled?: boolean;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon: Glyph,
  accessibilityLabel,
  onPress,
  variant = 'plain',
  size = 44,
  disabled = false,
  active,
  style,
}: IconButtonProps) {
  const { colors, elevation } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={active === undefined ? { disabled } : { disabled, selected: active }}
      disabled={disabled}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size >= 44 ? radius.md : radius.sm },
        variant === 'filled' && { backgroundColor: colors.fill },
        variant === 'raised' && {
          backgroundColor: colors.surfaceRaised,
          boxShadow: elevation.raised,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Glyph
        size={size >= 44 ? iconSize.lg : iconSize.md}
        color={colors.textPrimary}
        weight={active ? 'fill' : 'regular'}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
