import { useEffect, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useReduceMotion } from '@/design/a11y';
import { skyPalettes, type SkyPhase } from '@/design/tokens';
import { duration } from '@/design/tokens/motion';
import {
  layerGeometry,
  litWindowPaths,
  SKYLINE_HEIGHT,
  SKYLINE_WIDTH,
  starPath,
} from './skylineGeometry';

const viewBox = `0 0 ${SKYLINE_WIDTH} ${SKYLINE_HEIGHT}`;
const geometry = {
  far: layerGeometry('far'),
  mid: layerGeometry('mid'),
  near: layerGeometry('near'),
};
const stars = starPath(46);
const parallax = { far: 0.55, mid: 0.32, near: 0.1 } as const;
const starOpacity: Record<SkyPhase, number> = { day: 0, golden: 0, dusk: 0.35, night: 0.8 };

export type SkylineProps = {
  phase: SkyPhase;
  scrollY?: SharedValue<number>;
  cityHeight?: number;
  style?: StyleProp<ViewStyle>;
};

function useParallax(scrollY: SharedValue<number> | undefined, factor: number) {
  return useAnimatedStyle(() => {
    const offset = scrollY ? scrollY.value : 0;
    return { transform: [{ translateY: offset > 0 ? offset * factor : 0 }] };
  });
}

function Layer({ children, fill = false }: { children: React.ReactNode; fill?: boolean }) {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={viewBox}
      preserveAspectRatio={fill ? 'none' : 'xMidYMax slice'}
      style={StyleSheet.absoluteFill}
    >
      {children}
    </Svg>
  );
}

function useFlicker(enabled: boolean) {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (!enabled || reduceMotion) {
      opacity.set(1);
      return;
    }
    opacity.set(
      withRepeat(
        withSequence(
          withDelay(2600, withTiming(0.2, { duration: duration.instant })),
          withTiming(1, { duration: duration.fast }),
          withTiming(0.35, { duration: duration.instant }),
          withTiming(1, { duration: duration.base }),
        ),
        -1,
      ),
    );
  }, [enabled, reduceMotion, opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

export function Skyline({ phase, scrollY, cityHeight, style }: SkylineProps) {
  const palette = skyPalettes[phase];
  const near = useMemo(
    () => litWindowPaths(geometry.near.windows, palette.windowsLit),
    [palette.windowsLit],
  );
  const mid = useMemo(
    () => litWindowPaths(geometry.mid.windows, palette.windowsLit * 0.8),
    [palette.windowsLit],
  );
  const farStyle = useParallax(scrollY, parallax.far);
  const midStyle = useParallax(scrollY, parallax.mid);
  const nearStyle = useParallax(scrollY, parallax.near);
  const flickerStyle = useFlicker(near.flicker.length > 0);

  return (
    <View
      style={[styles.root, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Layer fill>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.top} />
            <Stop offset="1" stopColor={palette.bottom} />
          </LinearGradient>
        </Defs>
        <Rect width={SKYLINE_WIDTH} height={SKYLINE_HEIGHT} fill="url(#sky)" />
        <Path d={stars} fill={palette.window} opacity={starOpacity[phase]} />
      </Layer>
      <View
        style={
          cityHeight !== undefined ? [styles.city, { height: cityHeight }] : StyleSheet.absoluteFill
        }
      >
        <Animated.View style={[StyleSheet.absoluteFill, farStyle]}>
          <Layer>
            <Path d={geometry.far.silhouette} fill={palette.far} />
          </Layer>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, midStyle]}>
          <Layer>
            <Path d={geometry.mid.silhouette} fill={palette.mid} />
            <Path d={mid.steady + mid.flicker} fill={palette.window} opacity={0.55} />
          </Layer>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, nearStyle]}>
          <Layer>
            <Path d={geometry.near.silhouette} fill={palette.near} />
            <Path d={near.steady} fill={palette.window} />
          </Layer>
          <Animated.View style={[StyleSheet.absoluteFill, flickerStyle]}>
            <Layer>
              <Path d={near.flicker} fill={palette.window} />
            </Layer>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  city: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
