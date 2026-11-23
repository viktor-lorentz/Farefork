import { alertStatus, type PriceAlertRow } from '@repo/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  EmptyState,
  IconButton,
  ListRow,
  ListRowIcon,
  PageTitle,
  RowSkeleton,
  Screen,
  SectionHeader,
  Text,
} from '@/design/components';
import {
  ArrowsClockwiseIcon,
  BellIcon,
  BellRingingIcon,
  TrashIcon,
  WarningCircleIcon,
} from '@/design/icons';
import { controlHeight, space } from '@/design/tokens';
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
                    size={controlHeight.sm}
                    accessibilityLabel={`Watch ${alert.title} again for 7 days`}
                    onPress={() => {
                      resume.mutate({ id: alert.id });
                    }}
                  />
                ) : null}
                <IconButton
                  icon={TrashIcon}
                  size={controlHeight.sm}
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

function alertsMeta(watching: number, hits: number): string | null {
  if (watching === 0 && hits === 0) {
    return null;
  }
  const parts = [`${watching} watching`];
  if (hits > 0) {
    parts.push(`${hits} ${hits === 1 ? 'hit' : 'hits'}`);
  }
  return parts.join(' · ');
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
      <PageTitle title="Alerts" meta={alertsMeta(watching.length, hits.length)} />
      {status === 'unavailable' ? (
        <EmptyState
          icon={BellRingingIcon}
          title="Alerts are off in this build"
          body="You can still compare prices. Alerts come back when accounts are switched on."
        />
      ) : status === 'loading' || (status === 'signedIn' && alerts.isPending) ? (
        <RowSkeleton count={2} />
      ) : status === 'signedOut' ? (
        <EmptyState
          icon={BellRingingIcon}
          title="Sign in to set price alerts"
          body="Pick a route and a price. Farefork checks every 15 minutes and pings you when a ride gets there."
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
          <Text variant="caption" tone="tertiary">
            {process.env.EXPO_OS === 'web'
              ? 'Hits show up here. The phone app also sends a notification.'
              : 'Alerts end after 7 days or once they hit.'}
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
});
