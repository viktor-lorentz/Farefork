import { cuisineLabels, formatUsd, providerName } from '@repo/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
  EmptyState,
  IconButton,
  Screen,
  ScreenHeader,
  SectionHeader,
  Skeleton,
  Stepper,
  Text,
} from '@/design/components';
import { InfoIcon, ShoppingBagIcon, WarningCircleIcon, XIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { FavoriteButton } from '@/features/account/FavoriteButton';
import { restaurantFavorite } from '@/features/account/favorites';
import { BottomBar } from '@/features/food/BottomBar';
import { RestaurantPhoto } from '@/features/food/RestaurantPhoto';
import { cartCount, cartInStoreCents, MAX_ITEM_QUANTITY, quantityOf } from '@/features/food/cart';
import { restaurantMeta } from '@/features/food/format';
import { useRestaurant } from '@/features/food/queries';
import { useDeliveryAddress } from '@/features/food/useDeliveryAddress';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import { useFood } from '@/stores/food';

export default function RestaurantScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const address = useDeliveryAddress();
  const query = useRestaurant(id, address);
  const cart = useFood((state) => state.cart);
  const setQuantity = useFood((state) => state.setQuantity);
  const replacedFrom = useFood((state) => state.replacedCartFrom);
  const dismissReplaced = useFood((state) => state.dismissReplacedNotice);
  const restaurant = query.data?.restaurant;
  const inThisCart = restaurant !== undefined && cart?.restaurantId === restaurant.id;
  const count = inThisCart ? cartCount(cart) : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={restaurant?.name ?? 'Restaurant'}
        trailing={
          restaurant ? (
            <FavoriteButton
              favorite={restaurantFavorite(restaurant, cuisineLabels[restaurant.cuisine])}
            />
          ) : undefined
        }
      />
      <Screen padTop={false} contentStyle={styles.content}>
        {query.isPending ? (
          <View style={styles.loading} accessibilityLabel="Loading menu">
            <Skeleton width="70%" height={space.xl} />
            <Skeleton width="90%" height={space.md} />
            <Skeleton height={space.huge} />
            <Skeleton height={space.huge} />
            <Skeleton height={space.huge} />
          </View>
        ) : query.isError || !restaurant ? (
          <EmptyState
            icon={WarningCircleIcon}
            title="Menu didn’t load"
            body="This restaurant may no longer be available."
            action={{
              label: 'Try again',
              onPress: () => {
                void query.refetch();
              },
            }}
          />
        ) : (
          <>
            <RestaurantPhoto restaurant={restaurant} style={styles.photo} />
            {restaurant.photo ? (
              <Text variant="caption" tone="tertiary" style={styles.photoCredit}>
                Photo of {cuisineLabels[restaurant.cuisine].toLowerCase()} food, not this
                restaurant.{' '}
                {restaurant.photo.author === 'Unknown'
                  ? restaurant.photo.license
                  : `${restaurant.photo.author}, ${restaurant.photo.license}`}
                .
              </Text>
            ) : null}
            <View style={styles.hero}>
              <Text variant="titleL" accessibilityRole="header">
                {restaurant.name}
              </Text>
              <Text variant="caption" tone="secondary">
                {restaurantMeta(restaurant)}
              </Text>
              {restaurant.address !== null ? (
                <Text variant="caption" tone="secondary">
                  {restaurant.address}
                </Text>
              ) : null}
              <View style={styles.onApps}>
                <Text variant="caption" tone="secondary">
                  On
                </Text>
                {restaurant.providerIds.map((providerId) => (
                  <ProviderLogo key={providerId} providerId={providerId} size={24} />
                ))}
                <Text variant="caption" tone="secondary" style={styles.flex} numberOfLines={1}>
                  {restaurant.providerIds.map(providerName).join(', ')}
                </Text>
              </View>
            </View>

            <View style={[styles.notice, { backgroundColor: colors.fill }]}>
              <InfoIcon size={16} color={colors.textPrimary} weight="bold" />
              <Text variant="caption" style={styles.flex}>
                Simulated menu with in-store prices. Each app’s markup, fees and tax are in the
                comparison.
              </Text>
            </View>

            {replacedFrom !== null && inThisCart ? (
              <View style={[styles.notice, { backgroundColor: colors.fill }]}>
                <Text variant="caption" style={styles.flex}>
                  Started a new cart. Your items from {replacedFrom} were removed.
                </Text>
                <IconButton
                  icon={XIcon}
                  size={36}
                  accessibilityLabel="Dismiss"
                  onPress={dismissReplaced}
                />
              </View>
            ) : null}

            {restaurant.categories.map((category) => (
              <View key={category.id}>
                <SectionHeader title={category.name} />
                {category.items.map((item, index) => {
                  const quantity = quantityOf(cart, restaurant.id, item.id);
                  return (
                    <View key={item.id}>
                      <View style={styles.item}>
                        <View style={styles.flex}>
                          <View style={styles.itemTitle}>
                            <Text variant="bodyStrong" style={styles.shrink}>
                              {item.name}
                            </Text>
                            {item.popular ? <Badge label="Popular" tone="neutral" /> : null}
                          </View>
                          <Text variant="caption" tone="secondary" numberOfLines={2}>
                            {item.description}
                          </Text>
                          <Text variant="priceS">{formatUsd(item.priceCents)}</Text>
                        </View>
                        <Stepper
                          value={quantity}
                          max={MAX_ITEM_QUANTITY}
                          label={item.name}
                          onChange={(next) => {
                            setQuantity({ id: restaurant.id, name: restaurant.name }, item, next);
                          }}
                        />
                      </View>
                      {index < category.items.length - 1 ? <Divider /> : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        )}
      </Screen>
      {inThisCart && count > 0 ? (
        <BottomBar>
          <Button
            label={`Compare apps · ${count} ${count === 1 ? 'item' : 'items'} · ${formatUsd(cartInStoreCents(cart))} in store`}
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
  content: { gap: space.lg },
  loading: { gap: space.md },
  hero: { gap: space.xs },
  photo: { width: '100%', aspectRatio: 2, borderRadius: radius.lg },
  photoCredit: { marginTop: -space.sm },
  onApps: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xxs },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    padding: space.sm,
    borderRadius: radius.md,
  },
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
  },
  itemTitle: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexWrap: 'wrap' },
});
