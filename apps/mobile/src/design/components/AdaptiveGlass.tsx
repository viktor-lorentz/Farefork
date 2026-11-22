import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReduceTransparency } from '../a11y';
import { useTheme } from '../theme';

const liquidGlass =
  process.env.EXPO_OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

const blurAvailable = process.env.EXPO_OS === 'ios';

export type AdaptiveGlassProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  pointerEvents?: 'auto' | 'box-none' | 'none' | 'box-only';
  testID?: string;
};

export function AdaptiveGlass({
  children,
  style,
  interactive = false,
  pointerEvents,
  testID,
}: AdaptiveGlassProps) {
  const { colors, elevation, scheme } = useTheme();
  const reduceTransparency = useReduceTransparency();

  if (liquidGlass && !reduceTransparency) {
    return (
      <GlassView
        testID={testID}
        pointerEvents={pointerEvents}
        glassEffectStyle="regular"
        colorScheme={scheme}
        isInteractive={interactive}
        style={style}
      >
        {children}
      </GlassView>
    );
  }

  if (blurAvailable && !reduceTransparency) {
    return (
      <BlurView
        testID={testID}
        pointerEvents={pointerEvents}
        intensity={80}
        tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        style={[styles.clip, { boxShadow: elevation.raised }, style]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      testID={testID}
      pointerEvents={pointerEvents}
      style={[
        styles.solid,
        {
          backgroundColor: reduceTransparency ? colors.surface : colors.glassFallback,
          borderColor: colors.border,
          boxShadow: elevation.raised,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  solid: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
