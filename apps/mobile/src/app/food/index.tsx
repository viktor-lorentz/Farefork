import { type Cuisine, cuisineIds, cuisineLabels } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  EmptyState,
  IconButton,
  ListRow,
  ListRowIcon,
  Screen,
  ScreenHeader,
  SearchField,
  Skeleton,
  Text,
} from '@/design/components';
import {
  ForkKnifeIcon,
  MagnifyingGlassIcon,
  MapIcon,
  MapPinIcon,
  ShoppingBagIcon,
  WarningCircleIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { space } from '@/design/tokens';
import { BottomBar } from '@/features/food/BottomBar';
import { cartCount } from '@/features/food/cart';
import { useRestaurants } from '@/features/food/queries';
import { RestaurantCard } from '@/features/food/RestaurantCard';
import { useBreakpoint } from '@/design/layout';
import { useDeliveryAddress } from '@/features/food/useDeliveryAddress';
import { useFood } from '@/stores/food';

function RestaurantSkeletons() {
  return (
    <View style={styles.skeletons} accessibilityLabel="Loading restaurants">
      {[0, 1, 2].map((key) => (
        <View key={key} style={styles.skeletonCard}>
          <Skeleton height={180} radius={16} />
          <Skeleton width="50%" height={14} />
          <Skeleton width="75%" height={12} />
        </View>
      ))}
    </View>
  );
}

const PAGE_SIZE = 24;

export default function RestaurantsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const address = useDeliveryAddress();
  const cart = useFood((state) => state.cart);
  const [text, setText] = useState('');
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const query = useRestaurants(address, text, cuisine);
  const restaurants = query.data?.restaurants ?? [];
  const listKey = `${text.trim().toLowerCase()}|${cuisine ?? ''}`;
  const [paging, setPaging] = useState({ key: listKey, count: PAGE_SIZE });
  const visibleCount = paging.key === listKey ? paging.count : PAGE_SIZE;
  const shown = restaurants.slice(0, visibleCount);
  const count = cartCount(cart);
  const breakpoint = useBreakpoint();
  const columns = breakpoint === 'compact' ? 1 : breakpoint === 'medium' ? 2 : 3;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Food delivery"
        trailing={
          address ? (
            <IconButton
              icon={MapIcon}
              accessibilityLabel="Show restaurants on a map"
              onPress={() => {
                router.push('/food/map');
              }}
            />
          ) : null
        }
      />
      <Screen padTop={false} contentStyle={styles.content}>
        <ListRow
          flush
          title={address ? address.name : 'Set a delivery address'}
          subtitle={address ? 'Deliver to' : 'Prices depend on where the food goes'}
          leading={<ListRowIcon icon={MapPinIcon} />}
          chevron
          accessibilityLabel={address ? `Deliver to ${address.name}` : 'Set a delivery address'}
          accessibilityHint="Change the delivery address"
          onPress={() => {
            router.push('/food/address');
          }}
        />
        {address ? (
          <>
            <SearchField
              icon={MagnifyingGlassIcon}
              value={text}
              onChangeText={setText}
              placeholder="Restaurant, cuisine or dish"
              size="md"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search restaurants"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              accessibilityRole="radiogroup"
            >
              <Chip
                label="All"
                role="radio"
                selected={cuisine === null}
                onPress={() => {
                  setCuisine(null);
                }}
              />
              {cuisineIds.map((id) => (
                <Chip
                  key={id}
                  label={cuisineLabels[id]}
                  role="radio"
                  selected={cuisine === id}
                  onPress={() => {
                    setCuisine(cuisine === id ? null : id);
                  }}
                />
              ))}
            </ScrollView>
            {query.isPending ? (
              <RestaurantSkeletons />
            ) : query.isError ? (
              <EmptyState
                icon={WarningCircleIcon}
                title="Restaurants didn’t load"
                body="Check your connection, and that the API is running on your computer."
                action={{
                  label: 'Try again',
                  onPress: () => {
                    void query.refetch();
                  },
                }}
              />
            ) : restaurants.length === 0 ? (
              <EmptyState
                icon={ForkKnifeIcon}
                title="Nothing matches"
                body="Try another dish or cuisine, or clear the filter."
              />
            ) : (
              <View>
                <Text variant="caption" tone="secondary" style={styles.note}>
                  {restaurants[0]?.source === 'openstreetmap'
                    ? 'Restaurants from OpenStreetMap. Menus, prices and which apps carry them are simulated. Photos show the cuisine, not the restaurant.'
                    : 'Sample restaurants with simulated menus. Real listings need provider agreements.'}
                </Text>
                <View style={styles.grid}>
                  {shown.map((restaurant) => (
                    <View
                      key={restaurant.id}
                      style={{ width: columns === 1 ? '100%' : `${100 / columns - 2}%` }}
                    >
                      <RestaurantCard
                        restaurant={restaurant}
                        onPress={() => {
                          router.push({ pathname: '/food/[id]', params: { id: restaurant.id } });
                        }}
                      />
                    </View>
                  ))}
                </View>
                {restaurants.length > shown.length ? (
                  <Button
                    label={`Show more (${restaurants.length - shown.length})`}
                    variant="secondary"
                    style={styles.more}
                    onPress={() => {
                      setPaging({ key: listKey, count: visibleCount + PAGE_SIZE });
                    }}
                  />
                ) : null}
                {restaurants[0]?.source === 'openstreetmap' ? (
                  <Text variant="caption" tone="tertiary" style={styles.credit}>
                    Restaurant data © OpenStreetMap contributors. Photos: CC0, via Openverse.
                  </Text>
                ) : null}
              </View>
            )}
          </>
        ) : (
          <EmptyState
            icon={MapPinIcon}
            title="Where should it go?"
            body="Set an address to see restaurants that deliver there."
            action={{
              label: 'Set address',
              onPress: () => {
                router.push('/food/address');
              },
            }}
          />
        )}
      </Screen>
      {cart && count > 0 ? (
        <BottomBar>
          <Button
            label={`Compare ${count} ${count === 1 ? 'item' : 'items'} from ${cart.restaurantName}`}
            leadingIcon={ShoppingBagIcon}
            fullWidth
            onPress={() => {
              router.push('/food/compare');
            }}
          />
        </BottomBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: space.md },
  chips: { gap: space.xs, paddingRight: space.md },
  note: { paddingBottom: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '3%', rowGap: space.lg },
  credit: { marginTop: space.lg },
  more: { marginTop: space.lg },
  skeletons: { gap: space.lg, paddingTop: space.xs },
  skeletonCard: { gap: space.xs },
});
