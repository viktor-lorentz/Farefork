import { decodePolyline, type LatLng } from '@repo/shared';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Sheet, type SheetHandle, SheetScrollView } from '@/design/components';
import { CrosshairIcon } from '@/design/icons';
import { useIsDesktopLayout } from '@/design/layout';
import { useTheme } from '@/design/theme';
import { layout, space } from '@/design/tokens';
import { HomePanel } from '@/features/home/HomePanel';
import { MapCanvas } from '@/features/map/MapCanvas';
import { defaultCenter, defaultZoom, type MapTrip, placesZoom } from '@/features/map/types';
import { useRestaurants } from '@/features/food/queries';
import { useDeliveryAddress } from '@/features/food/useDeliveryAddress';
import { useVertical } from '@/features/home/useVertical';
import { locateDevice } from '@/features/rides/location';
import { BOOKING_BAR_SPACE, RideBookingBar } from '@/features/rides/RideBookingBar';
import { RideResults } from '@/features/rides/RideResults';
import { useRideQuotes } from '@/features/rides/useRideQuotes';
import { haptics } from '@/lib/haptics';
import { useDeviceLocation } from '@/stores/location';
import { useTrip } from '@/stores/trip';

function useTripQuotes() {
  const pickup = useTrip((state) => state.pickup);
  const dropoff = useTrip((state) => state.dropoff);
  return useRideQuotes(pickup, dropoff);
}

function useMapTrip(): MapTrip | null {
  const pickup = useTrip((state) => state.pickup);
  const dropoff = useTrip((state) => state.dropoff);
  const { data } = useTripQuotes();
  const polyline = data?.route.polyline;
  return useMemo(() => {
    if (!pickup || !dropoff) {
      return null;
    }
    return {
      pickup: { latitude: pickup.latitude, longitude: pickup.longitude },
      dropoff: { latitude: dropoff.latitude, longitude: dropoff.longitude },
      path: polyline !== undefined ? decodePolyline(polyline) : [],
    };
  }, [pickup, dropoff, polyline]);
}

export default function HomeScreen() {
  const desktop = useIsDesktopLayout();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const trip = useMapTrip();
  const quotes = useTripQuotes();
  const router = useRouter();
  const [center, setCenter] = useState<LatLng>(
    () => useDeviceLocation.getState().lastKnown ?? defaultCenter,
  );
  const vertical = useVertical((state) => state.vertical);
  const deliveryAddress = useDeliveryAddress();
  const foodMode = trip === null && vertical === 'food';
  const foodCenter = deliveryAddress ?? center;
  const nearbyRestaurants = useRestaurants(foodMode ? foodCenter : null, '', null);
  const places = useMemo(
    () => (foodMode ? (nearbyRestaurants.data?.restaurants ?? []) : []),
    [foodMode, nearbyRestaurants.data],
  );
  const mapCenter = foodMode ? foodCenter : center;
  const mapZoom = foodMode ? placesZoom : defaultZoom;
  const openPlace = (id: string) => {
    haptics.light();
    router.push({ pathname: '/food/[id]', params: { id } });
  };

  useEffect(() => {
    void locateDevice({ prompt: false }).then((result) => {
      if (result.status === 'ok') {
        setCenter(result.point);
      }
    });
  }, []);

  const locateButton = (
    <IconButton
      icon={CrosshairIcon}
      accessibilityLabel="Center on my location"
      variant="raised"
      onPress={() => {
        haptics.light();
        void locateDevice().then((result) => {
          if (result.status === 'ok') {
            setCenter(result.point);
          } else {
            haptics.warning();
          }
        });
      }}
    />
  );
  const { height } = useWindowDimensions();
  const sheetRef = useRef<SheetHandle>(null);
  const hasTrip = trip !== null;
  const resultsHeight = Math.max(layout.sheetPeek, Math.round(height * layout.sheetResultsRatio));
  const refresh = trip ? (
    <RefreshControl
      refreshing={quotes.isRefetching}
      tintColor={colors.textTertiary}
      onRefresh={() => {
        haptics.light();
        void quotes.refetch();
      }}
    />
  ) : undefined;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      sheetRef.current?.snapToIndex(hasTrip ? 1 : 0);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [hasTrip]);

  const panel = trip ? <RideResults /> : <HomePanel />;

  if (desktop) {
    return (
      <View style={[styles.desktop, { backgroundColor: colors.background }]}>
        <View style={styles.desktopMap}>
          <MapCanvas
            center={mapCenter}
            zoom={mapZoom}
            trip={trip}
            places={places}
            onPlacePress={openPlace}
            showsUserLocation
          />
          {trip ? null : (
            <View style={[styles.mapControls, { top: space.md }]}>{locateButton}</View>
          )}
        </View>
        <View
          style={[
            styles.desktopPanel,
            { borderLeftColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <ScrollView contentContainerStyle={styles.desktopPanelContent} refreshControl={refresh}>
            {panel}
          </ScrollView>
          {trip ? <RideBookingBar /> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mobile, { backgroundColor: colors.background }]}>
      <MapCanvas
        center={mapCenter}
        zoom={mapZoom}
        trip={trip}
        places={places}
        onPlacePress={openPlace}
        insets={{
          top: insets.top,
          bottom: (hasTrip ? resultsHeight : layout.sheetPeek) - layout.mapSheetOverlap,
        }}
        showsUserLocation
      />
      {trip ? null : (
        <View style={[styles.mapControls, { top: insets.top + space.sm }]}>{locateButton}</View>
      )}
      <Sheet
        ref={sheetRef}
        snapPoints={[layout.sheetPeek, resultsHeight, `${layout.sheetMaxRatio * 100}%`]}
        topInset={insets.top}
        footer={trip ? <RideBookingBar /> : undefined}
      >
        <SheetScrollView
          refreshControl={refresh}
          contentContainerStyle={[
            styles.sheetContent,
            trip ? { paddingBottom: BOOKING_BAR_SPACE + insets.bottom + space.lg } : null,
          ]}
        >
          {panel}
        </SheetScrollView>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  mobile: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    right: layout.gutter,
  },
  sheetContent: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.xs,
    paddingBottom: space.xxl,
  },
  desktop: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopMap: {
    flex: 1,
  },
  desktopPanel: {
    width: layout.panelWidth,
    flexGrow: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  desktopPanelContent: {
    padding: layout.gutterWide - space.xs,
  },
});
