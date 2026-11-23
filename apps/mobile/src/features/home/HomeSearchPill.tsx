import type { Vertical } from '@repo/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AdaptiveGlass, PressableScale, Text } from '@/design/components';
import { MagnifyingGlassIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { controlHeight, iconSize, radius, space } from '@/design/tokens';
import { haptics } from '@/lib/haptics';

const copy: Record<Vertical, { label: string; hint: string; path: '/rides/search' | '/food' }> = {
  rides: {
    label: 'Where to?',
    hint: 'Search for a destination to compare ride prices',
    path: '/rides/search',
  },
  food: {
    label: 'Search restaurants',
    hint: 'Find a restaurant and compare delivery totals',
    path: '/food',
  },
};

export function HomeSearchPill({ vertical }: { vertical: Vertical }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { label, hint, path } = copy[vertical];
  return (
    <AdaptiveGlass interactive style={styles.glass}>
      <PressableScale
        accessibilityRole="search"
        accessibilityLabel={label}
        accessibilityHint={hint}
        onPress={() => {
          haptics.light();
          router.push(path);
        }}
        style={styles.pill}
      >
        <View style={[styles.icon, { backgroundColor: colors.accent }]}>
          <MagnifyingGlassIcon size={iconSize.md} color={colors.onAccent} weight="bold" />
        </View>
        <Text variant="titleS" numberOfLines={1} style={styles.label}>
          {label}
        </Text>
      </PressableScale>
    </AdaptiveGlass>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: radius.round,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: controlHeight.lg,
    paddingLeft: space.xs,
    paddingRight: space.md,
  },
  icon: {
    width: controlHeight.sm + space.xxs,
    height: controlHeight.sm + space.xxs,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
});
