import { StyleSheet, View } from 'react-native';
import { radius, space } from '../tokens';
import { QUOTE_LOGO_SIZE } from './QuoteCard';
import { Skeleton } from './Skeleton';

export function RowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.row}>
          <Skeleton width={QUOTE_LOGO_SIZE} height={QUOTE_LOGO_SIZE} radius={radius.md} />
          <View style={styles.lines}>
            <Skeleton width="60%" height={space.md} radius={radius.sm / 2} />
            <Skeleton width="40%" height={space.sm} radius={radius.sm / 2} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
  },
  lines: { flex: 1, gap: space.xs },
});
