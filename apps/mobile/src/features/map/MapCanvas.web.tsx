import 'maplibre-gl/dist/maplibre-gl.css';
import { boundsOf } from '@repo/shared';
import { type GeoJSONSource, Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import { useEffect, useRef, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '@/design/theme';
import { useDeviceLocation } from '@/stores/location';
import { mapPalettes } from './palette';
import { defaultZoom, fitPadding, type MapCanvasProps, type MapTrip, resolveInsets } from './types';
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

export function MapCanvas({
  center,
  zoom = defaultZoom,
  insets,
  trip,
  showsUserLocation = false,
  style,
}: MapCanvasProps) {
  const lastKnown = useDeviceLocation((state) => state.lastKnown);
  const user = showsUserLocation ? lastKnown : null;
  const userRef = useRef(user);
  const { scheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<ComponentRef<typeof View>>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initial = useRef({ center, zoom, scheme });
  const tripRef = useRef(trip);
  const padding = resolveInsets(insets);
  const paddingRef = useRef(padding);

  useEffect(() => {
    tripRef.current = trip;
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
    if (Math.abs(current.lng - target[0]) < 1e-6 && Math.abs(current.lat - target[1]) < 1e-6) {
      return;
    }
    map.easeTo({ center: target, duration: reducedMotion ? 0 : 400 });
  }, [center.latitude, center.longitude, reducedMotion]);

  return (
    <View
      style={[StyleSheet.absoluteFill, style]}
      accessibilityLabel={trip ? 'Map showing your route' : 'Map'}
      accessibilityRole="image"
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
