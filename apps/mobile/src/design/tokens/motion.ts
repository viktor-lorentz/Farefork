import { Easing } from 'react-native-reanimated';

export const duration = {
  instant: 90,
  fast: 150,
  base: 250,
  slow: 350,
  scene: 900,
} as const;

export const easing = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  decelerate: Easing.bezier(0, 0, 0, 1),
  accelerate: Easing.bezier(0.3, 0, 1, 1),
} as const;

export const springs = {
  snappy: { damping: 24, stiffness: 340, mass: 0.9 },
  gentle: { damping: 22, stiffness: 190, mass: 1 },
  bouncy: { damping: 14, stiffness: 260, mass: 0.9 },
} as const;

export const pressScale = 0.97;
