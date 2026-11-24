import { useEffect, useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { cuisineLabels } from '@repo/shared';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/design/theme';
import { iconSize, radius, space } from '@/design/tokens';
import { duration, easing } from '@/design/tokens/motion';
import { CUISINE_ICON_VIEWBOX, cuisineIconPaths } from './cuisineIcons';
import { mapPalettes } from './palette';
import {
  defaultZoom,
  fitPadding,
  type MapCanvasProps,
  type MapPlace,
  placeFocusZoom,
  resolveInsets,
} from './types';

const MAX_NATIVE_PLACES = 60;

function zoomToDelta(zoom: number): number {
  return 360 / 2 ** zoom;
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
  selected,
}: {
  place: MapPlace;
  fill: string;
  ring: string;
  icon: string;
  selected: boolean;
}) {
  return (
    <View
      style={[
        styles.place,
        selected && styles.placeSelected,
        { backgroundColor: fill, borderColor: ring },
      ]}
    >
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
  selectedPlaceId = null,
  onMapPress,
  style,
}: MapCanvasProps) {
  const shownPlaces = trip ? [] : (places ?? []).slice(0, MAX_NATIVE_PLACES);
  const { scheme, colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const mapRef = useRef<MapView>(null);
  const palette = mapPalettes[scheme];
  const tiles = useSharedValue(0);
  const tilesStyle = useAnimatedStyle(() => ({ opacity: tiles.value }));
  const delta = zoomToDelta(zoom);
  const padding = resolveInsets(insets);
  const firstCenter = useRef(true);
  const selectedPlace = shownPlaces.find((place) => place.id === selectedPlaceId);
  const selectedLatitude = selectedPlace?.latitude;
  const selectedLongitude = selectedPlace?.longitude;
  useEffect(() => {
    if (selectedLatitude === undefined || selectedLongitude === undefined) {
      return;
    }
    const focus = zoomToDelta(Math.max(zoom, placeFocusZoom));
    mapRef.current?.animateToRegion(
      {
        latitude: selectedLatitude,
        longitude: selectedLongitude,
        latitudeDelta: focus,
        longitudeDelta: focus,
      },
      reducedMotion ? 0 : duration.slow,
    );
  }, [selectedLatitude, selectedLongitude, zoom, reducedMotion]);

  useEffect(() => {
    if (!trip) {
      return;
    }
    const coordinates = trip.path.length > 1 ? [...trip.path] : [trip.pickup, trip.dropoff];
    mapRef.current?.fitToCoordinates(coordinates, {
      edgePadding: {
        top: fitPadding,
        right: fitPadding,
        bottom: fitPadding,
        left: fitPadding,
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
            tiles.set(
              reducedMotion ? 1 : withTiming(1, { duration: duration.slow, easing: easing.out }),
            );
          }}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta: delta,
            longitudeDelta: delta,
          }}
          mapType="mutedStandard"
          userInterfaceStyle={scheme}
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
          onPress={(event) => {
            if (event.nativeEvent.action !== 'marker-press') {
              onMapPress?.();
            }
          }}
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
          {shownPlaces.map((place) => {
            const selected = place.id === selectedPlaceId;
            return (
              <Marker
                key={`${place.id}-${scheme}-${selected ? 'on' : 'off'}`}
                zIndex={selected ? 1 : 0}
                coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                accessibilityLabel={`${place.name}, ${cuisineLabels[place.cuisine]}`}
                onPress={(event) => {
                  event.stopPropagation();
                  onPlacePress?.(place.id);
                }}
              >
                <PlaceMarker
                  place={place}
                  selected={selected}
                  fill={selected ? colors.accent : colors.surface}
                  ring={selected ? colors.accent : colors.border}
                  icon={selected ? colors.onAccent : colors.textPrimary}
                />
              </Marker>
            );
          })}
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
  placeSelected: {
    width: space.xxl,
    height: space.xxl,
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
