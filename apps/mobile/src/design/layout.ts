import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { breakpoints, layout, space } from './tokens/spacing';

export type Breakpoint = 'compact' | 'medium' | 'expanded';

export function breakpointForWidth(width: number): Breakpoint {
  if (width >= breakpoints.expanded) {
    return 'expanded';
  }
  if (width >= breakpoints.medium) {
    return 'medium';
  }
  return 'compact';
}

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return breakpointForWidth(width);
}

export function useIsDesktopLayout(): boolean {
  return useBreakpoint() === 'expanded';
}

export function floatingTabBarOffset(bottomInset: number): number {
  return Math.max(bottomInset, space.sm);
}

export function useTabBarClearance(): number {
  const insideTabs = useContext(BottomTabBarHeightContext) !== undefined;
  const desktop = useIsDesktopLayout();
  const insets = useSafeAreaInsets();
  if (!insideTabs || desktop) {
    return 0;
  }
  return floatingTabBarOffset(insets.bottom) + layout.tabBarHeight;
}
