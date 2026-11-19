import { useEffect, useMemo, useRef } from 'react';
import { PixelRatio, Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@/design/theme';
import { googleMapStyle } from './googleMapStyle';
import { mapPalettes } from './palette';
import { defaultZoom, fitPadding, type MapCanvasProps, resolveInsets } from './types';

function zoomToDelta(zoom: number): number {
  return 360 / 2 ** zoom;
}

const isAndroid = Platform.OS === 'android';

function devicePixels(value: number): number {
  return isAndroid ? PixelRatio.getPixelSizeForLayoutSize(value) : value;
}

function PickupMarker({ ring, fill }: { ring: string; fill: string }) {
  return <View style={[styles.pickup, { borderColor: ring, backgroundColor: fill }]} />;
}

function DropoffMarker({ fill, border }: { fill: string; border: string }) {
  return <View style={[styles.dropoff, { backgroundColor: fill, borderColor: border }]} />;
}

export function MapCanvas({
  center,
  zoom = defaultZoom,
  insets,
  showsUserLocation = false,
  trip,
  style,
}: MapCanvasProps) {
  const { scheme, colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const mapRef = useRef<MapView>(null);
  const customStyle = useMemo(() => googleMapStyle(mapPalettes[scheme]), [scheme]);
  const delta = zoomToDelta(zoom);
  const padding = resolveInsets(insets);
  const firstCenter = useRef(true);

  useEffect(() => {
    if (!trip) {
      return;
    }
    const coordinates = trip.path.length > 1 ? [...trip.path] : [trip.pickup, trip.dropoff];
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: {
        top: devicePixels(fitPadding),
        right: devicePixels(fitPadding),
        bottom: devicePixels(fitPadding),
        left: devicePixels(fitPadding),
      },
      animated: !reducedMotion,
    });
  }, [trip, reducedMotion]);

  useEffect(() => {
    if (firstCenter.current) {
      firstCenter.current = false;
      return;
    }
    if (trip) {
      return;
    }
    mapRef.current?.animateToRegion(
      {
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      reducedMotion ? 0 : 400,
    );
  }, [center.latitude, center.longitude, delta, trip, reducedMotion]);

  return (
    <MapView
      ref={mapRef}
      key={isAndroid ? scheme : 'map'}
      style={[StyleSheet.absoluteFill, style]}
      provider={isAndroid ? PROVIDER_GOOGLE : undefined}
      initialRegion={{
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      }}
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
      userInterfaceStyle={scheme}
      customMapStyle={isAndroid ? customStyle : undefined}
      showsUserLocation={showsUserLocation}
      showsPointsOfInterests={false}
      showsBuildings={false}
      showsTraffic={false}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      mapPadding={padding}
      accessibilityLabel={trip ? 'Map showing your route' : 'Map'}
    >
      {trip ? (
        <>
          {trip.path.length > 1 ? (
            <Polyline
              coordinates={[...trip.path]}
              strokeColor={colors.primary}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          ) : null}
          <Marker
            key={`pickup-${scheme}`}
            coordinate={trip.pickup}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            accessibilityLabel="Pickup"
          >
            <PickupMarker ring={colors.primary} fill={colors.background} />
          </Marker>
          <Marker
            key={`dropoff-${scheme}`}
            coordinate={trip.dropoff}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            accessibilityLabel="Destination"
          >
            <DropoffMarker fill={colors.primary} border={colors.background} />
          </Marker>
        </>
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  pickup: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 5,
  },
  dropoff: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
  },
});
