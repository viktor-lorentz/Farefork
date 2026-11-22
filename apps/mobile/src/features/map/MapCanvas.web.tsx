import 'maplibre-gl/dist/maplibre-gl.css';
import { boundsOf, cuisineLabels } from '@repo/shared';
import {
  type GeoJSONSource,
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  setWorkerUrl,
} from 'maplibre-gl';
import { useEffect, useRef, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@/design/theme';
import { useDeviceLocation } from '@/stores/location';
import { CUISINE_ICON_VIEWBOX, cuisineIconPaths } from './cuisineIcons';
import { mapPalettes } from './palette';
import {
  defaultZoom,
  fitPadding,
  type MapCanvasProps,
  type MapPlace,
  type MapTrip,
  resolveInsets,
} from './types';
import { TRIP_SOURCE, tripGeoJSON, webMapStyle } from './webMapStyle';

setWorkerUrl('/maplibre-gl-worker.mjs');

function fitTrip(map: MapLibreMap, trip: MapTrip, animate: boolean) {
  const bounds = boundsOf(trip.path.length > 1 ? trip.path : [trip.pickup, trip.dropoff]);
  if (!bounds) {
    return;
  }
  map.fitBounds(
    [
      [bounds.west, bounds.south],
      [bounds.east, bounds.north],
    ],
    {
      padding: fitPadding,
      maxZoom: 16,
      duration: animate ? 600 : 0,
    },
  );
}

const SVG_NS = 'http://www.w3.org/2000/svg';

type MarkerColors = { fill: string; ring: string; icon: string };

function placeElement(
  place: MapPlace,
  colors: MarkerColors,
  onPress: (id: string) => void,
): HTMLDivElement {
  const wrapper = document.createElement('div');
  const button = document.createElement('button');
  button.type = 'button';
  button.title = place.name;
  button.setAttribute('aria-label', `${place.name}, ${cuisineLabels[place.cuisine]}`);
  Object.assign(button.style, {
    width: '30px',
    height: '30px',
    padding: '0',
    borderRadius: '15px',
    border: `1.5px solid ${colors.ring}`,
    background: colors.fill,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
    transition: 'transform 120ms ease-out',
  });
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${CUISINE_ICON_VIEWBOX} ${CUISINE_ICON_VIEWBOX}`);
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', cuisineIconPaths[place.cuisine]);
  path.setAttribute('fill', colors.icon);
  svg.appendChild(path);
  button.appendChild(svg);
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.15)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onPress(place.id);
  });
  wrapper.appendChild(button);
  return wrapper;
}

export function MapCanvas({
  center,
  zoom = defaultZoom,
  insets,
  trip,
  places,
  onPlacePress,
  showsUserLocation = false,
  style,
}: MapCanvasProps) {
  const { colors, scheme } = useTheme();
  const onPlacePressRef = useRef(onPlacePress);
  const lastKnown = useDeviceLocation((state) => state.lastKnown);
  const user = showsUserLocation ? lastKnown : null;
  const userRef = useRef(user);
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<ComponentRef<typeof View>>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initial = useRef({ center, zoom, scheme });
  const tripRef = useRef(trip);
  const padding = resolveInsets(insets);
  const paddingRef = useRef(padding);

  useEffect(() => {
    tripRef.current = trip;
    onPlacePressRef.current = onPlacePress;
    paddingRef.current = padding;
    userRef.current = user;
  });

  useEffect(() => {
    const element = containerRef.current as unknown as HTMLElement | null;
    if (!element) {
      return;
    }
    const map = new MapLibreMap({
      container: element,
      style: webMapStyle(mapPalettes[initial.current.scheme], tripRef.current, userRef.current),
      center: [initial.current.center.longitude, initial.current.center.latitude],
      zoom: initial.current.zoom,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
    if (tripRef.current) {
      map.setPadding(paddingRef.current);
      fitTrip(map, tripRef.current, false);
    }
    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (scheme === initial.current.scheme && mapRef.current?.isStyleLoaded() !== true) {
      return;
    }
    mapRef.current?.setStyle(webMapStyle(mapPalettes[scheme], tripRef.current, userRef.current));
  }, [scheme]);

  useEffect(() => {
    mapRef.current?.setPadding({
      top: padding.top,
      right: padding.right,
      bottom: padding.bottom,
      left: padding.left,
    });
  }, [padding.top, padding.right, padding.bottom, padding.left]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const source = map.getSource<GeoJSONSource>(TRIP_SOURCE);
    if (source) {
      void source.setData(tripGeoJSON(trip, userRef.current));
    } else {
      map.once('idle', () => {
        void map
          .getSource<GeoJSONSource>(TRIP_SOURCE)
          ?.setData(tripGeoJSON(tripRef.current, userRef.current));
      });
    }
    if (trip) {
      fitTrip(map, trip, !reducedMotion);
    }
  }, [trip, reducedMotion]);

  useEffect(() => {
    void mapRef.current
      ?.getSource<GeoJSONSource>(TRIP_SOURCE)
      ?.setData(tripGeoJSON(tripRef.current, user));
  }, [user]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || tripRef.current) {
      return;
    }
    const target: [number, number] = [center.longitude, center.latitude];
    const current = map.getCenter();
    if (
      Math.abs(current.lng - target[0]) < 1e-6 &&
      Math.abs(current.lat - target[1]) < 1e-6 &&
      Math.abs(map.getZoom() - zoom) < 0.01
    ) {
      return;
    }
    map.easeTo({ center: target, zoom, duration: reducedMotion ? 0 : 400 });
  }, [center.latitude, center.longitude, zoom, reducedMotion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const markerColors = { fill: colors.surface, ring: colors.primary, icon: colors.textPrimary };
    const markers = (trip ? [] : (places ?? [])).map((place) =>
      new MapLibreMarker({
        element: placeElement(place, markerColors, (id) => {
          onPlacePressRef.current?.(id);
        }),
      })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map),
    );
    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [places, trip, colors.surface, colors.primary, colors.textPrimary]);

  return (
    <View
      style={[StyleSheet.absoluteFill, style]}
      accessibilityLabel={
        trip
          ? 'Map showing your route'
          : places && places.length > 0
            ? `Map with ${places.length} nearby restaurants`
            : 'Map'
      }
      accessibilityRole={places && places.length > 0 ? undefined : 'image'}
    >
      <View ref={containerRef} style={styles.fill} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
});
