import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { fontAssets } from '@/design/fonts';
import { BookingCheck } from '@/features/account/BookingCheck';
import { listenForAlertTaps } from '@/features/alerts/push';
import { ThemeProvider, useTheme } from '@/design/theme';
import { queryClient } from '@/lib/queryClient';
import { usePreferences, usePreferencesHydrated } from '@/stores/preferences';
import { startSessionSync } from '@/stores/session';

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { colors, scheme } = useTheme();
  const onboarded = usePreferences((state) => state.onboardingCompletedAt !== null);
  const router = useRouter();
  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    void listenForAlertTaps((alertId) => {
      router.push({ pathname: '/alerts', params: { open: alertId } });
    }).then((cleanup) => {
      if (cancelled) {
        cleanup();
      } else {
        stop = cleanup;
      }
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [router]);
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="onboarding/index" options={{ animation: 'fade' }} />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="rides/search" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="food/index" />
          <Stack.Screen name="food/[id]" />
          <Stack.Screen name="food/compare" />
          <Stack.Screen name="food/address" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="profile/memberships" />
          <Stack.Screen name="account/index" />
          <Stack.Screen name="account/history" />
          <Stack.Screen name="account/sign-in" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="alerts/new" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="dev/components" />
        </Stack.Protected>
      </Stack>
      {onboarded ? <BookingCheck /> : null}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const hydrated = usePreferencesHydrated();
  const ready = (fontsLoaded || fontError !== null) && hydrated;

  useEffect(() => startSessionSync(), []);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
