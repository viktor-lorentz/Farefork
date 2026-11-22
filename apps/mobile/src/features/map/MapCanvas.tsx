import { useEffect, useMemo, useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { PixelRatio, Platform, StyleSheet, View } from 'react-native';
import { cuisineLabels } from '@repo/shared';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/design/theme';
import { iconSize, radius, space } from '@/design/tokens';
import { duration } from '@/design/tokens/motion';
import { CUISINE_ICON_VIEWBOX, cuisineIconPaths } from './cuisineIcons';
import { googleMapStyle } from './googleMapStyle';
import { mapPalettes } from './palette';
import {
  defaultZoom,
  fitPadding,
  type MapCanvasProps,
  type MapPlace,
  resolveInsets,
} from './types';

const MAX_NATIVE_PLACES = 60;

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

function PlaceMarker({
  place,
  fill,
  ring,
  icon,
}: {
  place: MapPlace;
  fill: string;
  ring: string;
  icon: string;
}) {
  return (
    <View style={[styles.place, { backgroundColor: fill, borderColor: ring }]}>
      <Svg
        width={iconSize.sm}
        height={iconSize.sm}
        viewBox={`0 0 ${CUISINE_ICON_VIEWBOX} ${CUISINE_ICON_VIEWBOX}`}
      >
        <Path d={cuisineIconPaths[place.cuisine]} fill={icon} />
      </Svg>
    </View>
  );
}

export function MapCanvas({
  center,
  zoom = defaultZoom,
  insets,
  showsUserLocation = false,
  trip,
  places,
  onPlacePress,
  style,
}: MapCanvasProps) {
  const shownPlaces = trip ? [] : (places ?? []).slice(0, MAX_NATIVE_PLACES);
  const { scheme, colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const mapRef = useRef<MapView>(null);
  const palette = mapPalettes[scheme];
  const customStyle = useMemo(() => googleMapStyle(palette), [palette]);
  const tiles = useSharedValue(0);
  const tilesStyle = useAnimatedStyle(() => ({ opacity: tiles.value }));
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
    <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.land }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, tilesStyle]}>
        <MapView
          ref={mapRef}
          onMapLoaded={() => {
            tiles.set(reducedMotion ? 1 : withTiming(1, { duration: duration.slow }));
          }}
          key={isAndroid ? scheme : 'map'}
          style={StyleSheet.absoluteFill}
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
                <>
                  <Polyline
                    coordinates={[...trip.path]}
                    strokeColor={palette.routeCasing}
                    strokeWidth={8}
                    lineCap="round"
                    lineJoin="round"
                  />
                  <Polyline
                    coordinates={[...trip.path]}
                    strokeColor={palette.route}
                    strokeWidth={4}
                    lineCap="round"
                    lineJoin="round"
                  />
                </>
              ) : null}
              <Marker
                key={`pickup-${scheme}`}
                coordinate={trip.pickup}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                accessibilityLabel="Pickup"
              >
                <PickupMarker ring={palette.route} fill={palette.routeCasing} />
              </Marker>
              <Marker
                key={`dropoff-${scheme}`}
                coordinate={trip.dropoff}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                accessibilityLabel="Destination"
              >
                <DropoffMarker fill={palette.route} border={palette.routeCasing} />
              </Marker>
            </>
          ) : null}
          {shownPlaces.map((place) => (
            <Marker
              key={`${place.id}-${scheme}`}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              accessibilityLabel={`${place.name}, ${cuisineLabels[place.cuisine]}`}
              onPress={() => {
                onPlacePress?.(place.id);
              }}
            >
              <PlaceMarker
                place={place}
                fill={colors.surface}
                ring={colors.border}
                icon={colors.textPrimary}
              />
            </Marker>
          ))}
        </MapView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  place: {
    width: space.xl,
    height: space.xl,
    borderRadius: radius.round,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickup: {
    width: space.md + space.xxs / 2,
    height: space.md + space.xxs / 2,
    borderRadius: radius.round,
    borderWidth: space.xxs + 1,
  },
  dropoff: {
    width: space.md + space.xxs / 2,
    height: space.md + space.xxs / 2,
    borderRadius: space.xxs - 1,
    borderWidth: space.xxs / 2,
  },
});
