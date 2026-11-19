import { decodePolyline, type LatLng } from '@repo/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Sheet, type SheetHandle, SheetScrollView } from '@/design/components';
import { CrosshairIcon } from '@/design/icons';
import { useIsDesktopLayout } from '@/design/layout';
import { useTheme } from '@/design/theme';
import { layout, space } from '@/design/tokens';
import { HomePanel } from '@/features/home/HomePanel';
import { MapCanvas } from '@/features/map/MapCanvas';
import { defaultCenter, type MapTrip } from '@/features/map/types';
import { locateDevice } from '@/features/rides/location';
import { RideBookingBar, RideResults } from '@/features/rides/RideResults';
import { useRideQuotes } from '@/features/rides/useRideQuotes';
import { haptics } from '@/lib/haptics';
import { useTrip } from '@/stores/trip';

const SHEET_PEEK = 380;
const SHEET_RESULTS = 0.68;
const BOOKING_BAR_HEIGHT = 81;

function useMapTrip(): MapTrip | null {
  const pickup = useTrip((state) => state.pickup);
  const dropoff = useTrip((state) => state.dropoff);
  const { data } = useRideQuotes(pickup, dropoff);
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
  const [center, setCenter] = useState<LatLng>(defaultCenter);
  const { height } = useWindowDimensions();
  const sheetRef = useRef<SheetHandle>(null);
  const hasTrip = trip !== null;
  const resultsHeight = Math.max(SHEET_PEEK, Math.round(height * SHEET_RESULTS));

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
          <MapCanvas center={center} trip={trip} />
        </View>
        <View
          style={[
            styles.desktopPanel,
            { borderLeftColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <ScrollView contentContainerStyle={styles.desktopPanelContent}>{panel}</ScrollView>
          {trip ? <RideBookingBar /> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mobile, { backgroundColor: colors.background }]}>
      <MapCanvas
        center={center}
        trip={trip}
        insets={{ top: insets.top, bottom: (hasTrip ? resultsHeight : SHEET_PEEK) - 40 }}
        showsUserLocation
      />
      {trip ? null : (
        <View style={[styles.mapControls, { top: insets.top + space.sm }]}>
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
        </View>
      )}
      <Sheet
        ref={sheetRef}
        snapPoints={[SHEET_PEEK, resultsHeight, '88%']}
        topInset={insets.top}
        footer={trip ? <RideBookingBar /> : undefined}
      >
        <SheetScrollView
          contentContainerStyle={[
            styles.sheetContent,
            trip ? { paddingBottom: BOOKING_BAR_HEIGHT + space.lg } : null,
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
