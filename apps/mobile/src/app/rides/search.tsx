import type { Place } from '@repo/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import {
  EmptyState,
  IconButton,
  ListRow,
  ListRowIcon,
  ScreenHeader,
  SectionHeader,
  Text,
} from '@/design/components';
import {
  ClockCounterClockwiseIcon,
  HeartIcon,
  MapPinIcon,
  NavigationArrowIcon,
  WarningCircleIcon,
  XIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { controlHeight, layout, radius, space } from '@/design/tokens';
import { duration, easing } from '@/design/tokens/motion';
import { useFavorites } from '@/features/account/queries';
import { defaultCenter } from '@/features/map/types';
import { currentLocationPlace, locateDevice } from '@/features/rides/location';
import { highlightSegments } from '@/features/rides/placeText';
import { TripFieldsCard, type TripField } from '@/features/rides/TripFieldsCard';
import { MIN_QUERY_LENGTH, usePlaceSearch } from '@/features/rides/usePlaceSearch';
import { useResultsView } from '@/features/rides/useResultsView';
import { haptics } from '@/lib/haptics';
import { useDeviceLocation } from '@/stores/location';
import { usePreferences } from '@/stores/preferences';
import { isCurrentLocation, useTrip } from '@/stores/trip';

type Field = TripField;
type LocateState = 'idle' | 'locating' | 'denied' | 'unavailable';

type FieldState = {
  place: Place | null;
  text: string;
};

function initialField(place: Place | null): FieldState {
  return { place, text: place?.name ?? '' };
}

function HighlightedTitle({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightSegments(text, query).map((segment, index) => (
        <Text
          key={index}
          variant={segment.match ? 'bodyStrong' : 'body'}
          tone={segment.match ? 'primary' : 'secondary'}
        >
          {segment.text}
        </Text>
      ))}
    </>
  );
}

export default function RideSearchScreen() {
  const router = useRouter();
  const { colors, elevation } = useTheme();
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
  const [initialFocus] = useState<Field>(() =>
    dropoff.place && !pickup.place ? 'pickup' : 'dropoff',
  );
  const [focused, setFocused] = useState<Field>(initialFocus);
  const favorites = useFavorites();
  const savedRoutes = (favorites.data ?? []).flatMap((row) => (row.kind === 'route' ? [row] : []));
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

  const showSuggestions = active.place !== null || active.text.trim().length < MIN_QUERY_LENGTH;
  const recentChoices = recents.filter(
    (place) => place.id !== pickup.place?.id && place.id !== dropoff.place?.id,
  );

  return (
    <KeyboardAvoidingView style={styles.root} behavior="padding">
      <Animated.View
        entering={FadeIn.duration(duration.base)}
        exiting={FadeOut.duration(duration.fast)}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Close ride planner"
          onPress={() => {
            router.back();
          }}
        />
      </Animated.View>
      <Animated.View
        entering={SlideInUp.duration(duration.slow).easing(easing.decelerate)}
        exiting={SlideOutUp.duration(duration.base).easing(easing.accelerate)}
        style={[styles.panel, { backgroundColor: colors.background, boxShadow: elevation.raised }]}
      >
        <ScreenHeader title="Plan your ride" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
        >
          <TripFieldsCard
            pickupText={pickup.text}
            dropoffText={dropoff.text}
            focused={focused}
            autoFocus={initialFocus}
            pickupRef={pickupRef}
            dropoffRef={dropoffRef}
            onChange={editField}
            onFocus={setFocused}
            onClear={clearField}
            onSwap={swap}
          />

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
                  onPress={() => {
                    void pickCurrentLocation('pickup');
                  }}
                />
              ) : null}
              {savedRoutes.length > 0 ? (
                <>
                  <SectionHeader title="Saved" style={styles.sectionHeader} />
                  {savedRoutes.map((row, index) => (
                    <ListRow
                      key={row.id}
                      title={row.title}
                      subtitle={row.subtitle ?? undefined}
                      leading={<ListRowIcon icon={HeartIcon} />}
                      divider={index < savedRoutes.length - 1}
                      onPress={() => {
                        const { pickup: savedPickup, dropoff: savedDropoff } = row.payload;
                        if (savedPickup) {
                          setPickup({ place: savedPickup, text: savedPickup.name });
                          setDropoff({ place: savedDropoff, text: savedDropoff.name });
                          haptics.selection();
                          finish(savedPickup, savedDropoff);
                          return;
                        }
                        choose('dropoff', savedDropoff);
                      }}
                    />
                  ))}
                </>
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
                          size={controlHeight.sm}
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
                  titleContent={<HighlightedTitle text={place.name} query={active.text} />}
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
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  panel: {
    flexShrink: 1,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    gap: space.lg,
    paddingHorizontal: layout.gutter,
    paddingTop: space.md,
    paddingBottom: space.xl,
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
