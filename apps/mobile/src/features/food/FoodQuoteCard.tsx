import { type FoodQuote, formatUsd, providerName } from '@repo/shared';
import { Pressable, StyleSheet, View } from 'react-native';
import { Badge, Divider, Text } from '@/design/components';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { ProviderLogo } from '@/features/providers/ProviderLogo';

export type FoodQuoteCardProps = {
  quote: FoodQuote;
  inStoreSubtotalCents: number;
  bestPrice: boolean;
  selected: boolean;
  onPress: () => void;
};

function Line({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.line}>
      <Text variant={strong ? 'labelStrong' : 'caption'} tone={strong ? 'primary' : 'secondary'}>
        {label}
      </Text>
      <Text variant={strong ? 'priceS' : 'caption'} tone={strong ? 'primary' : 'secondary'} tabular>
        {value}
      </Text>
    </View>
  );
}

export function FoodQuoteCard({
  quote,
  inStoreSubtotalCents,
  bestPrice,
  selected,
  onPress,
}: FoodQuoteCardProps) {
  const { colors } = useTheme();
  const name = providerName(quote.providerId);
  const markup = quote.subtotalCents - inStoreSubtotalCents;
  const total = formatUsd(quote.totalBeforeTipCents);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, expanded: selected }}
      accessibilityLabel={[
        name,
        `${total} before tip`,
        bestPrice ? 'best price' : null,
        `about ${quote.etaMinutes} minutes`,
      ]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint={selected ? undefined : 'Shows the price breakdown'}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor: selected ? colors.primary : 'transparent' },
        pressed && { backgroundColor: colors.pressed },
      ]}
    >
      <View style={styles.header}>
        <ProviderLogo providerId={quote.providerId} size={40} decorative />
        <View style={styles.titles}>
          <Text variant="labelStrong">{name}</Text>
          <Text variant="caption" tone="secondary" tabular>
            About {quote.etaMinutes} min
          </Text>
        </View>
        <View style={styles.priceColumn}>
          <Text variant="priceM">{total}</Text>
          <Text variant="caption" tone="tertiary">
            before tip
          </Text>
          {bestPrice ? <Badge label="Best price" tone="accent" /> : null}
        </View>
      </View>
      {selected ? (
        <View style={styles.breakdown}>
          <Divider />
          <Line
            label={
              markup > 0
                ? `Menu items (+${formatUsd(markup)} vs in-store)`
                : 'Menu items (in-store prices)'
            }
            value={formatUsd(quote.subtotalCents)}
          />
          {quote.fees.map((fee) => (
            <Line key={fee.kind} label={fee.label} value={formatUsd(fee.amountCents)} />
          ))}
          <Line label="Estimated tax" value={formatUsd(quote.taxCents)} />
          <Line label="Total before tip" value={total} strong />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: radius.md,
    padding: space.sm,
    gap: space.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  titles: {
    flex: 1,
    gap: 2,
    paddingTop: 2,
  },
  priceColumn: {
    alignItems: 'flex-end',
    gap: 2,
  },
  breakdown: {
    gap: space.xs,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
  },
});
