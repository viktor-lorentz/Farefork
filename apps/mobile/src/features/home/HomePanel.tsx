import {
  deliveryProviderIds,
  providerName,
  rideProviderIds,
  type ProviderId,
  type Vertical,
} from '@repo/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  ListGroup,
  ListRow,
  ListRowIcon,
  listGroupIconInset,
  SegmentedControl,
  Text,
  type SegmentOption,
} from '@/design/components';
import {
  BriefcaseIcon,
  ClockCounterClockwiseIcon,
  CarIcon,
  ForkKnifeIcon,
  HouseIcon,
  MapIcon,
  MapPinIcon,
  PlusIcon,
  SealCheckIcon,
  ShoppingBagIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { iconSize, space } from '@/design/tokens';
import { usePreferences } from '@/stores/preferences';
import { useTrip } from '@/stores/trip';
import { cartCount } from '@/features/food/cart';
import { useDeliveryAddress } from '@/features/food/useDeliveryAddress';
import { useFood } from '@/stores/food';
import { useVertical } from './useVertical';

const verticalOptions: readonly SegmentOption<Vertical>[] = [
  { value: 'rides', label: 'Rides', icon: CarIcon },
  { value: 'food', label: 'Food', icon: ForkKnifeIcon },
];

function listNames(ids: readonly ProviderId[]): string {
  const names = ids.map(providerName);
  if (names.length < 2) {
    return names.join('');
  }
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function RidesContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const recents = useTrip((state) => state.recents).slice(0, 3);
  const add = <PlusIcon size={iconSize.md} weight="bold" color={colors.textSecondary} />;
  return (
    <>
      {recents.length > 0 ? (
        <ListGroup title="Recent" inset={listGroupIconInset}>
          {recents.map((place) => (
            <ListRow
              key={place.id}
              title={place.name}
              subtitle={place.address || undefined}
              leading={<ListRowIcon icon={ClockCounterClockwiseIcon} />}
              accessibilityHint="Compare rides to this place"
              onPress={() => {
                router.push({ pathname: '/rides/search', params: { recent: place.id } });
              }}
            />
          ))}
        </ListGroup>
      ) : null}
      <ListGroup title="Saved places" inset={listGroupIconInset}>
        <ListRow
          title="Add home"
          subtitle="One tap to price a ride home"
          leading={<ListRowIcon icon={HouseIcon} />}
          trailing={add}
          onPress={() => {
            router.push('/rides/search');
          }}
        />
        <ListRow
          title="Add work"
          subtitle="Save your commute"
          leading={<ListRowIcon icon={BriefcaseIcon} />}
          trailing={add}
          onPress={() => {
            router.push('/rides/search');
          }}
        />
      </ListGroup>
    </>
  );
}

function FoodContent() {
  const router = useRouter();
  const address = useDeliveryAddress();
  const cart = useFood((state) => state.cart);
  const count = cartCount(cart);
  return (
    <ListGroup inset={listGroupIconInset}>
      {cart && count > 0 ? (
        <ListRow
          title={`Your cart from ${cart.restaurantName}`}
          subtitle={`${count} ${count === 1 ? 'item' : 'items'}, compare totals before tip`}
          leading={<ListRowIcon icon={ShoppingBagIcon} />}
          chevron
          onPress={() => {
            router.push('/food/compare');
          }}
        />
      ) : null}
      <ListRow
        title={address ? address.name : 'Set a delivery address'}
        subtitle={address ? 'Deliver to' : 'Prices depend on where the food goes'}
        leading={<ListRowIcon icon={MapPinIcon} />}
        chevron
        onPress={() => {
          router.push('/food/address');
        }}
      />
      <ListRow
        title="Restaurants on a map"
        subtitle="Tap a pin to see what’s close"
        leading={<ListRowIcon icon={MapIcon} />}
        chevron
        onPress={() => {
          router.push('/food/map');
        }}
      />
    </ListGroup>
  );
}

export function HomePanel() {
  const vertical = useVertical((state) => state.vertical);
  const setVertical = useVertical((state) => state.setVertical);
  const membershipCount = usePreferences((state) => state.membershipIds.length);
  const router = useRouter();
  const ids = vertical === 'rides' ? rideProviderIds : deliveryProviderIds;

  return (
    <View style={styles.panel}>
      <View style={styles.switcher}>
        <SegmentedControl
          options={verticalOptions}
          value={vertical}
          onChange={setVertical}
          accessibilityLabel="Compare rides or food"
        />
        <Text variant="caption" tone="secondary" style={styles.compareLine}>
          Comparing {listNames(ids)}
        </Text>
      </View>
      {vertical === 'rides' ? <RidesContent /> : <FoodContent />}
      <ListGroup>
        <ListRow
          title="Memberships"
          subtitle={
            membershipCount > 0
              ? `${membershipCount} active, applied to every quote`
              : 'Add Uber One or DashPass for accurate totals'
          }
          leading={<ListRowIcon icon={SealCheckIcon} />}
          chevron
          onPress={() => {
            router.push('/profile/memberships');
          }}
        />
      </ListGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: space.lg,
  },
  switcher: {
    gap: space.xs,
  },
  compareLine: {
    paddingHorizontal: space.xxs,
  },
});
