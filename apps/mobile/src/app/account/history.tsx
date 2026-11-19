import { formatUsd, providerName, type ProviderId, providerIds } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, EmptyState, Screen, ScreenHeader, Skeleton, Text } from '@/design/components';
import { ReceiptIcon, WarningCircleIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { space } from '@/design/tokens';
import { useClearHistory, useHistory, useSavingsSummary } from '@/features/account/queries';
import { SavingsCard } from '@/features/account/SavingsCard';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import { useSession } from '@/stores/session';

function isProviderId(value: string): value is ProviderId {
  return (providerIds as readonly string[]).includes(value);
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const signedIn = useSession((state) => state.status === 'signedIn');
  const history = useHistory();
  const summary = useSavingsSummary();
  const clear = useClearHistory();
  const [confirmClear, setConfirmClear] = useState(false);
  const rows = history.data ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="History" large />
      <Screen padTop={false} contentStyle={styles.content}>
        {!signedIn ? (
          <EmptyState
            icon={ReceiptIcon}
            title="Sign in to keep a history"
            body="Every ride and order you open from here is saved, with what you saved."
            action={{
              label: 'Sign in',
              onPress: () => {
                router.push('/account/sign-in');
              },
            }}
          />
        ) : history.isPending ? (
          <View style={styles.loading}>
            <Skeleton height={120} />
            <Skeleton height={56} />
            <Skeleton height={56} />
          </View>
        ) : history.isError ? (
          <EmptyState
            icon={WarningCircleIcon}
            title="History didn’t load"
            body={history.error.message}
            action={{
              label: 'Try again',
              onPress: () => {
                void history.refetch();
              },
            }}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ReceiptIcon}
            title="Nothing yet"
            body="When you open Uber, Lyft or a delivery app from a comparison, it shows up here."
          />
        ) : (
          <>
            <SavingsCard summary={summary.data} />
            <View>
              {rows.map((row, index) => (
                <View
                  key={row.id}
                  style={[
                    styles.row,
                    index < rows.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  accessible
                  accessibilityLabel={[
                    row.title,
                    isProviderId(row.provider_id) ? providerName(row.provider_id) : null,
                    row.subtitle,
                    formatUsd(row.price_cents),
                    row.saved_cents + row.membership_saved_cents > 0
                      ? `saved ${formatUsd(row.saved_cents + row.membership_saved_cents)}`
                      : null,
                    shortDate(row.created_at),
                  ]
                    .filter(Boolean)
                    .join(', ')}
                >
                  {isProviderId(row.provider_id) ? (
                    <ProviderLogo providerId={row.provider_id} size={40} decorative />
                  ) : null}
                  <View style={styles.body}>
                    <Text variant="labelStrong" numberOfLines={1}>
                      {row.title}
                    </Text>
                    {row.subtitle !== null ? (
                      <Text variant="caption" tone="secondary" numberOfLines={1}>
                        {row.subtitle}
                      </Text>
                    ) : null}
                    <Text variant="caption" tone="tertiary">
                      {shortDate(row.created_at)}
                    </Text>
                  </View>
                  <View style={styles.price}>
                    <Text variant="priceS">{formatUsd(row.price_cents)}</Text>
                    {row.saved_cents + row.membership_saved_cents > 0 ? (
                      <Text variant="caption" tone="secondary" tabular>
                        saved {formatUsd(row.saved_cents + row.membership_saved_cents)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
            <Text variant="caption" tone="tertiary">
              This lists what you opened from Farefork. We can’t see whether you finished the order
              in the other app.
            </Text>
            {confirmClear ? (
              <View style={styles.confirm}>
                <Button
                  label="Clear all history"
                  variant="danger"
                  loading={clear.isPending}
                  fullWidth
                  onPress={() => {
                    clear.mutate(undefined, {
                      onSuccess: () => {
                        setConfirmClear(false);
                      },
                    });
                  }}
                />
                <Button
                  label="Cancel"
                  variant="secondary"
                  fullWidth
                  onPress={() => {
                    setConfirmClear(false);
                  }}
                />
              </View>
            ) : (
              <Button
                label="Clear history"
                variant="secondary"
                onPress={() => {
                  setConfirmClear(true);
                }}
              />
            )}
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: space.md },
  loading: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  body: { flex: 1, gap: 2 },
  price: { alignItems: 'flex-end', gap: 2 },
  confirm: { gap: space.xs },
});
