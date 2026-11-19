import { formatUsd } from '@repo/shared';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LightningIcon, type Icon } from '../icons';
import { useTheme } from '../theme';
import { radius, space } from '../tokens/spacing';
import { Badge } from './Badge';
import { Skeleton } from './Skeleton';
import { Text } from './Text';

export type QuoteCardNote = {
  icon?: Icon;
  text: string;
};

export type QuoteCardProps = {
  logo: ReactNode;
  title: string;
  meta?: string;
  detail?: string;
  priceCents: number;
  originalPriceCents?: number;
  bestPrice?: boolean;
  surgeLabel?: string;
  note?: QuoteCardNote;
  selected?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
};

export function QuoteCard({
  logo,
  title,
  meta,
  detail,
  priceCents,
  originalPriceCents,
  bestPrice = false,
  surgeLabel,
  note,
  selected = false,
  onPress,
  accessibilityHint,
}: QuoteCardProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  const price = formatUsd(priceCents);
  const showOriginal = originalPriceCents !== undefined && originalPriceCents > priceCents;
  const NoteIcon = note?.icon;

  const accessibilityLabel = [
    title,
    price,
    bestPrice ? 'best price' : null,
    showOriginal ? `was ${formatUsd(originalPriceCents)}` : null,
    detail,
    surgeLabel,
    note?.text,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      onHoverIn={() => {
        setHovered(true);
      }}
      onHoverOut={() => {
        setHovered(false);
      }}
      style={({ pressed }) => [
        styles.card,
        { borderColor: selected ? colors.primary : 'transparent' },
        (pressed || hovered) && { backgroundColor: colors.pressed },
      ]}
    >
      <View style={styles.logo}>{logo}</View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="labelStrong" numberOfLines={1} style={styles.shrink}>
            {title}
          </Text>
          {meta !== undefined ? (
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
        {detail !== undefined ? (
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
        {surgeLabel !== undefined || note !== undefined ? (
          <View style={styles.noteRow}>
            {surgeLabel !== undefined ? (
              <Badge label={surgeLabel} tone="danger" icon={LightningIcon} />
            ) : null}
            {note !== undefined ? (
              <View style={styles.note}>
                {NoteIcon ? <NoteIcon size={14} color={colors.textPrimary} weight="fill" /> : null}
                <Text variant="caption" numberOfLines={1}>
                  {note.text}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={styles.priceColumn}>
        <Text variant="priceM" numberOfLines={1}>
          {price}
        </Text>
        {showOriginal ? (
          <Text variant="caption" tone="tertiary" tabular strikethrough numberOfLines={1}>
            {formatUsd(originalPriceCents)}
          </Text>
        ) : null}
        {bestPrice ? <Badge label="Best price" tone="accent" /> : null}
      </View>
    </Pressable>
  );
}

export function QuoteCardSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Loading price" accessible>
      <Skeleton width={40} height={40} radius={10} />
      <View style={styles.body}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="80%" height={12} />
      </View>
      <View style={styles.priceColumn}>
        <Skeleton width={64} height={18} />
      </View>
    </View>
  );
}

export type QuoteCardUnavailableProps = {
  logo: ReactNode;
  title: string;
  reason: string;
};

export function QuoteCardUnavailable({ logo, title, reason }: QuoteCardUnavailableProps) {
  return (
    <View
      style={[styles.card, styles.unavailable]}
      accessible
      accessibilityLabel={`${title}, unavailable. ${reason}`}
    >
      <View style={styles.logo}>{logo}</View>
      <View style={styles.body}>
        <Text variant="labelStrong" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={2}>
          {reason}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 76,
  },
  logo: {
    alignSelf: 'flex-start',
    paddingTop: 2,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.xs,
  },
  shrink: {
    flexShrink: 1,
  },
  noteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: space.sm,
    rowGap: space.xxs,
    marginTop: 2,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
  },
  priceColumn: {
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    gap: space.xxs,
    paddingTop: 2,
  },
  unavailable: {
    opacity: 0.55,
  },
});
