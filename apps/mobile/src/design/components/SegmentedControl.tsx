import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import type { Icon } from '../icons';
import { useTheme } from '../theme';
import { easing } from '../tokens/motion';
import { controlHeight, iconSize, radius, space } from '../tokens/spacing';
import { Text } from './Text';

const PADDING = space.xxs;

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: Icon;
};

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
  size?: 'md' | 'lg';
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  size = 'md',
}: SegmentedControlProps<T>) {
  const { colors, elevation, scheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const segmentWidth = options.length > 0 ? Math.max(0, (width - PADDING * 2) / options.length) : 0;
  const offset = useSharedValue(selectedIndex * segmentWidth);

  useEffect(() => {
    const target = selectedIndex * segmentWidth;
    offset.set(
      reducedMotion ? target : withTiming(target, { duration: 200, easing: easing.inOut }),
    );
  }, [selectedIndex, segmentWidth, reducedMotion, offset]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const height = size === 'lg' ? controlHeight.md : controlHeight.sm + space.xs;

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      onLayout={handleLayout}
      style={[styles.track, { backgroundColor: colors.fill, height }]}
    >
      {width > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: segmentWidth,
              backgroundColor: scheme === 'light' ? colors.surface : colors.fillStrong,
              boxShadow: scheme === 'light' ? elevation.raised : undefined,
            },
            indicatorStyle,
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        const Glyph = option.icon;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            onPress={() => {
              if (!selected) {
                haptics.selection();
                onChange(option.value);
              }
            }}
            hitSlop={space.xxs}
            style={styles.segment}
          >
            {Glyph ? (
              <Glyph
                size={iconSize.sm}
                color={selected ? colors.textPrimary : colors.textSecondary}
                weight={selected ? 'fill' : 'regular'}
              />
            ) : null}
            <Text variant="labelStrong" tone={selected ? 'primary' : 'secondary'} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: PADDING,
    borderRadius: radius.md,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: radius.sm,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
});
