import type { DealKind } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState, Screen, SegmentedControl, Skeleton, Text } from '@/design/components';
import { TagIcon, WarningCircleIcon } from '@/design/icons';
import { space } from '@/design/tokens';
import { DealCard } from '@/features/deals/DealCard';
import { useDeals } from '@/features/deals/queries';

type Filter = 'all' | DealKind;

const filters = [
  { value: 'all', label: 'All' },
  { value: 'ride', label: 'Rides' },
  { value: 'food', label: 'Food' },
] as const;

export default function DealsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const deals = useDeals(filter === 'all' ? null : filter);
  const list = deals.data?.deals ?? [];
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="titleXL" accessibilityRole="header">
          Deals
        </Text>
        <Text variant="body" tone="secondary">
          Promos across every app, ranked by what they save you. Ones your memberships unlock come
          first.
        </Text>
      </View>
      <SegmentedControl
        options={filters}
        value={filter}
        onChange={setFilter}
        accessibilityLabel="Deal type"
      />
      {deals.isPending ? (
        <View style={styles.list}>
          <Skeleton height={96} radius={16} />
          <Skeleton height={96} radius={16} />
          <Skeleton height={96} radius={16} />
        </View>
      ) : deals.isError ? (
        <EmptyState
          icon={WarningCircleIcon}
          title="Deals didn’t load"
          body="Check your connection and try again."
          action={{
            label: 'Try again',
            onPress: () => {
              void deals.refetch();
            },
          }}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="No deals right now"
          body="New promos show up every week."
        />
      ) : (
        <View style={styles.list}>
          {list.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onPress={() => {
                router.push(deal.kind === 'ride' ? '/rides/search' : '/food');
              }}
            />
          ))}
          <Text variant="caption" tone="secondary">
            Simulated promos for this demo. Real offers need provider partnerships, and each app
            applies its own terms at checkout.
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  header: { gap: space.xxs },
  list: { gap: space.sm },
});
