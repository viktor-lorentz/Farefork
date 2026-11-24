import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { easing } from '../tokens/motion';
import { radius as radii } from '../tokens/spacing';

export type SkeletonProps = {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = '100%', height, radius = radii.sm, style }: SkeletonProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 0.8 : 0.55);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    opacity.set(withRepeat(withTiming(1, { duration: 850, easing: easing.inOut }), -1, true));
    return () => {
      cancelAnimation(opacity);
    };
  }, [reducedMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.skeleton },
        animatedStyle,
        style,
      ]}
    />
  );
}
