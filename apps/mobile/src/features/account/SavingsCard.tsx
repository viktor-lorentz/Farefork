import { formatUsd, type SavingsSummary } from '@repo/shared';
import { StyleSheet, View } from 'react-native';
import { Skeleton, Text } from '@/design/components';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';

export function SavingsCard({ summary }: { summary: SavingsSummary | undefined }) {
  const { colors } = useTheme();
  if (!summary) {
    return (
      <View style={[styles.card, { backgroundColor: colors.fill }]}>
        <Skeleton width="40%" height={14} />
        <Skeleton width="55%" height={34} />
        <Skeleton width="80%" height={12} />
      </View>
    );
  }
  const monthTotal = summary.saved_this_month_cents + summary.membership_saved_this_month_cents;
  const allTime = summary.saved_cents + summary.membership_saved_cents;
  return (
    <View
      style={[styles.card, { backgroundColor: colors.fill }]}
      accessible
      accessibilityLabel={`Saved ${formatUsd(monthTotal)} this month, ${formatUsd(allTime)} in total`}
    >
      <Text variant="caption" tone="secondary">
        Saved this month
      </Text>
      <Text variant="priceXL">{formatUsd(monthTotal)}</Text>
      <View style={styles.rows}>
        <View style={styles.row}>
          <Text variant="caption" tone="secondary">
            By picking the cheaper app
          </Text>
          <Text variant="captionStrong" tabular>
            {formatUsd(summary.saved_this_month_cents)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text variant="caption" tone="secondary">
            From your memberships
          </Text>
          <Text variant="captionStrong" tabular>
            {formatUsd(summary.membership_saved_this_month_cents)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text variant="caption" tone="secondary">
            All time, {summary.handoff_count} {summary.handoff_count === 1 ? 'order' : 'orders'}
          </Text>
          <Text variant="captionStrong" tabular>
            {formatUsd(allTime)}
          </Text>
        </View>
      </View>
      <Text variant="caption" tone="tertiary">
        Savings compare the price you chose with the average of the other apps for the same ride
        class or order. Prices in this build are simulated.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.md, gap: space.xs },
  rows: { gap: space.xxs, marginVertical: space.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
});
