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
  ListRow,
  ListRowIcon,
  SectionHeader,
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

function CompareLine({ ids }: { ids: readonly ProviderId[] }) {
  return (
    <Text variant="caption" tone="secondary" style={styles.compareLine}>
      Prices from {listNames(ids)}
    </Text>
  );
}

function RidesContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const recents = useTrip((state) => state.recents).slice(0, 3);
  return (
    <>
      <CompareLine ids={rideProviderIds} />
      {recents.length > 0 ? (
        <View>
          <SectionHeader title="Recent" />
          {recents.map((place, index) => (
            <ListRow
              key={place.id}
              flush
              title={place.name}
              subtitle={place.address || undefined}
              leading={<ListRowIcon icon={ClockCounterClockwiseIcon} />}
              accessibilityHint="Compare rides to this place"
              divider={index < recents.length - 1}
              onPress={() => {
                router.push({ pathname: '/rides/search', params: { recent: place.id } });
              }}
            />
          ))}
        </View>
      ) : null}
      <View>
        <SectionHeader title="Saved places" />
        <ListRow
          flush
          title="Add home"
          subtitle="One tap to price a ride home"
          leading={<ListRowIcon icon={HouseIcon} />}
          trailing={<PlusIcon size={iconSize.md} weight="bold" color={colors.textPrimary} />}
          onPress={() => {
            router.push('/rides/search');
          }}
          divider
        />
        <ListRow
          flush
          title="Add work"
          subtitle="Save your commute"
          leading={<ListRowIcon icon={BriefcaseIcon} />}
          trailing={<PlusIcon size={iconSize.md} weight="bold" color={colors.textPrimary} />}
          onPress={() => {
            router.push('/rides/search');
          }}
        />
      </View>
    </>
  );
}

function FoodContent() {
  const router = useRouter();
  const address = useDeliveryAddress();
  const cart = useFood((state) => state.cart);
  const count = cartCount(cart);
  return (
    <>
      <CompareLine ids={deliveryProviderIds} />
      <View>
        {cart && count > 0 ? (
          <ListRow
            flush
            title={`Your cart from ${cart.restaurantName}`}
            subtitle={`${count} ${count === 1 ? 'item' : 'items'}. Compare totals before tip`}
            leading={<ListRowIcon icon={ShoppingBagIcon} />}
            chevron
            divider
            onPress={() => {
              router.push('/food/compare');
            }}
          />
        ) : null}
        <ListRow
          flush
          title={address ? address.name : 'Set a delivery address'}
          subtitle={address ? 'Deliver to' : 'Prices depend on where the food goes'}
          leading={<ListRowIcon icon={MapPinIcon} />}
          chevron
          divider
          onPress={() => {
            router.push('/food/address');
          }}
        />
        <ListRow
          flush
          title="Restaurants on a map"
          subtitle="Tap a pin, swipe through what’s close"
          leading={<ListRowIcon icon={MapIcon} />}
          chevron
          onPress={() => {
            router.push('/food/map');
          }}
        />
      </View>
    </>
  );
}

export function HomePanel() {
  const vertical = useVertical((state) => state.vertical);
  const setVertical = useVertical((state) => state.setVertical);
  const membershipCount = usePreferences((state) => state.membershipIds.length);
  const router = useRouter();

  return (
    <View style={styles.panel}>
      <SegmentedControl
        options={verticalOptions}
        value={vertical}
        onChange={setVertical}
        accessibilityLabel="Compare rides or food"
      />
      {vertical === 'rides' ? <RidesContent /> : <FoodContent />}
      <ListRow
        flush
        title="Your memberships"
        subtitle={
          membershipCount > 0
            ? `${membershipCount} active, applied to every quote`
            : 'Add Uber One, DashPass and more for accurate totals'
        }
        leading={<ListRowIcon icon={SealCheckIcon} />}
        chevron
        onPress={() => {
          router.push('/profile/memberships');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: space.md,
  },
  compareLine: {
    marginTop: -space.xs,
  },
});
