import { formatUsd } from '@repo/shared';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@/design/components';
import { useTheme } from '@/design/theme';
import { layout, radius, space } from '@/design/tokens';
import { haptics } from '@/lib/haptics';
import { isPendingFresh, usePendingHandoff } from '@/stores/pendingHandoff';
import { useSession } from '@/stores/session';
import { useConfirmHandoff } from './queries';

const SHOW_AFTER_MS = 4000;

export function BookingCheck() {
  const { colors, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const pending = usePendingHandoff((state) => state.pending);
  const clearPending = usePendingHandoff((state) => state.clearPending);
  const signedIn = useSession((state) => state.status === 'signedIn');
  const confirm = useConfirmHandoff();
  const [now, setNow] = useState(() => Date.now());

  const waitMs = pending ? Date.parse(pending.openedAt) + SHOW_AFTER_MS - now : 0;

  useEffect(() => {
    if (waitMs <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, waitMs);
    return () => {
      clearTimeout(timer);
    };
  }, [waitMs]);

  useEffect(() => {
    if (pending && !isPendingFresh(pending, new Date(now))) {
      clearPending();
    }
  }, [pending, now, clearPending]);

  if (!pending || !signedIn || waitMs > 0 || !isPendingFresh(pending, new Date(now))) {
    return null;
  }

  const { handoff, appName } = pending;
  const what = handoff.kind === 'ride' ? `${handoff.title} ride` : `order from ${handoff.title}`;

  return (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      style={[styles.wrap, { top: insets.top + space.xs }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceRaised,
            borderColor: colors.border,
            boxShadow: elevation.raised,
          },
        ]}
        accessibilityRole="alert"
      >
        <Text variant="labelStrong">Did you book it in {appName}?</Text>
        <Text variant="caption" tone="secondary">
          The {what}, {formatUsd(handoff.price_cents)} before tip. Only bookings you confirm go into
          your history and savings.
        </Text>
        {confirm.isError ? (
          <Text variant="caption" tone="secondary">
            {confirm.error.message}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button
            label="Yes, I booked it"
            size="md"
            loading={confirm.isPending}
            style={styles.flex}
            onPress={() => {
              haptics.success();
              confirm.mutate(handoff);
            }}
          />
          <Button
            label="No"
            size="md"
            variant="secondary"
            disabled={confirm.isPending}
            style={styles.flex}
            onPress={() => {
              clearPending();
            }}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: layout.gutter,
    right: layout.gutter,
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
    gap: space.xs,
  },
  actions: { flexDirection: 'row', gap: space.xs, marginTop: space.xs },
  flex: { flex: 1 },
});
