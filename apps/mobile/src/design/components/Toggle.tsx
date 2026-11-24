import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { useTheme } from '../theme';
import { duration, easing } from '../tokens/motion';

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 26;
const THUMB_INSET = (TRACK_HEIGHT - THUMB_SIZE) / 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;

export type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

export function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
  disabled = false,
}: ToggleProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(value ? 1 : 0);
  const offTrack = colors.fillStrong;
  const onTrack = colors.primary;
  const onThumb = colors.onPrimary;

  useEffect(() => {
    const target = value ? 1 : 0;
    progress.set(
      reducedMotion ? target : withTiming(target, { duration: duration.fast, easing: easing.out }),
    );
  }, [value, reducedMotion, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [offTrack, onTrack]),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#FFFFFF', onThumb]),
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        haptics.selection();
        onValueChange(!value);
      }}
      style={disabled && styles.disabled}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: THUMB_INSET,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.25)',
  },
  disabled: {
    opacity: 0.4,
  },
});
