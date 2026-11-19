import { StyleSheet } from 'react-native';
import { haptics } from '@/lib/haptics';
import type { Icon } from '../icons';
import { useTheme } from '../theme';
import { controlHeight, radius, space } from '../tokens/spacing';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type ChipRole = 'checkbox' | 'radio' | 'button';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: Icon;
  count?: number;
  role?: ChipRole;
  disabled?: boolean;
};

export function Chip({
  label,
  selected = false,
  onPress,
  icon: Glyph,
  count,
  role = 'checkbox',
  disabled = false,
}: ChipProps) {
  const { colors } = useTheme();
  const foreground = selected ? colors.onPrimary : colors.textPrimary;
  const isToggle = role !== 'button';
  return (
    <PressableScale
      accessibilityRole={role}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      accessibilityState={isToggle ? { checked: selected, disabled } : { disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      style={[
        styles.base,
        { backgroundColor: selected ? colors.primary : colors.fill },
        disabled && styles.disabled,
      ]}
    >
      {Glyph ? <Glyph size={16} color={foreground} weight={selected ? 'bold' : 'regular'} /> : null}
      <Text variant="label" style={{ color: foreground }} numberOfLines={1}>
        {label}
      </Text>
      {count !== undefined ? (
        <Text variant="caption" tabular style={{ color: foreground, opacity: 0.7 }}>
          {count}
        </Text>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: controlHeight.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
  },
  disabled: {
    opacity: 0.4,
  },
});
