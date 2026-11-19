import { useWindowDimensions } from 'react-native';
import { breakpoints } from './tokens/spacing';

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
