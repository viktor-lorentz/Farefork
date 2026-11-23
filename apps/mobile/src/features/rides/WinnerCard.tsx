import { formatUsd, providerName, type RideQuote } from '@repo/shared';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Badge, PressableScale, Text, type QuoteCardNote } from '@/design/components';
import { LightningIcon, PiggyBankIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { iconSize, radius, space } from '@/design/tokens';
import { springs } from '@/design/tokens/motion';
import { haptics } from '@/lib/haptics';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import type { RivalSavings } from './quoteSorting';

export type WinnerCardProps = {
  quote: RideQuote;
  chip: string;
  detail: string;
  savings: RivalSavings | null;
  surgeLabel?: string;
  note?: QuoteCardNote;
  selected: boolean;
  onPress: () => void;
};

const entering = FadeInDown.springify()
  .damping(springs.bouncy.damping)
  .stiffness(springs.bouncy.stiffness)
  .mass(springs.bouncy.mass);

export function WinnerCard({
  quote,
  chip,
  detail,
  savings,
  surgeLabel,
  note,
  selected,
  onPress,
}: WinnerCardProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  const price = formatUsd(quote.priceCents);
  const savingsText = savings
    ? `${formatUsd(savings.cents)} less than ${providerName(savings.providerId)}`
    : null;
  const NoteIcon = note?.icon;

  useEffect(() => {
    haptics.success();
  }, [quote.id]);

  return (
    <Animated.View entering={entering}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={[chip, quote.productName, price, savingsText, detail, surgeLabel]
          .filter(Boolean)
          .join(', ')}
        accessibilityHint={`Select ${providerName(quote.providerId)} ${quote.productName}`}
        accessibilityState={{ selected }}
        onPress={onPress}
        onHoverIn={() => {
          setHovered(true);
        }}
        onHoverOut={() => {
          setHovered(false);
        }}
        style={[
          styles.card,
          {
            backgroundColor: colors.accentSoft,
            borderColor: selected || hovered ? colors.accent : colors.border,
          },
        ]}
      >
        <View style={styles.header}>
          <ProviderLogo providerId={quote.providerId} size={48} decorative />
          <View style={styles.identity}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {quote.productName}
            </Text>
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {detail}
            </Text>
          </View>
          <Badge label={chip} tone="accent" />
        </View>
        <View style={styles.priceRow}>
          <Text variant="priceXL" numberOfLines={1} style={styles.price}>
            {price}
          </Text>
          <Text variant="caption" tone="secondary">
            before tip
          </Text>
          {surgeLabel !== undefined ? (
            <Badge label={surgeLabel} tone="surge" icon={LightningIcon} />
          ) : null}
        </View>
        {savingsText !== null ? (
          <View style={styles.line}>
            <PiggyBankIcon size={iconSize.sm} color={colors.savingsText} weight="bold" />
            <Text variant="captionStrong" tone="savings" numberOfLines={1}>
              {savingsText}
            </Text>
          </View>
        ) : null}
        {note !== undefined ? (
          <View style={styles.line}>
            {NoteIcon ? (
              <NoteIcon size={iconSize.sm} color={colors.textSecondary} weight="fill" />
            ) : null}
            <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.shrink}>
              {note.text}
            </Text>
          </View>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.xs,
    padding: space.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  identity: {
    flex: 1,
    gap: space.xxs / 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.xxs,
  },
  price: {
    flexShrink: 1,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
  },
  shrink: {
    flexShrink: 1,
  },
});
