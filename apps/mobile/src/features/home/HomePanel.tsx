import { deliveryProviderIds, rideProviderIds, type ProviderId, type Vertical } from '@repo/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  ListRow,
  ListRowIcon,
  SearchButton,
  SectionHeader,
  SegmentedControl,
  Text,
  type SegmentOption,
} from '@/design/components';
import {
  BriefcaseIcon,
  CarIcon,
  ForkKnifeIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SealCheckIcon,
  StorefrontIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { space } from '@/design/tokens';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import { usePreferences } from '@/stores/preferences';
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
  return (
    <>
      <SearchButton
        label="Where to?"
        accessibilityHint="Search for a destination to compare ride prices"
        onPress={() => {
          router.push('/rides/search');
        }}
      />
      <View style={styles.compareRow}>
        <Text variant="caption" tone="secondary">
          Comparing
        </Text>
        <ProviderStrip ids={rideProviderIds} />
      </View>
      <View>
        <SectionHeader title="Saved places" />
        <ListRow
          flush
          title="Add home"
          subtitle="One tap to price a ride home"
          leading={<ListRowIcon icon={HouseIcon} />}
          trailing={<PlusIcon size={20} weight="bold" color={colors.textPrimary} />}
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
          trailing={<PlusIcon size={20} weight="bold" color={colors.textPrimary} />}
          onPress={() => {
            router.push('/rides/search');
          }}
        />
      </View>
    </>
  );
}

function FoodContent() {
  return (
    <>
      <SearchButton
        label="Search restaurants"
        icon={MagnifyingGlassIcon}
        accessibilityHint="Food comparison arrives in milestone 3"
        onPress={() => undefined}
      />
      <View style={styles.compareRow}>
        <Text variant="caption" tone="secondary">
          Comparing
        </Text>
        <ProviderStrip ids={deliveryProviderIds} />
      </View>
      <View>
        <SectionHeader title="True totals" />
        <ListRow
          flush
          title="Fees, tips and taxes included"
          subtitle="See what you actually pay on each app, not the menu price"
          leading={<ListRowIcon icon={StorefrontIcon} />}
          trailing={<Badge label="Soon" tone="outline" />}
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
