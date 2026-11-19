import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';
export type PermissionState = 'unknown' | 'granted' | 'denied';

type PreferencesState = {
  themePreference: ThemePreference;
  onboardingCompletedAt: string | null;
  membershipIds: string[];
  locationPermission: PermissionState;
  notificationPermission: PermissionState;
};

type PreferencesActions = {
  setThemePreference: (preference: ThemePreference) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setMembership: (programId: string, enabled: boolean) => void;
  setLocationPermission: (state: PermissionState) => void;
  setNotificationPermission: (state: PermissionState) => void;
};

export const usePreferences = create<PreferencesState & PreferencesActions>()(
  persist(
    (set) => ({
      themePreference: 'system',
      onboardingCompletedAt: null,
      membershipIds: [],
      locationPermission: 'unknown',
      notificationPermission: 'unknown',
      setThemePreference: (themePreference) => {
        set({ themePreference });
      },
      completeOnboarding: () => {
        set({ onboardingCompletedAt: new Date().toISOString() });
      },
      resetOnboarding: () => {
        set({ onboardingCompletedAt: null });
      },
      setMembership: (programId, enabled) => {
        set((state) => {
          const others = state.membershipIds.filter((id) => id !== programId);
          return { membershipIds: enabled ? [...others, programId] : others };
        });
      },
      setLocationPermission: (locationPermission) => {
        set({ locationPermission });
      },
      setNotificationPermission: (notificationPermission) => {
        set({ notificationPermission });
      },
    }),
    {
      name: 'app.preferences',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PreferencesState => ({
        themePreference: state.themePreference,
        onboardingCompletedAt: state.onboardingCompletedAt,
        membershipIds: state.membershipIds,
        locationPermission: state.locationPermission,
        notificationPermission: state.notificationPermission,
      }),
    },
  ),
);

function subscribeHydration(onChange: () => void): () => void {
  const unsubscribeStart = usePreferences.persist.onHydrate(onChange);
  const unsubscribeFinish = usePreferences.persist.onFinishHydration(onChange);
  return () => {
    unsubscribeStart();
    unsubscribeFinish();
  };
}

function readHydration(): boolean {
  return usePreferences.persist.hasHydrated();
}

export function usePreferencesHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, readHydration, readHydration);
}
