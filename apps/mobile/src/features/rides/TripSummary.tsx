import type { Place } from '@repo/shared';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text } from '@/design/components';
import { XIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { controlHeight, radius, space } from '@/design/tokens';

export type TripSummaryProps = {
  pickup: Place;
  dropoff: Place;
  onEdit: () => void;
  onClear: () => void;
  trailing?: ReactNode;
};

function Stop({ kind, place }: { kind: 'pickup' | 'dropoff'; place: Place }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stop}>
      <View style={styles.markerColumn}>
        <View
          style={
            kind === 'pickup'
              ? [styles.pickupDot, { borderColor: colors.primary }]
              : [styles.dropoffDot, { backgroundColor: colors.primary }]
          }
        />
      </View>
      <Text variant="bodyStrong" numberOfLines={1} style={styles.stopName}>
        {place.name}
      </Text>
    </View>
  );
}

export function TripSummary({ pickup, dropoff, onEdit, onClear, trailing }: TripSummaryProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`From ${pickup.name} to ${dropoff.name}`}
        accessibilityHint="Change pickup or destination"
        onPress={onEdit}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: pressed ? colors.fillStrong : colors.fill },
        ]}
      >
        <Stop kind="pickup" place={pickup} />
        <View style={styles.connector}>
          <View style={[styles.connectorLine, { backgroundColor: colors.borderStrong }]} />
        </View>
        <Stop kind="dropoff" place={dropoff} />
      </Pressable>
      {trailing}
      <IconButton
        icon={XIcon}
        accessibilityLabel="Clear trip"
        onPress={onClear}
        size={controlHeight.md}
      />
    </View>
  );
}

const MARKER_COLUMN = space.md + space.xxs;
const MARKER = space.sm - space.xxs / 2;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  stopName: {
    flex: 1,
  },
  markerColumn: {
    width: MARKER_COLUMN,
    alignItems: 'center',
  },
  pickupDot: {
    width: MARKER,
    height: MARKER,
    borderRadius: radius.round,
    borderWidth: space.xxs - 1,
  },
  dropoffDot: {
    width: MARKER,
    height: MARKER,
    borderRadius: space.xxs / 2,
  },
  connector: {
    width: MARKER_COLUMN,
    alignItems: 'center',
    paddingVertical: space.xxs / 2,
  },
  connectorLine: {
    width: StyleSheet.hairlineWidth * 2,
    height: space.sm - space.xxs / 2,
  },
});
