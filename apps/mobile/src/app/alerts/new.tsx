import { formatUsd, MIN_ALERT_CENTS, suggestedTargetCents } from '@repo/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Chip, IconButton, Screen, ScreenHeader, Text } from '@/design/components';
import { MinusIcon, PlusIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { easProjectId } from '@/features/alerts/push';
import { useCreateAlert } from '@/features/alerts/queries';
import { usePreferences } from '@/stores/preferences';
import { useSession } from '@/stores/session';
import { useTrip } from '@/stores/trip';

const STEP_CENTS = 50;
const presets = [5, 10, 20] as const;

export default function NewAlertScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ cheapest?: string }>();
  const cheapest = Number(params.cheapest ?? '0');
  const pickup = useTrip((state) => state.pickup);
  const dropoff = useTrip((state) => state.dropoff);
  const membershipIds = usePreferences((state) => state.membershipIds);
  const status = useSession((state) => state.status);
  const create = useCreateAlert();
  const [target, setTarget] = useState(() =>
    cheapest > 0 ? suggestedTargetCents(cheapest) : 1500,
  );

  const pushNote =
    Platform.OS === 'web' || easProjectId() === null
      ? 'When it hits, it shows up in Alerts. Push notifications come with the phone app.'
      : 'When it hits, we’ll send a notification and pause the alert.';

  if (!pickup || !dropoff) {
    return (
      <Screen>
        <ScreenHeader title="Price alert" />
        <Text variant="body" tone="secondary">
          Pick a pickup and destination first.
        </Text>
      </Screen>
    );
  }

  const title = `${pickup.name} to ${dropoff.name}`;

  return (
    <Screen contentStyle={styles.content}>
      <ScreenHeader title="Price alert" />
      <View style={styles.block}>
        <Text variant="caption" tone="secondary">
          Route
        </Text>
        <Text variant="titleS">{title}</Text>
        {cheapest > 0 ? (
          <Text variant="body" tone="secondary">
            Cheapest right now: {formatUsd(cheapest)} before tip
          </Text>
        ) : null}
      </View>
      <View style={[styles.picker, { backgroundColor: colors.fill }]}>
        <Text variant="caption" tone="secondary">
          Tell me when any ride is at or under
        </Text>
        <View style={styles.priceRow}>
          <IconButton
            icon={MinusIcon}
            accessibilityLabel="Lower the target by 50 cents"
            disabled={target <= MIN_ALERT_CENTS}
            onPress={() => {
              setTarget((value) => Math.max(MIN_ALERT_CENTS, value - STEP_CENTS));
            }}
          />
          <Text
            variant="display"
            tabular
            accessibilityRole="adjustable"
            accessibilityLabel={`Target ${formatUsd(target)}`}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(event) => {
              setTarget((value) =>
                event.nativeEvent.actionName === 'increment'
                  ? value + STEP_CENTS
                  : Math.max(MIN_ALERT_CENTS, value - STEP_CENTS),
              );
            }}
          >
            {formatUsd(target)}
          </Text>
          <IconButton
            icon={PlusIcon}
            accessibilityLabel="Raise the target by 50 cents"
            onPress={() => {
              setTarget((value) => value + STEP_CENTS);
            }}
          />
        </View>
        {cheapest > 0 ? (
          <View style={styles.presets}>
            {presets.map((percent) => {
              const value = Math.max(
                MIN_ALERT_CENTS,
                Math.floor((cheapest * (100 - percent)) / 100 / STEP_CENTS) * STEP_CENTS,
              );
              return (
                <Chip
                  key={percent}
                  label={`${percent}% less`}
                  selected={target === value}
                  onPress={() => {
                    setTarget(value);
                  }}
                />
              );
            })}
          </View>
        ) : null}
      </View>
      <Text variant="caption" tone="secondary">
        {pushNote} Alerts end after 7 days. Prices are simulated, before tip.
      </Text>
      {create.isError ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {create.error.message}
        </Text>
      ) : null}
      {status === 'signedIn' ? (
        <Button
          label="Set alert"
          loading={create.isPending}
          onPress={() => {
            create.mutate(
              {
                pickup: {
                  name: pickup.name,
                  latitude: pickup.latitude,
                  longitude: pickup.longitude,
                },
                dropoff: {
                  name: dropoff.name,
                  latitude: dropoff.latitude,
                  longitude: dropoff.longitude,
                },
                title,
                targetCents: target,
                membershipIds,
              },
              {
                onSuccess: () => {
                  router.replace('/alerts');
                },
              },
            );
          }}
        />
      ) : (
        <Button
          label="Sign in to set alerts"
          onPress={() => {
            router.push('/account/sign-in');
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  block: { gap: space.xxs },
  picker: { borderRadius: radius.lg, padding: space.lg, gap: space.md, alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  presets: { flexDirection: 'row', gap: space.xs, flexWrap: 'wrap', justifyContent: 'center' },
});
