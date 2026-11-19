import { Easing } from 'react-native-reanimated';

export const duration = {
  instant: 90,
  fast: 150,
  base: 220,
  slow: 320,
} as const;

export const easing = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  decelerate: Easing.bezier(0, 0, 0, 1),
  accelerate: Easing.bezier(0.3, 0, 1, 1),
} as const;

export const springs = {
  snappy: { damping: 26, stiffness: 320, mass: 1 },
  gentle: { damping: 30, stiffness: 190, mass: 1 },
} as const;

export const pressScale = 0.97;
