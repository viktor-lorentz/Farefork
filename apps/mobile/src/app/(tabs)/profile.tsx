import { APP_NAME } from '@repo/shared/brand';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  ListRow,
  ListRowIcon,
  Screen,
  SectionHeader,
  SegmentedControl,
  Text,
  Toggle,
  type SegmentOption,
} from '@/design/components';
import {
  ArrowsDownUpIcon,
  BellIcon,
  CodeIcon,
  InfoIcon,
  MonitorIcon,
  MoonIcon,
  SealCheckIcon,
  SunIcon,
  UserCircleIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { usePreferences, type ThemePreference } from '@/stores/preferences';
import { useSession } from '@/stores/session';

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
  const resetOnboarding = usePreferences((state) => state.resetOnboarding);
  const sessionStatus = useSession((state) => state.status);
  const email = useSession((state) => state.session?.user.email ?? null);

  return (
    <Screen>
      <Text variant="titleXL" accessibilityRole="header" style={styles.title}>
        Profile
      </Text>

      {sessionStatus !== 'unavailable' ? (
        <View
          style={[
            styles.group,
            styles.accountGroup,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
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
        </View>
      ) : null}

      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ListRow
          title="Memberships"
          subtitle={membershipCount > 0 ? `${membershipCount} active` : 'None added'}
          leading={<ListRowIcon icon={SealCheckIcon} />}
          chevron
          onPress={() => {
            router.push('/profile/memberships');
          }}
          divider
        />
        <ListRow
          title="Price alerts"
          subtitle="Push notifications for drops"
          leading={<ListRowIcon icon={BellIcon} />}
          trailing={
            <Toggle
              value={notificationPermission === 'granted'}
              accessibilityLabel="Price alert notifications"
              onValueChange={(value) => {
                setNotificationPermission(value ? 'granted' : 'denied');
              }}
            />
          }
        />
      </View>

      <SectionHeader title="Appearance" style={styles.section} />
      <SegmentedControl
        options={themeOptions}
        value={themePreference}
        onChange={setThemePreference}
        accessibilityLabel="Appearance"
      />

      <SectionHeader title="More" style={styles.section} />
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ListRow
          title="Component gallery"
          subtitle="Design system reference"
          leading={<ListRowIcon icon={CodeIcon} />}
          chevron
          onPress={() => {
            router.push('/dev/components');
          }}
          divider
        />
        <ListRow
          title="Replay onboarding"
          leading={<ListRowIcon icon={ArrowsDownUpIcon} />}
          onPress={resetOnboarding}
          divider
        />
        <ListRow
          title={`About ${APP_NAME}`}
          value={`v${Constants.expoConfig?.version ?? '0.0.0'}`}
          leading={<ListRowIcon icon={InfoIcon} />}
        />
      </View>
      <Text variant="caption" tone="tertiary" style={styles.footnote}>
        Prices in this build are simulated. {APP_NAME} is not affiliated with Uber, Lyft, Waymo,
        DoorDash, Grubhub or Postmates.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  accountGroup: {
    marginBottom: space.md,
  },
  title: {
    marginBottom: space.lg,
  },
  section: {
    marginTop: space.xl,
    marginBottom: space.xs,
  },
  group: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  footnote: {
    marginTop: space.lg,
  },
});
