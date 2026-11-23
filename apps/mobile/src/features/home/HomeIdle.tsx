import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/design/theme';
import { controlHeight, layout, space } from '@/design/tokens';
import { HomePanel } from './HomePanel';
import { HomeSearchPill } from './HomeSearchPill';
import { SkyHeader } from './SkyHeader';
import { useVertical } from './useVertical';

const PILL_OVERLAP = controlHeight.lg / 2;

export function HomeIdle({ variant = 'screen' }: { variant?: 'screen' | 'panel' }) {
  const panel = variant === 'panel';
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const vertical = useVertical((state) => state.vertical);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={{ backgroundColor: panel ? colors.surface : colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <SkyHeader
        height={panel ? layout.skyHeaderCompact : layout.skyHeader + insets.top}
        paddingTop={panel ? layout.gutterWide - space.xs : insets.top + space.sm}
        paddingHorizontal={panel ? layout.gutterWide - space.xs : layout.margin}
        scrollY={scrollY}
        showWordmark={!panel}
      />
      <View style={[styles.pill, panel ? styles.panelInset : null]}>
        <HomeSearchPill vertical={vertical} />
      </View>
      <View style={[styles.body, panel ? styles.panelInset : null]}>
        <HomePanel />
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: space.xxl,
  },
  pill: {
    marginTop: -PILL_OVERLAP,
    paddingHorizontal: layout.gutter,
  },
  panelInset: {
    paddingHorizontal: layout.gutterWide - space.xs,
  },
  body: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.lg,
  },
});
