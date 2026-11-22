import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export { useReducedMotion as useReduceMotion } from 'react-native-reanimated';

export function useReduceTransparency(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (process.env.EXPO_OS !== 'ios') {
      return;
    }
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (active) {
        setEnabled(value);
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setEnabled,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}
