import { APP_NAME } from '@repo/shared/brand';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@/design/components';
import { BellRingingIcon, NavigationArrowIcon, type Icon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { layout, radius, space } from '@/design/tokens';
import { duration } from '@/design/tokens/motion';
import { MembershipList } from '@/features/memberships/MembershipList';
import { useMembershipCatalog } from '@/features/memberships/useMembershipCatalog';
import { Wordmark } from '@/features/navigation/Wordmark';
import { haptics } from '@/lib/haptics';
import {
  notificationsSupported,
  requestLocationPermission,
  requestNotificationPermission,
} from '@/lib/permissions';
import { usePreferences } from '@/stores/preferences';
import { CompareIllustration, MembershipIllustration, TotalsIllustration } from './Illustrations';

type StepId = 'compare' | 'totals' | 'perks' | 'location' | 'notifications' | 'memberships';

const steps: readonly StepId[] = notificationsSupported
  ? ['compare', 'totals', 'perks', 'location', 'notifications', 'memberships']
  : ['compare', 'totals', 'perks', 'location', 'memberships'];

function Progress({ index }: { index: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={styles.progress}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: steps.length, now: index + 1 }}
    >
      {steps.map((step, position) => (
        <View
          key={step}
          style={[
            styles.progressSegment,
            { backgroundColor: position <= index ? colors.primary : colors.fillStrong },
          ]}
        />
      ))}
    </View>
  );
}

function Headline({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.headline}>
      <Text variant="display" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="bodyL" tone="secondary">
        {body}
      </Text>
    </View>
  );
}

function PermissionArt({ icon: Glyph }: { icon: Icon }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.permissionArt, { backgroundColor: colors.fill }]}>
      <Glyph size={space.xxl} color={colors.textPrimary} weight="fill" />
    </View>
  );
}

export function OnboardingFlow() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  useMembershipCatalog();
  const [busy, setBusy] = useState(false);
  const completeOnboarding = usePreferences((state) => state.completeOnboarding);
  const setLocationPermission = usePreferences((state) => state.setLocationPermission);
  const setNotificationPermission = usePreferences((state) => state.setNotificationPermission);
  const step = steps[index] ?? 'memberships';
  const isLast = index === steps.length - 1;

  const next = () => {
    if (isLast) {
      haptics.success();
      completeOnboarding();
      return;
    }
    setIndex((value) => Math.min(value + 1, steps.length - 1));
  };

  const runPermission = async (request: () => Promise<void>) => {
    setBusy(true);
    try {
      await request();
    } finally {
      setBusy(false);
      next();
    }
  };

  let content: ReactNode;
  let primary: { label: string; onPress: () => void };
  let secondary: { label: string; onPress: () => void } | null = null;

  switch (step) {
    case 'compare':
      content = (
        <>
          <Headline
            title="Compare Uber, Lyft and Waymo before you book."
            body="One trip, every price, sorted. Tap the one you want and finish booking in that app."
          />
          <CompareIllustration />
        </>
      );
      primary = { label: 'Continue', onPress: next };
      break;
    case 'totals':
      content = (
        <>
          <Headline
            title="See what delivery really costs."
            body="Delivery and service fees plus tax, added up per app. Prices are before tip."
          />
          <TotalsIllustration />
        </>
      );
      primary = { label: 'Continue', onPress: next };
      break;
    case 'perks':
      content = (
        <>
          <Headline
            title="Count the memberships you already pay for."
            body="Uber One, DashPass and the rest change the price. We apply them to every quote."
          />
          <MembershipIllustration />
        </>
      );
      primary = { label: 'Continue', onPress: next };
      break;
    case 'location':
      content = (
        <>
          <PermissionArt icon={NavigationArrowIcon} />
          <Headline
            title="Use your location for pickup."
            body="It stays on your phone and is never sold. You can type an address instead."
          />
        </>
      );
      primary = {
        label: 'Allow location',
        onPress: () => {
          void runPermission(async () => {
            setLocationPermission(await requestLocationPermission());
          });
        },
      };
      secondary = { label: 'Not now', onPress: next };
      break;
    case 'notifications':
      content = (
        <>
          <PermissionArt icon={BellRingingIcon} />
          <Headline
            title="Get told when a price drops."
            body="One notification when a route you watch hits your price. Nothing else."
          />
        </>
      );
      primary = {
        label: 'Turn on alerts',
        onPress: () => {
          void runPermission(async () => {
            setNotificationPermission(await requestNotificationPermission());
          });
        },
      };
      secondary = { label: 'Not now', onPress: next };
      break;
    case 'memberships':
      content = (
        <>
          <Headline
            title="Which do you have?"
            body="Skip any you don’t. You can change these later in Profile."
          />
          <MembershipList />
        </>
      );
      primary = { label: `Start using ${APP_NAME}`, onPress: next };
      break;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.top}>
        <View style={styles.topRow}>
          <Wordmark />
          {!isLast ? (
            <Button
              label="Skip"
              variant="tertiary"
              size="sm"
              haptic={false}
              onPress={() => {
                setIndex(steps.length - 1);
              }}
            />
          ) : null}
        </View>
        <Progress index={index} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={step}
          entering={FadeIn.duration(duration.slow)}
          exiting={FadeOut.duration(duration.fast)}
          style={styles.step}
        >
          {content}
        </Animated.View>
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        <Button label={primary.label} onPress={primary.onPress} loading={busy} fullWidth />
        {secondary ? (
          <Button
            label={secondary.label}
            onPress={secondary.onPress}
            variant="tertiary"
            disabled={busy}
            fullWidth
            haptic={false}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  top: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter,
    paddingTop: space.xs,
    gap: space.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  progress: {
    flexDirection: 'row',
    gap: space.xxs,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter,
    paddingTop: space.xl,
    paddingBottom: space.lg,
  },
  step: {
    gap: space.xl,
  },
  headline: {
    gap: space.sm,
  },
  permissionArt: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter,
    paddingTop: space.sm,
    gap: space.xxs,
  },
});
