import { StyleSheet, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { MinusIcon, PlusIcon } from '../icons';
import { useTheme } from '../theme';
import { controlHeight, radius } from '../tokens/spacing';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  label: string;
};

export function Stepper({ value, onChange, max = 99, label }: StepperProps) {
  const { colors } = useTheme();
  if (value === 0) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Add ${label}`}
        onPress={() => {
          haptics.selection();
          onChange(1);
        }}
        style={[styles.add, { backgroundColor: colors.fill }]}
      >
        <PlusIcon size={18} color={colors.textPrimary} weight="bold" />
      </PressableScale>
    );
  }
  return (
    <View
      style={[styles.group, { backgroundColor: colors.primary }]}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ now: value, min: 0, max }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment' && value < max) {
          onChange(value + 1);
        } else if (event.nativeEvent.actionName === 'decrement') {
          onChange(value - 1);
        }
      }}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={value === 1 ? `Remove ${label}` : `One less ${label}`}
        onPress={() => {
          haptics.selection();
          onChange(value - 1);
        }}
        style={styles.segment}
      >
        <MinusIcon size={16} color={colors.onPrimary} weight="bold" />
      </PressableScale>
      <Text variant="labelStrong" tabular style={[styles.value, { color: colors.onPrimary }]}>
        {value}
      </Text>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`One more ${label}`}
        disabled={value >= max}
        onPress={() => {
          haptics.selection();
          onChange(value + 1);
        }}
        style={[styles.segment, value >= max && styles.disabled]}
      >
        <PlusIcon size={16} color={colors.onPrimary} weight="bold" />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  add: {
    width: controlHeight.sm,
    height: controlHeight.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    height: controlHeight.sm,
    borderRadius: radius.sm,
  },
  segment: {
    width: controlHeight.sm,
    height: controlHeight.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 20,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
