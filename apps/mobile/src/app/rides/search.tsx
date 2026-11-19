import type { Place } from '@repo/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, StyleSheet, View, type TextInput } from 'react-native';
import {
  EmptyState,
  IconButton,
  ListRow,
  ListRowIcon,
  Screen,
  ScreenHeader,
  SearchField,
  SectionHeader,
  Text,
} from '@/design/components';
import {
  ArrowsDownUpIcon,
  CircleIcon,
  ClockCounterClockwiseIcon,
  MapPinIcon,
  NavigationArrowIcon,
  SquareIcon,
  WarningCircleIcon,
  XIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { space } from '@/design/tokens';
import { defaultCenter } from '@/features/map/types';
import { currentLocationPlace, locateDevice } from '@/features/rides/location';
import { MIN_QUERY_LENGTH, usePlaceSearch } from '@/features/rides/usePlaceSearch';
import { useResultsView } from '@/features/rides/useResultsView';
import { haptics } from '@/lib/haptics';
import { useDeviceLocation } from '@/stores/location';
import { usePreferences } from '@/stores/preferences';
import { isCurrentLocation, useTrip } from '@/stores/trip';

type Field = 'pickup' | 'dropoff';
type LocateState = 'idle' | 'locating' | 'denied' | 'unavailable';

type FieldState = {
  place: Place | null;
  text: string;
};

function initialField(place: Place | null): FieldState {
  return { place, text: place?.name ?? '' };
}

export default function RideSearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const storedPickup = useTrip((state) => state.pickup);
  const storedDropoff = useTrip((state) => state.dropoff);
  const recents = useTrip((state) => state.recents);
  const setTrip = useTrip((state) => state.setTrip);
  const addRecent = useTrip((state) => state.addRecent);
  const removeRecent = useTrip((state) => state.removeRecent);
  const resetResults = useResultsView((state) => state.reset);
  const permission = usePreferences((state) => state.locationPermission);

  const params = useLocalSearchParams<{ recent?: string }>();
  const [pickup, setPickup] = useState<FieldState>(() => initialField(storedPickup));
  const [dropoff, setDropoff] = useState<FieldState>(() =>
    initialField(recents.find((place) => place.id === params.recent) ?? storedDropoff),
  );
  const latestDropoff = useRef(dropoff.place);
  useEffect(() => {
    latestDropoff.current = dropoff.place;
  });
  const [focused, setFocused] = useState<Field>('dropoff');
  const [locate, setLocate] = useState<LocateState>('idle');
  const pickupRef = useRef<ComponentRef<typeof TextInput>>(null);
  const dropoffRef = useRef<ComponentRef<typeof TextInput>>(null);

  const active = focused === 'pickup' ? pickup : dropoff;
  const lastKnown = useDeviceLocation((state) => state.lastKnown);
  const bias = pickup.place ?? dropoff.place ?? lastKnown ?? defaultCenter;
  const search = usePlaceSearch(active.place ? '' : active.text, bias);

  const finish = (nextPickup: Place | null, nextDropoff: Place | null): boolean => {
    if (!nextPickup || !nextDropoff) {
      return false;
    }
    setTrip(nextPickup, nextDropoff);
    addRecent(nextDropoff);
    resetResults();
    haptics.success();
    router.back();
    return true;
  };

  const choose = (field: Field, place: Place) => {
    haptics.selection();
    const next = { place, text: place.name };
    if (field === 'pickup') {
      setPickup(next);
      if (!finish(place, dropoff.place)) {
        dropoffRef.current?.focus();
      }
    } else {
      setDropoff(next);
      if (!finish(pickup.place, place)) {
        pickupRef.current?.focus();
      }
    }
  };

  const pickCurrentLocation = async (field: Field, silent = false) => {
    setLocate('locating');
    const result = await locateDevice();
    if (result.status !== 'ok') {
      setLocate(result.status);
      return;
    }
    setLocate('idle');
    const place = currentLocationPlace(result.point);
    if (silent) {
      if (!finish(place, latestDropoff.current)) {
        setPickup((current) => (current.place ? current : { place, text: place.name }));
      }
      return;
    }
    choose(field, place);
  };

  const autoLocate = useRef(storedPickup === null && permission === 'granted');
  useEffect(() => {
    if (autoLocate.current) {
      autoLocate.current = false;
      void pickCurrentLocation('pickup', true);
    }
  });

  const editField = (field: Field, text: string) => {
    const update = { place: null, text };
    if (field === 'pickup') {
      setPickup(update);
    } else {
      setDropoff(update);
    }
  };

  const clearField = (field: Field) => {
    editField(field, '');
    (field === 'pickup' ? pickupRef : dropoffRef).current?.focus();
  };

  const swap = () => {
    haptics.selection();
    setPickup(dropoff);
    setDropoff(pickup);
  };

  const clearButton = (field: Field, state: FieldState) =>
    state.text.length > 0 && focused === field ? (
      <IconButton
        icon={XIcon}
        size={36}
        accessibilityLabel={field === 'pickup' ? 'Clear pickup' : 'Clear destination'}
        onPress={() => {
          clearField(field);
        }}
      />
    ) : undefined;

  const showSuggestions = active.place !== null || active.text.trim().length < MIN_QUERY_LENGTH;
  const recentChoices = recents.filter(
    (place) => place.id !== pickup.place?.id && place.id !== dropoff.place?.id,
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Plan your ride" />
      <Screen padTop={false} contentStyle={styles.content}>
        <View style={styles.fieldsRow}>
          <View style={styles.fields}>
            <SearchField
              ref={pickupRef}
              icon={CircleIcon}
              value={pickup.text}
              onChangeText={(text) => {
                editField('pickup', text);
              }}
              onFocus={() => {
                setFocused('pickup');
              }}
              placeholder="Pickup location"
              size="md"
              returnKeyType="search"
              autoCorrect={false}
              trailing={clearButton('pickup', pickup)}
              accessibilityLabel="Pickup"
            />
            <SearchField
              ref={dropoffRef}
              icon={SquareIcon}
              value={dropoff.text}
              onChangeText={(text) => {
                editField('dropoff', text);
              }}
              onFocus={() => {
                setFocused('dropoff');
              }}
              placeholder="Where to?"
              autoFocus
              size="md"
              returnKeyType="search"
              autoCorrect={false}
              trailing={clearButton('dropoff', dropoff)}
              accessibilityLabel="Destination"
            />
          </View>
          <IconButton
            icon={ArrowsDownUpIcon}
            accessibilityLabel="Swap pickup and destination"
            onPress={swap}
            size={44}
          />
        </View>

        {showSuggestions ? (
          <View>
            {focused === 'pickup' || !pickup.place ? (
              <ListRow
                title="Current location"
                subtitle={
                  locate === 'denied'
                    ? 'Location access is off for this app. Turn it on in Settings, or type an address.'
                    : locate === 'unavailable'
                      ? 'Couldn’t get a location fix. Check that Location Services is on, or type an address.'
                      : isCurrentLocation(pickup.place)
                        ? 'Selected as pickup'
                        : 'Use where you are now as pickup'
                }
                leading={<ListRowIcon icon={NavigationArrowIcon} />}
                trailing={
                  locate === 'locating' ? <ActivityIndicator color={colors.textPrimary} /> : null
                }
                disabled={locate === 'locating'}
                divider={recentChoices.length > 0}
                onPress={() => {
                  void pickCurrentLocation('pickup');
                }}
              />
            ) : null}
            {recentChoices.length > 0 ? (
              <>
                <SectionHeader title="Recent" style={styles.sectionHeader} />
                {recentChoices.map((place, index) => (
                  <ListRow
                    key={place.id}
                    title={place.name}
                    subtitle={place.address || undefined}
                    leading={<ListRowIcon icon={ClockCounterClockwiseIcon} />}
                    trailing={
                      <IconButton
                        icon={XIcon}
                        size={36}
                        accessibilityLabel={`Remove ${place.name} from recents`}
                        onPress={() => {
                          removeRecent(place.id);
                        }}
                      />
                    }
                    divider={index < recentChoices.length - 1}
                    onPress={() => {
                      choose(focused, place);
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
          <View accessibilityLiveRegion="polite">
            {search.places.map((place, index) => (
              <ListRow
                key={place.id}
                title={place.name}
                subtitle={place.address || undefined}
                leading={<ListRowIcon icon={MapPinIcon} />}
                divider={index < search.places.length - 1}
                onPress={() => {
                  choose(focused, place);
                }}
              />
            ))}
          </View>
        ) : search.isFetching || search.settling ? (
          <View style={styles.searching}>
            <ActivityIndicator color={colors.textPrimary} />
            <Text variant="caption" tone="secondary">
              Searching
            </Text>
          </View>
        ) : (
          <EmptyState
            icon={MapPinIcon}
            title="No matches"
            body="Try a street address, a business name or a landmark."
          />
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: space.lg,
  },
  fieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  fields: {
    flex: 1,
    gap: space.xs,
  },
  sectionHeader: {
    marginTop: space.sm,
  },
  searching: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.lg,
    justifyContent: 'center',
  },
});
