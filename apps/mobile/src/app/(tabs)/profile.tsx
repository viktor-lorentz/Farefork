import { APP_NAME } from '@repo/shared/brand';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import {
  ListGroup,
  listGroupIconInset,
  ListRow,
  ListRowIcon,
  PageTitle,
  Screen,
  SegmentedControl,
  Text,
  Toggle,
  type SegmentOption,
} from '@/design/components';
import {
  ArrowSquareOutIcon,
  BellIcon,
  MonitorIcon,
  MoonIcon,
  SealCheckIcon,
  SunIcon,
  UserCircleIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { iconSize, space } from '@/design/tokens';
import { usePreferences, type ThemePreference } from '@/stores/preferences';
import { useSession } from '@/stores/session';
import {
  type PushRegistration,
  registerForPushNotifications,
  unregisterPushNotifications,
} from '@/features/alerts/push';

const isWeb = process.env.EXPO_OS === 'web';

const PRIVACY_URL = 'https://github.com/viktor-lorentz/Farefork/blob/main/PRIVACY.md';

const pushResultNote: Record<PushRegistration, string> = {
  registered: 'On for this phone',
  unsupported: 'Not available in this build',
  unconfigured: 'Needs a development build with push set up',
  denied: 'Allow notifications in system settings',
  failed: 'Sign in, then try again',
};

const themeOptions: readonly SegmentOption<ThemePreference>[] = [
  { value: 'system', label: 'Auto', icon: MonitorIcon },
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const themePreference = usePreferences((state) => state.themePreference);
  const setThemePreference = usePreferences((state) => state.setThemePreference);
  const membershipCount = usePreferences((state) => state.membershipIds.length);
  const notificationPermission = usePreferences((state) => state.notificationPermission);
  const setNotificationPermission = usePreferences((state) => state.setNotificationPermission);
  const [pushNote, setPushNote] = useState('Notifications when a ride hits your price');
  const resetOnboarding = usePreferences((state) => state.resetOnboarding);
  const sessionStatus = useSession((state) => state.status);
  const email = useSession((state) => state.email);

  return (
    <Screen>
      <View style={styles.title}>
        <PageTitle title="Profile" />
      </View>

      <View style={styles.groups}>
        {sessionStatus !== 'unavailable' ? (
          <ListGroup>
            <ListRow
              title={sessionStatus === 'signedIn' ? (email ?? 'Account') : 'Sign in'}
              subtitle={
                sessionStatus === 'signedIn'
                  ? 'Savings, history and account'
                  : 'Save favorites and track what you save'
              }
              leading={<ListRowIcon icon={UserCircleIcon} />}
              chevron
              onPress={() => {
                router.push(sessionStatus === 'signedIn' ? '/account' : '/account/sign-in');
              }}
            />
          </ListGroup>
        ) : null}

        <ListGroup title="Settings" inset={listGroupIconInset}>
          <ListRow
            title="Memberships"
            subtitle={membershipCount > 0 ? `${membershipCount} active` : 'None added'}
            leading={<ListRowIcon icon={SealCheckIcon} />}
            chevron
            onPress={() => {
              router.push('/profile/memberships');
            }}
          />
          <ListRow
            title="Price alerts"
            subtitle={isWeb ? 'Hits show in Alerts. Notifications need the phone app.' : pushNote}
            leading={<ListRowIcon icon={BellIcon} />}
            chevron={isWeb}
            onPress={
              isWeb
                ? () => {
                    router.navigate('/alerts');
                  }
                : undefined
            }
            trailing={
              isWeb ? undefined : (
                <Toggle
                  value={notificationPermission === 'granted'}
                  accessibilityLabel="Price alert notifications"
                  onValueChange={(value) => {
                    if (!value) {
                      setNotificationPermission('denied');
                      setPushNote('Off on this phone');
                      void unregisterPushNotifications();
                      return;
                    }
                    void registerForPushNotifications().then((result) => {
                      setNotificationPermission(result === 'registered' ? 'granted' : 'denied');
                      setPushNote(pushResultNote[result]);
                    });
                  }}
                />
              )
            }
          />
        </ListGroup>

        <View style={styles.appearance}>
          <Text
            variant="label"
            tone="secondary"
            accessibilityRole="header"
            style={styles.appearanceTitle}
          >
            Appearance
          </Text>
          <SegmentedControl
            options={themeOptions}
            value={themePreference}
            onChange={setThemePreference}
            accessibilityLabel="Appearance"
          />
        </View>

        <ListGroup title="More">
          {__DEV__ ? (
            <ListRow
              title="Component gallery"
              chevron
              onPress={() => {
                router.push('/dev/components');
              }}
            />
          ) : null}
          <ListRow title="Replay onboarding" onPress={resetOnboarding} />
          <ListRow title="Version" value={Constants.expoConfig?.version ?? '0.0.0'} />
          <ListRow
            title="Privacy policy"
            trailing={
              <ArrowSquareOutIcon size={iconSize.sm} color={colors.textSecondary} weight="bold" />
            }
            accessibilityHint="Opens in your browser"
            onPress={() => {
              void Linking.openURL(PRIVACY_URL);
            }}
          />
        </ListGroup>
        <Text variant="caption" tone="tertiary" style={styles.footnote}>
          Prices in this build are simulated. {APP_NAME} is not affiliated with Uber, Lyft, Waymo,
          DoorDash, Grubhub or Postmates.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: space.md,
  },
  groups: {
    gap: space.lg,
  },
  appearance: {
    gap: space.xs,
  },
  appearanceTitle: {
    paddingHorizontal: space.md,
  },
  footnote: {
    paddingHorizontal: space.md,
  },
});
