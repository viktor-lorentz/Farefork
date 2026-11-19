import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptics = {
  selection(): void {
    if (supported) {
      void Haptics.selectionAsync();
    }
  },
  light(): void {
    if (supported) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  medium(): void {
    if (supported) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  success(): void {
    if (supported) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  warning(): void {
    if (supported) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
};

export type HapticKind = keyof typeof haptics;
