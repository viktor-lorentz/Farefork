import { alertStatus, type PriceAlertRow } from '@repo/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  Badge,
  EmptyState,
  IconButton,
  ListRow,
  ListRowIcon,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
} from '@/design/components';
import {
  ArrowsClockwiseIcon,
  BellIcon,
  BellRingingIcon,
  TrashIcon,
  WarningCircleIcon,
} from '@/design/icons';
import { space } from '@/design/tokens';
import { alertPlace, alertSubtitle } from '@/features/alerts/format';
import { useAlerts, useDeleteAlert, useResumeAlert } from '@/features/alerts/queries';
import { useSession } from '@/stores/session';
import { useTrip } from '@/stores/trip';

function useOpenAlert() {
  const router = useRouter();
  const setTrip = useTrip((state) => state.setTrip);
  return (alert: PriceAlertRow) => {
    setTrip(alertPlace(alert.pickup, 'pickup'), alertPlace(alert.dropoff, 'dropoff'));
    router.navigate('/');
  };
}

function AlertList({ title, rows }: { title: string; rows: PriceAlertRow[] }) {
  const open = useOpenAlert();
  const remove = useDeleteAlert();
  const resume = useResumeAlert();
  const now = new Date();
  if (rows.length === 0) {
    return null;
  }
  return (
    <View>
      <SectionHeader title={title} />
      {rows.map((alert, index) => {
        const status = alertStatus(alert, now);
        return (
          <ListRow
            key={alert.id}
            title={alert.title}
            subtitle={alertSubtitle(alert, now)}
            leading={<ListRowIcon icon={status === 'triggered' ? BellRingingIcon : BellIcon} />}
            accessibilityHint="Compares ride prices for this route"
            divider={index < rows.length - 1}
            onPress={() => {
              open(alert);
            }}
            trailing={
              <View style={styles.actions}>
                {status === 'triggered' ? <Badge label="Hit" tone="accent" /> : null}
                {status !== 'watching' ? (
                  <IconButton
                    icon={ArrowsClockwiseIcon}
                    size={36}
                    accessibilityLabel={`Watch ${alert.title} again for 7 days`}
                    onPress={() => {
                      resume.mutate({ id: alert.id });
                    }}
                  />
                ) : null}
                <IconButton
                  icon={TrashIcon}
                  size={36}
                  accessibilityLabel={`Delete the alert for ${alert.title}`}
                  onPress={() => {
                    remove.mutate(alert.id);
                  }}
                />
              </View>
            }
          />
        );
      })}
    </View>
  );
}

export default function AlertsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ open?: string }>();
  const status = useSession((state) => state.status);
  const alerts = useAlerts();
  const open = useOpenAlert();
  const opened = useRef<string | null>(null);
  const rows = alerts.data ?? [];
  const now = new Date();
  const hits = rows.filter((row) => alertStatus(row, now) === 'triggered');
  const watching = rows.filter((row) => alertStatus(row, now) === 'watching');
  const ended = rows.filter((row) => {
    const value = alertStatus(row, now);
    return value === 'expired' || value === 'paused';
  });

  useEffect(() => {
    const target = params.open;
    if (target === undefined || opened.current === target) {
      return;
    }
    const alert = alerts.data?.find((row) => row.id === target);
    if (alert) {
      opened.current = target;
      open(alert);
    }
  }, [params.open, alerts.data, open]);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="titleXL" accessibilityRole="header">
          Alerts
        </Text>
        <Text variant="body" tone="secondary">
          We check your routes every 15 minutes and tell you when a ride hits your price.
        </Text>
      </View>
      {status === 'unavailable' ? (
        <EmptyState
          icon={BellRingingIcon}
          title="Accounts aren’t set up"
          body="Add your Supabase URL and key to apps/mobile/.env to use price alerts."
        />
      ) : status === 'loading' || (status === 'signedIn' && alerts.isPending) ? (
        <View style={styles.loading}>
          <Skeleton height={56} />
          <Skeleton height={56} />
        </View>
      ) : status === 'signedOut' ? (
        <EmptyState
          icon={BellRingingIcon}
          title="Sign in to set price alerts"
          body="Pick a route and a price. We’ll watch every app and tell you when a ride gets there."
          action={{
            label: 'Sign in',
            onPress: () => {
              router.push('/account/sign-in');
            },
          }}
        />
      ) : alerts.isError ? (
        <EmptyState
          icon={WarningCircleIcon}
          title="Alerts didn’t load"
          body={alerts.error.message}
          action={{
            label: 'Try again',
            onPress: () => {
              void alerts.refetch();
            },
          }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BellRingingIcon}
          title="No alerts yet"
          body="Compare a ride, then tap “Alert me when it drops” under the prices."
          action={{
            label: 'Compare a ride',
            onPress: () => {
              router.push('/rides/search');
            },
          }}
        />
      ) : (
        <>
          <AlertList title="Hit your price" rows={hits} />
          <AlertList title="Watching" rows={watching} />
          <AlertList title="Ended" rows={ended} />
          <Text variant="caption" tone="secondary">
            {Platform.OS === 'web'
              ? 'Hits show up here. The phone app also sends a notification.'
              : 'Alerts end after 7 days or once they hit, so you don’t get repeat pings. Prices are simulated.'}
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  header: { gap: space.xxs },
  loading: { gap: space.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
});
