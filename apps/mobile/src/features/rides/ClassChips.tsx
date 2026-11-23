import { rideClasses, rideClassLabels, type RideClass } from '@repo/shared';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Chip } from '@/design/components';
import { useTheme } from '@/design/theme';
import { layout, space } from '@/design/tokens';
import type { ClassFilter } from './quoteSorting';

export type ClassChipsProps = {
  present: ReadonlySet<RideClass>;
  value: ClassFilter;
  onChange: (value: ClassFilter) => void;
};

function FadeEdge() {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" style={styles.fade}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="chipFade" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.surface} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.surface} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#chipFade)" />
      </Svg>
    </View>
  );
}

export function ClassChips({ present, value, onChange }: ClassChipsProps) {
  const options: { value: ClassFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    ...rideClasses
      .filter((rideClass) => present.has(rideClass))
      .map((rideClass) => ({ value: rideClass, label: rideClassLabels[rideClass] })),
  ];
  return (
    <View style={styles.rail}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="radiogroup"
        contentContainerStyle={styles.content}
        style={styles.scroller}
      >
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            role="radio"
            selected={value === option.value}
            onPress={() => {
              onChange(option.value);
            }}
          />
        ))}
      </ScrollView>
      <FadeEdge />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    marginHorizontal: -layout.gutter,
  },
  scroller: {
    flexGrow: 0,
  },
  content: {
    gap: space.xs,
    paddingHorizontal: layout.gutter,
    paddingVertical: space.xxs,
  },
  fade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: space.xxl,
  },
});
