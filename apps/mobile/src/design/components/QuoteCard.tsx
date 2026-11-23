import { formatUsd } from '@repo/shared';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LightningIcon, type Icon } from '../icons';
import { useTheme } from '../theme';
import { controlHeight, iconSize, radius, space } from '../tokens/spacing';
import { Badge } from './Badge';
import { PressableScale } from './PressableScale';
import { Skeleton } from './Skeleton';
import { Text } from './Text';

export const QUOTE_LOGO_SIZE = space.xxl;

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
    <PressableScale
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
      style={[
        styles.row,
        selected && { backgroundColor: colors.fill },
        hovered && !selected && { backgroundColor: colors.pressed },
      ]}
    >
      <View style={styles.logo}>{logo}</View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="labelStrong" numberOfLines={1} style={styles.shrink}>
            {title}
          </Text>
          {meta !== undefined ? (
            <Text variant="caption" tone="tertiary" numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
          {surgeLabel !== undefined ? (
            <Badge label={surgeLabel} tone="surge" icon={LightningIcon} />
          ) : null}
        </View>
        {detail !== undefined ? (
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
        {note !== undefined ? (
          <View style={styles.note}>
            {NoteIcon ? (
              <NoteIcon size={iconSize.xs} color={colors.textSecondary} weight="fill" />
            ) : null}
            <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.shrink}>
              {note.text}
            </Text>
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
    </PressableScale>
  );
}

export function QuoteCardSkeleton() {
  return (
    <View style={styles.row} accessibilityLabel="Loading price" accessible>
      <Skeleton width={QUOTE_LOGO_SIZE} height={QUOTE_LOGO_SIZE} radius={radius.md} />
      <View style={styles.body}>
        <Skeleton width="55%" height={space.md - space.xxs / 2} />
        <Skeleton width="80%" height={space.sm} />
      </View>
      <View style={styles.priceColumn}>
        <Skeleton width={space.huge} height={space.md + space.xxs / 2} />
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
      style={[styles.row, styles.unavailable]}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.sm - space.xxs,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    minHeight: controlHeight.lg + space.xs,
  },
  logo: {
    alignSelf: 'center',
  },
  body: {
    flex: 1,
    gap: space.xxs / 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs - space.xxs / 2,
  },
  shrink: {
    flexShrink: 1,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
  },
  priceColumn: {
    alignItems: 'flex-end',
    gap: space.xxs / 2,
  },
  unavailable: {
    opacity: 0.6,
  },
});
