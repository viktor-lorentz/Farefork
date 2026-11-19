import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LatLng } from '@repo/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type LocationState = {
  lastKnown: LatLng | null;
  setLastKnown: (point: LatLng) => void;
};

function rounded(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export const useDeviceLocation = create<LocationState>()(
  persist(
    (set) => ({
      lastKnown: null,
      setLastKnown: (point) => {
        set({ lastKnown: point });
      },
    }),
    {
      name: 'app.location',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastKnown: state.lastKnown
          ? {
              latitude: rounded(state.lastKnown.latitude),
              longitude: rounded(state.lastKnown.longitude),
            }
          : null,
      }),
    },
  ),
);
