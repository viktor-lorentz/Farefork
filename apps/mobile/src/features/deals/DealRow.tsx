import { type Deal, formatUsd, providerName } from '@repo/shared';
import { StyleSheet, View } from 'react-native';
import { PressableScale, QUOTE_LOGO_SIZE, Text } from '@/design/components';
import { space } from '@/design/tokens';
import { ProviderLogo } from '@/features/providers/ProviderLogo';

const weekday = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

export const DEAL_ROW_INSET = QUOTE_LOGO_SIZE + space.sm;

export function dealConditions(deal: Deal): string[] {
  const conditions: string[] = [];
  if (deal.minSubtotalCents !== null) {
    conditions.push(`${formatUsd(deal.minSubtotalCents)} min`);
  }
  if (deal.newCustomersOnly) {
    conditions.push('new customers');
  }
  conditions.push(`ends ${weekday.format(new Date(deal.expiresAt))}`);
  return conditions;
}

export function DealRow({ deal, onPress }: { deal: Deal; onPress: () => void }) {
  const conditions = dealConditions(deal);
  const name = providerName(deal.providerId);
  const locked = !deal.eligible;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}: ${deal.title}. ${deal.detail} ${conditions.join(', ')}.${locked ? ` Needs ${deal.membershipName ?? 'a membership'}.` : ` Saves about ${formatUsd(deal.estimatedSavingsCents)}.`}`}
      accessibilityHint={deal.kind === 'ride' ? 'Compares ride prices' : 'Opens food delivery'}
      style={styles.row}
    >
      <ProviderLogo providerId={deal.providerId} size={QUOTE_LOGO_SIZE} decorative />
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {deal.title}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={2}>
          {name} · {conditions.join(' · ')}
        </Text>
        {locked ? (
          <Text variant="caption" tone="tertiary">
            Needs {deal.membershipName ?? 'a membership'}
          </Text>
        ) : null}
      </View>
      <Text
        variant="bodyStrong"
        tone={locked ? 'tertiary' : 'savings'}
        tabular
        style={styles.amount}
      >
        −{formatUsd(deal.estimatedSavingsCents)}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    paddingVertical: space.sm,
  },
  text: { flex: 1, gap: space.xxs / 2 },
  amount: { paddingTop: space.xxs / 2 },
});
