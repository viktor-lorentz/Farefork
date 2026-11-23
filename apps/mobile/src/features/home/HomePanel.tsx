import { deliveryProviderIds, rideProviderIds, type ProviderId, type Vertical } from '@repo/shared';
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
  MapPinIcon,
  PlusIcon,
  SealCheckIcon,
  ShoppingBagIcon,
  StorefrontIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { iconSize, space } from '@/design/tokens';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
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

function ProviderStrip({ ids }: { ids: readonly ProviderId[] }) {
  return (
    <View style={styles.strip}>
      {ids.map((id) => (
        <ProviderLogo key={id} providerId={id} size={32} />
      ))}
    </View>
  );
}

function RidesContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const recents = useTrip((state) => state.recents).slice(0, 3);
  return (
    <>
      <View style={styles.compareRow}>
        <Text variant="caption" tone="secondary">
          Comparing
        </Text>
        <ProviderStrip ids={rideProviderIds} />
      </View>
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
      <View style={styles.compareRow}>
        <Text variant="caption" tone="secondary">
          Comparing
        </Text>
        <ProviderStrip ids={deliveryProviderIds} />
      </View>
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
          title="True totals, before tip"
          subtitle="Menu markup, fees and estimated tax on every app"
          leading={<ListRowIcon icon={StorefrontIcon} />}
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
        size="lg"
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
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  strip: {
    flexDirection: 'row',
    gap: space.xs,
  },
});
