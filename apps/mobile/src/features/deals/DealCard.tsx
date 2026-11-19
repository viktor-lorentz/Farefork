import { type Deal, formatUsd, providerName } from '@repo/shared';
import { StyleSheet, View } from 'react-native';
import { Badge, PressableScale, Text } from '@/design/components';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { ProviderLogo } from '@/features/providers/ProviderLogo';

const weekday = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

export function dealConditions(deal: Deal): string[] {
  const conditions: string[] = [];
  if (deal.minSubtotalCents !== null) {
    conditions.push(`${formatUsd(deal.minSubtotalCents)} minimum`);
  }
  if (deal.newCustomersOnly) {
    conditions.push('New customers');
  }
  if (deal.membershipName !== null) {
    conditions.push(`${deal.membershipName} members`);
  }
  conditions.push(`Ends ${weekday.format(new Date(deal.expiresAt))}`);
  return conditions;
}

export function DealCard({ deal, onPress }: { deal: Deal; onPress: () => void }) {
  const { colors } = useTheme();
  const conditions = dealConditions(deal);
  const name = providerName(deal.providerId);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}: ${deal.title}. ${deal.detail} ${conditions.join(', ')}.${deal.eligible ? '' : ` Needs ${deal.membershipName ?? 'a membership'}.`}`}
      accessibilityHint={deal.kind === 'ride' ? 'Compares ride prices' : 'Opens food delivery'}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        !deal.eligible && styles.ineligible,
      ]}
    >
      <View style={styles.top}>
        <ProviderLogo providerId={deal.providerId} size={40} decorative />
        <View style={styles.text}>
          <Text variant="caption" tone="secondary">
            {name}
          </Text>
          <Text variant="bodyStrong">{deal.title}</Text>
        </View>
        {deal.eligible ? (
          <Badge label={`Save ~${formatUsd(deal.estimatedSavingsCents)}`} tone="accent" />
        ) : (
          <Badge label={`Needs ${deal.membershipName ?? 'membership'}`} tone="outline" />
        )}
      </View>
      <Text variant="caption" tone="secondary">
        {deal.detail} {conditions.join(' · ')}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
    gap: space.sm,
  },
  ineligible: { opacity: 0.7 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  text: { flex: 1, gap: 2 },
});
