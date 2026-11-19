import { type Cuisine, cuisineIds, cuisineLabels } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  EmptyState,
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
  MapPinIcon,
  ShoppingBagIcon,
  WarningCircleIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { space } from '@/design/tokens';
import { BottomBar } from '@/features/food/BottomBar';
import { cartCount } from '@/features/food/cart';
import { useRestaurants } from '@/features/food/queries';
import { RestaurantRow } from '@/features/food/RestaurantRow';
import { useDeliveryAddress } from '@/features/food/useDeliveryAddress';
import { useFood } from '@/stores/food';

function RestaurantSkeletons() {
  return (
    <View style={styles.skeletons} accessibilityLabel="Loading restaurants">
      {[0, 1, 2, 3, 4].map((key) => (
        <View key={key} style={styles.skeletonRow}>
          <Skeleton width={40} height={40} radius={12} />
          <View style={styles.skeletonText}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="85%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function RestaurantsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const address = useDeliveryAddress();
  const cart = useFood((state) => state.cart);
  const [text, setText] = useState('');
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const query = useRestaurants(address, text, cuisine);
  const restaurants = query.data?.restaurants ?? [];
  const count = cartCount(cart);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Food delivery" />
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
                  Sample restaurants with simulated menus. Real listings need provider agreements.
                </Text>
                {restaurants.map((restaurant, index) => (
                  <RestaurantRow
                    key={restaurant.id}
                    restaurant={restaurant}
                    divider={index < restaurants.length - 1}
                    onPress={() => {
                      router.push({ pathname: '/food/[id]', params: { id: restaurant.id } });
                    }}
                  />
                ))}
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
  note: { paddingBottom: space.xs },
  skeletons: { gap: space.md, paddingTop: space.xs },
  skeletonRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  skeletonText: { flex: 1, gap: space.xs },
});
