import type { Place } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  EmptyState,
  IconButton,
  ListRow,
  ListRowIcon,
  Screen,
  ScreenHeader,
  SearchField,
  SectionHeader,
} from '@/design/components';
import {
  ClockCounterClockwiseIcon,
  MapPinIcon,
  NavigationArrowIcon,
  WarningCircleIcon,
  XIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { space } from '@/design/tokens';
import { defaultCenter } from '@/features/map/types';
import { currentLocationPlace, locateDevice } from '@/features/rides/location';
import { MIN_QUERY_LENGTH, usePlaceSearch } from '@/features/rides/usePlaceSearch';
import { haptics } from '@/lib/haptics';
import { useFood } from '@/stores/food';
import { useDeviceLocation } from '@/stores/location';
import { useTrip } from '@/stores/trip';

type LocateState = 'idle' | 'locating' | 'denied' | 'unavailable';

export default function DeliveryAddressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const setDeliverTo = useFood((state) => state.setDeliverTo);
  const recents = useTrip((state) => state.recents);
  const lastKnown = useDeviceLocation((state) => state.lastKnown);
  const [text, setText] = useState('');
  const [locate, setLocate] = useState<LocateState>('idle');
  const search = usePlaceSearch(text, lastKnown ?? defaultCenter);

  const choose = (place: Place) => {
    haptics.selection();
    setDeliverTo(place);
    router.back();
  };

  const pickHere = async () => {
    setLocate('locating');
    const result = await locateDevice();
    if (result.status !== 'ok') {
      setLocate(result.status);
      return;
    }
    setLocate('idle');
    choose(currentLocationPlace(result.point));
  };

  const typing = text.trim().length >= MIN_QUERY_LENGTH;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Deliver to" />
      <Screen padTop={false} contentStyle={styles.content}>
        <SearchField
          icon={MapPinIcon}
          value={text}
          onChangeText={setText}
          placeholder="Street address"
          autoFocus
          size="md"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Delivery address"
          trailing={
            text.length > 0 ? (
              <IconButton
                icon={XIcon}
                size={36}
                accessibilityLabel="Clear address"
                onPress={() => {
                  setText('');
                }}
              />
            ) : undefined
          }
        />
        {!typing ? (
          <View>
            <ListRow
              title="Current location"
              subtitle={
                locate === 'denied'
                  ? 'Location access is off for this app. Type an address instead.'
                  : locate === 'unavailable'
                    ? 'Couldn’t get a location fix. Type an address instead.'
                    : 'Deliver to where you are now'
              }
              leading={<ListRowIcon icon={NavigationArrowIcon} />}
              trailing={
                locate === 'locating' ? <ActivityIndicator color={colors.textPrimary} /> : null
              }
              disabled={locate === 'locating'}
              onPress={() => {
                void pickHere();
              }}
            />
            {recents.length > 0 ? (
              <>
                <SectionHeader title="Recent places" style={styles.sectionHeader} />
                {recents.map((place, index) => (
                  <ListRow
                    key={place.id}
                    title={place.name}
                    subtitle={place.address || undefined}
                    leading={<ListRowIcon icon={ClockCounterClockwiseIcon} />}
                    divider={index < recents.length - 1}
                    onPress={() => {
                      choose(place);
                    }}
                  />
                ))}
              </>
            ) : null}
          </View>
        ) : search.isError ? (
          <EmptyState
            icon={WarningCircleIcon}
            title="Address search is unavailable"
            body="The search service didn’t respond. Check your connection and try again."
            action={{
              label: 'Try again',
              onPress: () => {
                void search.refetch();
              },
            }}
          />
        ) : search.places.length > 0 ? (
          <View>
            {search.places.map((place, index) => (
              <ListRow
                key={place.id}
                title={place.name}
                subtitle={place.address || undefined}
                leading={<ListRowIcon icon={MapPinIcon} />}
                divider={index < search.places.length - 1}
                onPress={() => {
                  choose(place);
                }}
              />
            ))}
          </View>
        ) : search.isFetching || search.settling ? (
          <ActivityIndicator color={colors.textPrimary} style={styles.spinner} />
        ) : (
          <EmptyState icon={MapPinIcon} title="No matches" body="Try a street address." />
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: space.lg },
  sectionHeader: { marginTop: space.sm },
  spinner: { paddingVertical: space.lg },
});
