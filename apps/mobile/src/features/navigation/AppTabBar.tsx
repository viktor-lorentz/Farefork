import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { AdaptiveGlass, Text } from '@/design/components';
import { floatingTabBarOffset, useIsDesktopLayout } from '@/design/layout';
import { useTheme } from '@/design/theme';
import { iconSize, layout, radius, space } from '@/design/tokens';
import { easing, springs } from '@/design/tokens/motion';
import { haptics } from '@/lib/haptics';
import { tabConfig, type TabConfig } from './tabs';
import { Wordmark } from './Wordmark';

const ROW_PADDING = space.xxs;
const ROW_GAP = space.xxs;
const LENS_SCALE = 1.14;
const STRETCH_LIMIT = 0.22;

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
  const reducedMotion = useReducedMotion();
  const [rowWidth, setRowWidth] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const visible = state.routes
    .map((route, index) => ({ route, index, tab: tabConfig(route.name) }))
    .filter((item): item is typeof item & { tab: TabConfig } => item.tab !== undefined);

  const count = visible.length;
  const focusedPosition = Math.max(
    0,
    visible.findIndex((item) => item.index === state.index),
  );
  const itemWidth =
    count > 0 ? Math.max(0, (rowWidth - ROW_PADDING * 2 - ROW_GAP * (count - 1)) / count) : 0;
  const step = itemWidth + ROW_GAP;

  const offset = useSharedValue(focusedPosition * step);
  const lens = useSharedValue(0);
  const stretch = useSharedValue(0);
  const hover = useSharedValue(focusedPosition);
  const geometry = useSharedValue({ itemWidth, step, count });

  useEffect(() => {
    geometry.set({ itemWidth, step, count });
  }, [geometry, itemWidth, step, count]);

  useEffect(() => {
    const target = focusedPosition * step;
    hover.set(focusedPosition);
    offset.set(
      reducedMotion ? target : withTiming(target, { duration: 200, easing: easing.inOut }),
    );
  }, [focusedPosition, step, reducedMotion, offset, hover]);

  const selectPosition = (position: number) => {
    const item = visible[position];
    if (!item) {
      return;
    }
    const event = emitter.emit({
      type: 'tabPress',
      target: item.route.key,
      canPreventDefault: true,
    });
    if (item.index !== state.index && !event.defaultPrevented) {
      haptics.selection();
      navigateToTab(item.route.key);
    }
  };

  const previewPosition = (position: number | null) => {
    if (position !== null) {
      haptics.selection();
    }
    setDragIndex(position);
  };

  const finishDrag = (position: number) => {
    setDragIndex(null);
    selectPosition(position);
  };

  const pan = usePanGesture({
    enabled: !desktop && rowWidth > 0,
    activeOffsetX: [-6, 6],
    onActivate: (event) => {
      'worklet';
      lens.set(reducedMotion ? 1 : withSpring(1, springs.snap));
      const { itemWidth: width, step: gap, count: total } = geometry.get();
      const max = gap * (total - 1);
      offset.set(Math.min(Math.max(event.x - ROW_PADDING - width / 2, 0), max));
      scheduleOnRN(previewPosition, hover.get());
    },
    onUpdate: (event) => {
      'worklet';
      const { itemWidth: width, step: gap, count: total } = geometry.get();
      const max = gap * (total - 1);
      const raw = event.x - ROW_PADDING - width / 2;
      const clamped = Math.min(Math.max(raw, 0), max);
      const overshoot = raw - clamped;
      offset.set(clamped + overshoot * 0.15);
      stretch.set(Math.min(Math.abs(event.velocityX) / 4000, STRETCH_LIMIT));
      const position = gap > 0 ? Math.round(clamped / gap) : 0;
      if (position !== hover.get()) {
        hover.set(position);
        scheduleOnRN(previewPosition, position);
      }
    },
    onDeactivate: () => {
      'worklet';
      const { step: gap } = geometry.get();
      const position = hover.get();
      offset.set(reducedMotion ? position * gap : withSpring(position * gap, springs.snap));
      lens.set(reducedMotion ? 0 : withSpring(0, springs.settle));
      stretch.set(reducedMotion ? 0 : withSpring(0, springs.settle));
      scheduleOnRN(finishDrag, position);
    },
  });

  const pillStyle = useAnimatedStyle(() => {
    const grow = interpolate(lens.get(), [0, 1], [1, LENS_SCALE]);
    return {
      transform: [
        { translateX: offset.get() },
        { scaleX: grow + stretch.get() },
        { scaleY: grow - stretch.get() * 0.35 },
      ],
    };
  });

  const lensStyle = useAnimatedStyle(() => ({
    opacity: lens.get(),
  }));

  const activePosition = dragIndex ?? focusedPosition;

  const items = visible.map(({ route, tab }, position) => (
    <TabItem
      key={route.key}
      tab={tab}
      desktop={desktop}
      focused={position === activePosition}
      position={position + 1}
      total={count}
      onPress={() => {
        selectPosition(position);
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

  const handleLayout = (event: LayoutChangeEvent) => {
    setRowWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.mobileDock, { bottom: floatingTabBarOffset(insets.bottom) }]}
    >
      <AdaptiveGlass interactive style={styles.mobileBar}>
        <GestureDetector gesture={pan}>
          <View role="tablist" style={styles.mobileRow} onLayout={handleLayout}>
            {rowWidth > 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[styles.pill, { width: itemWidth, backgroundColor: colors.fill }, pillStyle]}
              >
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    styles.lens,
                    { borderColor: colors.border, backgroundColor: colors.fillStrong },
                    lensStyle,
                  ]}
                />
              </Animated.View>
            ) : null}
            {items}
          </View>
        </GestureDetector>
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
    padding: ROW_PADDING,
    gap: ROW_GAP,
  },
  pill: {
    position: 'absolute',
    top: ROW_PADDING,
    bottom: ROW_PADDING,
    left: ROW_PADDING,
    borderRadius: radius.round,
    borderCurve: 'continuous',
  },
  lens: {
    borderRadius: radius.round,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
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
