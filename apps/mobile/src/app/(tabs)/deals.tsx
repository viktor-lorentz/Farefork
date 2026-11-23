import type { Deal, DealKind } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Divider,
  EmptyState,
  PageTitle,
  RowSkeleton,
  Screen,
  SegmentedControl,
  Text,
} from '@/design/components';
import { TagIcon, WarningCircleIcon } from '@/design/icons';
import { space } from '@/design/tokens';
import { DEAL_ROW_INSET, DealRow } from '@/features/deals/DealRow';
import { useDeals } from '@/features/deals/queries';

type Filter = 'all' | DealKind;

const filters = [
  { value: 'all', label: 'All' },
  { value: 'ride', label: 'Rides' },
  { value: 'food', label: 'Food' },
] as const;

function dealsMeta(list: readonly Deal[]): string | null {
  if (list.length === 0) {
    return null;
  }
  const unlocked = list.filter((deal) => deal.membershipName !== null && deal.eligible).length;
  const count = `${list.length} ${list.length === 1 ? 'promo' : 'promos'}`;
  return unlocked > 0 ? `${count} · ${unlocked} from your memberships` : count;
}

export default function DealsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const deals = useDeals(filter === 'all' ? null : filter);
  const list = deals.data?.deals ?? [];
  return (
    <Screen contentStyle={styles.content}>
      <PageTitle title="Deals" meta={dealsMeta(list)} />
      <SegmentedControl
        options={filters}
        value={filter}
        onChange={setFilter}
        accessibilityLabel="Deal type"
      />
      {deals.isPending ? (
        <RowSkeleton />
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
        <EmptyState icon={TagIcon} title="No deals right now" body="Check back later this week." />
      ) : (
        <View>
          {list.map((deal, index) => (
            <View key={deal.id}>
              {index > 0 ? <Divider inset={DEAL_ROW_INSET} /> : null}
              <DealRow
                deal={deal}
                onPress={() => {
                  router.push(deal.kind === 'ride' ? '/rides/search' : '/food');
                }}
              />
            </View>
          ))}
          <Text variant="caption" tone="tertiary" style={styles.footnote}>
            Sample promos. Each app sets its own terms at checkout.
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  footnote: { paddingTop: space.md },
});
