import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { Text } from '@/design/components';
import { layout, skyInk, skyPalettes, space } from '@/design/tokens';
import { Wordmark } from '@/features/navigation/Wordmark';
import { Skyline } from '@/features/scene/Skyline';
import { useSkyPhase } from '@/features/scene/useSkyPhase';
import { greetingFor } from './greeting';

export type SkyHeaderProps = {
  height: number;
  paddingTop: number;
  paddingHorizontal: number;
  scrollY?: SharedValue<number>;
  showWordmark?: boolean;
  children?: ReactNode;
};

export function SkyHeader({
  height,
  paddingTop,
  paddingHorizontal,
  scrollY,
  showWordmark = true,
  children,
}: SkyHeaderProps) {
  const { phase, dayPart } = useSkyPhase();
  const ink = skyInk[skyPalettes[phase].ink];
  return (
    <View style={[styles.root, { height, paddingTop, paddingHorizontal }]}>
      <Skyline
        phase={phase}
        scrollY={scrollY}
        cityHeight={Math.round(height * layout.skylineCityRatio)}
        style={StyleSheet.absoluteFill}
      />
      {showWordmark ? <Wordmark color={ink.primary} /> : null}
      <Text variant="titleXL" accessibilityRole="header" style={{ color: ink.primary }}>
        {greetingFor(dayPart)}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space.lg,
  },
});
