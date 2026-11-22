import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { Text } from '@/design/components';
import { useReduceMotion } from '@/design/a11y';
import { useTheme } from '@/design/theme';
import { duration } from '@/design/tokens/motion';
import { space } from '@/design/tokens';

const DASH = 10;
const DASH_GAP = 8;
const PERIOD = DASH + DASH_GAP;

const body =
  'M7 24h50a4 4 0 0 0 4-4v-4.2a3 3 0 0 0-2.3-2.9L48 10.4l-5.6-5.2A4 4 0 0 0 39.7 4H24.6a4 4 0 0 0-3 1.3L15.2 12 6.6 13.4A3 3 0 0 0 4 16.4V21a3 3 0 0 0 3 3Z';
const glass = 'M23.4 7h7.4v5.2H18.3ZM33.6 7h5.6a2 2 0 0 1 1.4.6l4.4 4.6H33.6Z';

export function CarLoader({ label }: { label?: string }) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const road = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      road.set(0);
      bob.set(0);
      return;
    }
    road.set(
      withRepeat(withTiming(-PERIOD, { duration: duration.slow, easing: Easing.linear }), -1),
    );
    bob.set(
      withRepeat(
        withSequence(
          withTiming(-1, { duration: duration.fast }),
          withTiming(0, { duration: duration.fast }),
        ),
        -1,
      ),
    );
  }, [reduceMotion, road, bob]);

  const roadStyle = useAnimatedStyle(() => ({ transform: [{ translateX: road.value }] }));
  const carStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
    >
      <View style={styles.stage}>
        <Animated.View style={carStyle}>
          <Svg width={104} height={32} viewBox="0 0 104 32">
            <Defs>
              <LinearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.accent} stopOpacity={0.55} />
                <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Path d="M61 15.5 104 9v14Z" fill="url(#beam)" />
            <Path d={body} fill={colors.primary} />
            <Path d={glass} fill={colors.background} opacity={0.85} />
            <Path d="M58 14.6h3v2.4h-3Z" fill={colors.accent} />
            <Path d="M4 16.8h2v2.4H4Z" fill={colors.surge} />
            <Circle cx={18} cy={24} r={5} fill={colors.primary} />
            <Circle cx={18} cy={24} r={2} fill={colors.background} />
            <Circle cx={47} cy={24} r={5} fill={colors.primary} />
            <Circle cx={47} cy={24} r={2} fill={colors.background} />
          </Svg>
        </Animated.View>
        <View style={styles.roadClip}>
          <Animated.View style={[styles.road, roadStyle]}>
            <Svg width="100%" height={2}>
              <Line
                x1="0"
                y1="1"
                x2="100%"
                y2="1"
                stroke={colors.borderStrong}
                strokeWidth={2}
                strokeDasharray={`${DASH} ${DASH_GAP}`}
              />
            </Svg>
          </Animated.View>
        </View>
      </View>
      {label ? (
        <Text variant="caption" tone="secondary" align="center">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
  },
  stage: {
    width: 180,
    alignItems: 'center',
    gap: space.xxs,
  },
  roadClip: {
    width: '100%',
    height: 2,
    overflow: 'hidden',
  },
  road: {
    width: 180 + PERIOD,
    height: 2,
  },
});
