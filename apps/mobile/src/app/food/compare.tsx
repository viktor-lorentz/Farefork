import { formatUsd, providerName } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  EmptyState,
  QuoteCardSkeleton,
  QuoteCardUnavailable,
  Screen,
  ScreenHeader,
  Text,
} from '@/design/components';
import { ArrowSquareOutIcon, InfoIcon, ShoppingBagIcon, WarningCircleIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { recordHandoff } from '@/features/account/queries';
import { foodHandoff } from '@/features/account/savings';
import { BottomBar } from '@/features/food/BottomBar';
import { cartCount } from '@/features/food/cart';
import { FoodQuoteCard } from '@/features/food/FoodQuoteCard';
import { useFoodQuotes } from '@/features/food/queries';
import { useDeliveryAddress } from '@/features/food/useDeliveryAddress';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import { ApiError } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { openExternal } from '@/lib/openExternal';
import { useFood } from '@/stores/food';

export default function FoodCompareScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const cart = useFood((state) => state.cart);
  const address = useDeliveryAddress();
  const query = useFoodQuotes(cart, address);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const data = query.data;
  const quotes = data?.quotes ?? [];
  const best = quotes[0];
  const selected = quotes.find((quote) => quote.providerId === selectedId) ?? best;
  const spread =
    quotes.length > 1
      ? (quotes[quotes.length - 1]?.totalBeforeTipCents ?? 0) - (best?.totalBeforeTipCents ?? 0)
      : 0;

  if (!cart) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Compare apps" />
        <Screen padTop={false}>
          <EmptyState
            icon={ShoppingBagIcon}
            title="Your cart is empty"
            body="Pick a restaurant and add a few items to compare totals."
            action={{
              label: 'Find restaurants',
              onPress: () => {
                router.replace('/food');
              },
            }}
          />
        </Screen>
      </View>
    );
  }

  const count = cartCount(cart);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Compare apps" />
      <Screen padTop={false} contentStyle={styles.content}>
        <View style={styles.summary}>
          <Text variant="titleM" accessibilityRole="header">
            {cart.restaurantName}
          </Text>
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {count} {count === 1 ? 'item' : 'items'}:{' '}
            {cart.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}
          </Text>
          {address ? (
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              Deliver to {address.name}
            </Text>
          ) : null}
        </View>

        {!address ? (
          <EmptyState
            icon={WarningCircleIcon}
            title="Set a delivery address"
            body="Fees depend on how far the food travels."
            action={{
              label: 'Set address',
              onPress: () => {
                router.push('/food/address');
              },
            }}
          />
        ) : query.isPending ? (
          <View accessibilityLabel="Loading totals">
            <QuoteCardSkeleton />
            <QuoteCardSkeleton />
            <QuoteCardSkeleton />
          </View>
        ) : query.isError ? (
          <EmptyState
            icon={WarningCircleIcon}
            title="Totals didn’t load"
            body={
              query.error instanceof ApiError && query.error.status === 422
                ? query.error.message
                : 'Check your connection, and that the API is running on your computer.'
            }
            action={{
              label: 'Try again',
              onPress: () => {
                void query.refetch();
              },
            }}
          />
        ) : data ? (
          <>
            {spread > 0 ? (
              <Text variant="caption" tone="secondary">
                Totals differ by up to{' '}
                <Text variant="captionStrong" tabular>
                  {formatUsd(spread)}
                </Text>{' '}
                for the same order. In-store, these items cost{' '}
                <Text variant="captionStrong" tabular>
                  {formatUsd(data.inStoreSubtotalCents)}
                </Text>
                .
              </Text>
            ) : null}
            <View style={styles.list}>
              {quotes.map((quote) => (
                <FoodQuoteCard
                  key={quote.providerId}
                  quote={quote}
                  inStoreSubtotalCents={data.inStoreSubtotalCents}
                  bestPrice={quote.providerId === best?.providerId}
                  selected={quote.providerId === selected?.providerId}
                  onPress={() => {
                    haptics.selection();
                    setSelectedId(quote.providerId);
                  }}
                />
              ))}
              {data.unavailable.map((entry) => (
                <QuoteCardUnavailable
                  key={entry.providerId}
                  logo={<ProviderLogo providerId={entry.providerId} size={40} decorative />}
                  title={providerName(entry.providerId)}
                  reason={entry.reason}
                />
              ))}
            </View>
            <View style={[styles.notice, { backgroundColor: colors.fill }]}>
              <InfoIcon size={16} color={colors.textPrimary} weight="bold" />
              <Text variant="caption" style={styles.flex}>
                Totals include menu prices, fees and estimated tax, but not tip. Prices are
                simulated. Delivery apps don’t accept a cart from outside, so add the same items
                once the app opens.
              </Text>
            </View>
          </>
        ) : null}
      </Screen>
      {selected ? (
        <BottomBar>
          <Button
            label={`Open ${providerName(selected.providerId)} · ${formatUsd(selected.totalBeforeTipCents)} before tip`}
            trailingIcon={ArrowSquareOutIcon}
            fullWidth
            haptic={false}
            accessibilityHint={`Opens ${providerName(selected.providerId)} at ${cart.restaurantName}`}
            onPress={() => {
              haptics.medium();
              void openExternal(selected.orderUrl, selected.appUrl).then((opened) => {
                if (!opened) {
                  haptics.warning();
                  return;
                }
                void recordHandoff(
                  foodHandoff(selected, quotes, {
                    restaurantName: cart.restaurantName,
                    itemCount: count,
                  }),
                );
              });
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
  summary: { gap: space.xxs },
  list: { gap: space.xs },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.xs,
    padding: space.sm,
    borderRadius: radius.md,
  },
  flex: { flex: 1 },
});
