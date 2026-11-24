import { Easing } from 'react-native-reanimated';

export const duration = { instant: 120, fast: 160, base: 220, slow: 280, scene: 900 } as const;

export const easing = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  sheet: Easing.bezier(0.32, 0.72, 0, 1),
} as const;

export const springs = {
  settle: { duration: 400, dampingRatio: 1 },
  snap: { duration: 400, dampingRatio: 0.8 },
  sheet: { duration: 300, dampingRatio: 0.8 },
} as const;

export const pressScale = 0.97;
