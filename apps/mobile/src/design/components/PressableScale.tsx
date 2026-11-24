import type { ReactNode } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { duration, easing, pressScale } from '../tokens/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  scaleTo?: number;
};

export function PressableScale({
  style,
  children,
  scaleTo = pressScale,
  onPressIn,
  onPressOut,
  hitSlop = 8,
  pressRetentionOffset = 16,
  ...rest
}: PressableScaleProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const handlePressIn = (event: GestureResponderEvent) => {
    if (!reducedMotion) {
      scale.set(withTiming(scaleTo, { duration: duration.instant, easing: easing.out }));
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    scale.set(reducedMotion ? 1 : withTiming(1, { duration: duration.fast, easing: easing.out }));
    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      {...rest}
      hitSlop={hitSlop}
      pressRetentionOffset={pressRetentionOffset}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
