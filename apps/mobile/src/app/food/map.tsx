import { type RestaurantSummary } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdaptiveGlass, IconButton, PressableScale, Text } from '@/design/components';
import { ArrowLeftIcon, CaretRightIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { iconSize, layout, radius, space } from '@/design/tokens';
import { easing } from '@/design/tokens/motion';
import { estimatedMinutes, priceLevelLabel, restaurantMeta } from '@/features/food/format';
import { useRestaurants } from '@/features/food/queries';
import { RestaurantPhoto } from '@/features/food/RestaurantPhoto';
import { useDeliveryAddress } from '@/features/food/useDeliveryAddress';
import { MapCanvas } from '@/features/map/MapCanvas';
import { defaultCenter, type MapPlace, placesZoom } from '@/features/map/types';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import { haptics } from '@/lib/haptics';
import { useDeviceLocation } from '@/stores/location';
import { cuisineLabels, formatMiles } from '@repo/shared';

const MAX_PLACES = 60;
const CARD_GAP = space.sm;
const PANEL_RATIO = 0.5;

function placeDetail(restaurant: RestaurantSummary): string {
  const eta = estimatedMinutes(restaurant);
  return `${cuisineLabels[restaurant.cuisine]} · ${priceLevelLabel(restaurant.priceLevel)} · ${eta}–${eta + 10} min`;
}

function PlaceCard({
  restaurant,
  width,
  onOpen,
}: {
  restaurant: RestaurantSummary;
  width: number;
  onOpen: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${restaurant.name}, ${restaurantMeta(restaurant)}`}
      accessibilityHint="Opens the menu and price comparison"
      onPress={onOpen}
      style={[styles.card, { width, backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <RestaurantPhoto restaurant={restaurant} style={styles.photo} />
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text variant="titleS" numberOfLines={1} style={styles.cardTitle}>
            {restaurant.name}
          </Text>
          <CaretRightIcon size={iconSize.sm} color={colors.textTertiary} weight="bold" />
        </View>
        <Text variant="caption" tone="secondary" tabular numberOfLines={1}>
          {placeDetail(restaurant)} · {formatMiles(restaurant.distanceMeters)}
        </Text>
        {restaurant.address !== null ? (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {restaurant.address}
          </Text>
        ) : null}
        <View style={styles.providers}>
          {restaurant.providerIds.map((id) => (
            <ProviderLogo key={id} providerId={id} size={space.lg} decorative />
          ))}
          <Text variant="caption" tone="secondary">
            Compare on {restaurant.providerIds.length}{' '}
            {restaurant.providerIds.length === 1 ? 'app' : 'apps'}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

export default function FoodMapScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const address = useDeliveryAddress();
  const [fallbackCenter] = useState(() => useDeviceLocation.getState().lastKnown ?? defaultCenter);
  const center = address ?? fallbackCenter;
  const query = useRestaurants(center, '', null);
  const restaurants = useMemo(
    () => (query.data?.restaurants ?? []).slice(0, MAX_PLACES),
    [query.data],
  );
  const places = useMemo<MapPlace[]>(
    () =>
      restaurants.map((restaurant) => ({
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        detail: placeDetail(restaurant),
      })),
    [restaurants],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<FlatList<RestaurantSummary>>(null);
  const settledIndex = useRef(-1);
  const panelHeight = Math.round(height * PANEL_RATIO);
  const cardWidth = Math.min(width - layout.gutter * 2, layout.contentMaxWidth);
  const stride = cardWidth + CARD_GAP;
  const selectedIndex = restaurants.findIndex((restaurant) => restaurant.id === selectedId);
  const open = selectedIndex >= 0;

  useEffect(() => {
    if (selectedIndex < 0 || selectedIndex === settledIndex.current) {
      return;
    }
    settledIndex.current = selectedIndex;
    listRef.current?.scrollToOffset({ offset: selectedIndex * stride, animated: true });
  }, [selectedIndex, stride]);

  const onSettle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / stride);
    const next = restaurants[Math.max(0, Math.min(index, restaurants.length - 1))];
    if (next && next.id !== selectedId) {
      settledIndex.current = index;
      haptics.selection();
      setSelectedId(next.id);
    }
  };

  const openRestaurant = (id: string) => {
    haptics.light();
    router.push({ pathname: '/food/[id]', params: { id } });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <MapCanvas
        center={center}
        zoom={placesZoom}
        places={places}
        selectedPlaceId={selectedId}
        onPlacePress={(id) => {
          haptics.selection();
          setSelectedId(id);
        }}
        onMapPress={() => {
          settledIndex.current = -1;
          setSelectedId(null);
        }}
        insets={{ top: insets.top, bottom: open ? panelHeight - space.lg : 0 }}
        showsUserLocation
      />

      <View style={[styles.topBar, { top: insets.top + space.sm }]} pointerEvents="box-none">
        <IconButton
          icon={ArrowLeftIcon}
          accessibilityLabel="Back"
          variant="raised"
          onPress={() => {
            router.back();
          }}
        />
        <AdaptiveGlass style={styles.titlePill}>
          <Text variant="labelStrong" numberOfLines={1}>
            {address ? `Near ${address.name}` : 'Restaurants nearby'}
          </Text>
        </AdaptiveGlass>
      </View>

      {open ? (
        <Animated.View
          entering={SlideInDown.duration(280).easing(easing.sheet)}
          exiting={SlideOutDown.duration(200).easing(easing.out)}
          style={[
            styles.panel,
            {
              height: panelHeight,
              paddingBottom: Math.max(insets.bottom, space.md),
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.panelHeader}>
            <Text variant="caption" tone="secondary" tabular>
              {selectedIndex + 1} of {restaurants.length}
            </Text>
            <Text variant="caption" tone="tertiary">
              Swipe for more
            </Text>
          </View>
          <FlatList
            ref={listRef}
            data={restaurants}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={stride}
            decelerationRate="fast"
            disableIntervalMomentum
            initialScrollIndex={selectedIndex}
            getItemLayout={(_, index) => ({ length: stride, offset: stride * index, index })}
            contentContainerStyle={styles.carousel}
            ItemSeparatorComponent={CardGap}
            onMomentumScrollEnd={onSettle}
            onScrollEndDrag={(event) => {
              if (process.env.EXPO_OS === 'web') {
                onSettle(event);
              }
            }}
            renderItem={({ item }) => (
              <PlaceCard
                restaurant={item}
                width={cardWidth}
                onOpen={() => {
                  openRestaurant(item.id);
                }}
              />
            )}
          />
        </Animated.View>
      ) : restaurants.length > 0 ? (
        <Animated.View
          entering={FadeIn.duration(220).easing(easing.out)}
          exiting={FadeOut.duration(160).easing(easing.out)}
          style={[styles.hintWrap, { bottom: Math.max(insets.bottom, space.md) + space.xl }]}
          pointerEvents="none"
        >
          <AdaptiveGlass style={styles.hint}>
            <Text variant="label" tabular>
              {restaurants.length} places. Tap one to see it
            </Text>
          </AdaptiveGlass>
        </Animated.View>
      ) : null}
    </View>
  );
}

function CardGap() {
  return <View style={styles.gap} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    left: layout.gutter,
    right: layout.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  titlePill: {
    flexShrink: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.round,
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: space.sm,
    gap: space.sm,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderCurve: 'continuous',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: layout.gutter + space.xxs,
  },
  carousel: {
    paddingHorizontal: layout.gutter,
  },
  gap: {
    width: CARD_GAP,
  },
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  photo: {
    flex: 1,
    minHeight: space.huge,
  },
  cardBody: {
    padding: space.md,
    gap: space.xxs,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  cardTitle: {
    flex: 1,
  },
  providers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingTop: space.xs,
  },
  hintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hint: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.round,
  },
});
