import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AdaptiveGlass, Text } from '@/design/components';
import { floatingTabBarOffset, useIsDesktopLayout } from '@/design/layout';
import { useTheme } from '@/design/theme';
import { iconSize, layout, radius, space } from '@/design/tokens';
import { haptics } from '@/lib/haptics';
import { tabConfig, type TabConfig } from './tabs';
import { Wordmark } from './Wordmark';

type TabItemProps = {
  tab: TabConfig;
  focused: boolean;
  desktop: boolean;
  onPress: () => void;
  position: number;
  total: number;
};

function TabItem({ tab, focused, desktop, onPress, position, total }: TabItemProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  const Glyph = tab.icon;
  const color = focused ? colors.textPrimary : colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={`${tab.title}, tab, ${position} of ${total}`}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      onHoverIn={() => {
        setHovered(true);
      }}
      onHoverOut={() => {
        setHovered(false);
      }}
      style={[
        desktop ? styles.desktopItem : styles.mobileItem,
        desktop && (focused || hovered) && { backgroundColor: colors.fill },
        !desktop && focused && { backgroundColor: colors.fill },
      ]}
    >
      <Glyph
        size={desktop ? iconSize.md : iconSize.lg}
        color={color}
        weight={focused ? 'fill' : 'regular'}
      />
      <Text
        variant={desktop ? 'labelStrong' : 'micro'}
        style={[{ color }, !desktop && styles.mobileLabel]}
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
      >
        {tab.title}
      </Text>
    </Pressable>
  );
}

export function AppTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const desktop = useIsDesktopLayout();
  const visible = state.routes
    .map((route, index) => ({ route, index, tab: tabConfig(route.name) }))
    .filter((item): item is typeof item & { tab: TabConfig } => item.tab !== undefined);

  const items = visible.map(({ route, index, tab }, position) => (
    <TabItem
      key={route.key}
      tab={tab}
      desktop={desktop}
      focused={index === state.index}
      position={position + 1}
      total={visible.length}
      onPress={() => {
        const event = emitter.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (index !== state.index && !event.defaultPrevented) {
          haptics.selection();
          navigateToTab(route.key);
        }
      }}
    />
  ));

  if (desktop) {
    return (
      <View
        style={[
          styles.desktopBar,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Wordmark />
        <View role="tablist" style={styles.desktopTabs}>
          {items}
        </View>
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.mobileDock, { bottom: floatingTabBarOffset(insets.bottom) }]}
    >
      <AdaptiveGlass interactive style={styles.mobileBar}>
        <View role="tablist" style={styles.mobileRow}>
          {items}
        </View>
      </AdaptiveGlass>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileDock: {
    position: 'absolute',
    left: layout.gutter,
    right: layout.gutter,
    alignItems: 'center',
  },
  mobileBar: {
    width: '100%',
    maxWidth: layout.panelWidth,
    height: layout.tabBarHeight,
    borderRadius: radius.round,
    borderCurve: 'continuous',
  },
  mobileRow: {
    flex: 1,
    flexDirection: 'row',
    padding: space.xxs,
    gap: space.xxs,
  },
  mobileItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderRadius: radius.round,
    borderCurve: 'continuous',
  },
  mobileLabel: {
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  desktopBar: {
    height: layout.topBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xl,
    paddingHorizontal: layout.gutterWide,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  desktopTabs: {
    flexDirection: 'row',
    gap: space.xxs,
  },
  desktopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: 40,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
  },
});
