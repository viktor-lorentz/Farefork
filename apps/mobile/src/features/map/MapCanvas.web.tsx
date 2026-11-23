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
import { iconSize, radius, space, typeScale } from '@/design/tokens';
import { fontFamilies } from '@/design/tokens/typography';
import { duration } from '@/design/tokens/motion';
import { useDeviceLocation } from '@/stores/location';
import { CUISINE_ICON_VIEWBOX, cuisineIconPaths } from './cuisineIcons';
import { mapPalettes } from './palette';
import {
  defaultZoom,
  framePadding,
  type MapCanvasProps,
  type MapInsets,
  type MapPlace,
  type MapTrip,
  placeFocusZoom,
  resolveInsets,
} from './types';
import { TRIP_SOURCE, tripGeoJSON, webMapStyle } from './webMapStyle';

setWorkerUrl('/maplibre-gl-worker.mjs');

const noPadding: MapInsets = { top: 0, right: 0, bottom: 0, left: 0 };

function fitTrip(map: MapLibreMap, trip: MapTrip, insets: MapInsets, animate: boolean) {
  const bounds = boundsOf(trip.path.length > 1 ? trip.path : [trip.pickup, trip.dropoff]);
  if (!bounds) {
    return;
  }
  map.setPadding(noPadding);
  map.fitBounds(
    [
      [bounds.west, bounds.south],
      [bounds.east, bounds.north],
    ],
    {
      padding: framePadding(insets, {
        width: map.getContainer().clientWidth,
        height: map.getContainer().clientHeight,
      }),
      maxZoom: 16,
      duration: animate ? duration.scene : 0,
    },
  );
}

const SVG_NS = 'http://www.w3.org/2000/svg';

type MarkerColors = {
  fill: string;
  ring: string;
  icon: string;
  shadow: string;
  selectedFill: string;
  selectedIcon: string;
  tipFill: string;
  tipText: string;
  tipMuted: string;
};
const MARKER = space.xl;
const MARKER_SELECTED = space.xxl;

function tooltipElement(place: MapPlace, colors: MarkerColors): HTMLDivElement {
  const tip = document.createElement('div');
  tip.setAttribute('role', 'tooltip');
  Object.assign(tip.style, {
    position: 'absolute',
    bottom: `calc(100% + ${space.xs}px)`,
    left: '50%',
    transform: `translate(-50%, ${space.xxs}px)`,
    padding: `${space.xs}px ${space.sm}px`,
    borderRadius: `${radius.md}px`,
    background: colors.tipFill,
    boxShadow: colors.shadow,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: '0',
    transition: `opacity ${duration.fast}ms ease-out, transform ${duration.fast}ms ease-out`,
    font: `600 ${typeScale.label.fontSize}px/${typeScale.label.lineHeight}px ${fontFamilies.system ?? 'system-ui'}`,
    color: colors.tipText,
    textAlign: 'left',
  });
  const name = document.createElement('div');
  name.textContent = place.name;
  tip.appendChild(name);
  const detail = document.createElement('div');
  detail.textContent = place.detail ?? cuisineLabels[place.cuisine];
  Object.assign(detail.style, {
    font: `400 ${typeScale.caption.fontSize}px/${typeScale.caption.lineHeight}px ${fontFamilies.system ?? 'system-ui'}`,
    color: colors.tipMuted,
    fontVariantNumeric: 'tabular-nums',
  });
  tip.appendChild(detail);
  return tip;
}

type PlaceHandle = { element: HTMLDivElement; setSelected: (selected: boolean) => void };

function placeElement(
  place: MapPlace,
  colors: MarkerColors,
  onPress: (id: string) => void,
): PlaceHandle {
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, { cursor: 'pointer' });
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute(
    'aria-label',
    `${place.name}, ${place.detail ?? cuisineLabels[place.cuisine]}`,
  );
  Object.assign(button.style, {
    width: `${MARKER}px`,
    height: `${MARKER}px`,
    padding: '0',
    borderRadius: `${radius.round}px`,
    border: `1px solid ${colors.ring}`,
    background: colors.fill,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: colors.shadow,
    transition: `transform ${duration.fast}ms ease-out, width ${duration.fast}ms ease-out, height ${duration.fast}ms ease-out`,
  });
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${CUISINE_ICON_VIEWBOX} ${CUISINE_ICON_VIEWBOX}`);
  svg.setAttribute('width', String(iconSize.sm));
  svg.setAttribute('height', String(iconSize.sm));
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', cuisineIconPaths[place.cuisine]);
  path.setAttribute('fill', colors.icon);
  svg.appendChild(path);
  button.appendChild(svg);
  const tip = tooltipElement(place, colors);
  const showTip = (visible: boolean) => {
    tip.style.opacity = visible ? '1' : '0';
    tip.style.transform = visible ? 'translate(-50%, 0)' : `translate(-50%, ${space.xxs}px)`;
    wrapper.style.zIndex = visible ? '2' : '';
    button.style.transform = visible ? 'scale(1.1)' : 'scale(1)';
  };
  button.addEventListener('mouseenter', () => {
    showTip(true);
  });
  button.addEventListener('mouseleave', () => {
    showTip(false);
  });
  button.addEventListener('focus', () => {
    showTip(true);
  });
  button.addEventListener('blur', () => {
    showTip(false);
  });
  wrapper.addEventListener('click', (event) => {
    event.stopPropagation();
    onPress(place.id);
  });
  wrapper.appendChild(button);
  wrapper.appendChild(tip);
  return {
    element: wrapper,
    setSelected: (selected) => {
      const size = selected ? MARKER_SELECTED : MARKER;
      button.style.width = `${size}px`;
      button.style.height = `${size}px`;
      button.style.background = selected ? colors.selectedFill : colors.fill;
      button.style.borderColor = selected ? colors.selectedFill : colors.ring;
      path.setAttribute('fill', selected ? colors.selectedIcon : colors.icon);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      if (selected) {
        wrapper.style.zIndex = '1';
      } else if (tip.style.opacity !== '1') {
        wrapper.style.zIndex = '';
      }
    },
  };
}

export function MapCanvas({
  center,
  zoom = defaultZoom,
  insets,
  trip,
  places,
  onPlacePress,
  selectedPlaceId = null,
  onMapPress,
  showsUserLocation = false,
  style,
}: MapCanvasProps) {
  const { colors, scheme, elevation } = useTheme();
  const onPlacePressRef = useRef(onPlacePress);
  const onMapPressRef = useRef(onMapPress);
  const handlesRef = useRef(new Map<string, PlaceHandle>());
  const selectedRef = useRef(selectedPlaceId);
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
    onMapPressRef.current = onMapPress;
    selectedRef.current = selectedPlaceId;
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
    map.on('click', (event) => {
      const target = event.originalEvent.target;
      if (target instanceof Element && target.closest('.maplibregl-marker')) {
        return;
      }
      onMapPressRef.current?.();
    });
    mapRef.current = map;
    const canvas = map.getCanvasContainer();
    canvas.style.opacity = '0';
    canvas.style.transition = `opacity ${duration.slow}ms ease-out`;
    map.once('load', () => {
      canvas.style.opacity = '1';
    });
    if (tripRef.current) {
      fitTrip(map, tripRef.current, paddingRef.current, false);
    } else {
      map.setPadding(paddingRef.current);
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
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const next = {
      top: padding.top,
      right: padding.right,
      bottom: padding.bottom,
      left: padding.left,
    };
    if (tripRef.current) {
      fitTrip(map, tripRef.current, next, !reducedMotion);
    } else {
      map.easeTo({ padding: next, duration: reducedMotion ? 0 : duration.base });
    }
  }, [padding.top, padding.right, padding.bottom, padding.left, reducedMotion]);

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
      fitTrip(map, trip, paddingRef.current, !reducedMotion);
    } else {
      map.easeTo({ padding: paddingRef.current, duration: 0 });
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
    map.easeTo({
      center: target,
      zoom,
      padding: paddingRef.current,
      duration: reducedMotion ? 0 : duration.slow,
    });
  }, [center.latitude, center.longitude, zoom, reducedMotion]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }
    const markerColors: MarkerColors = {
      fill: colors.surface,
      ring: colors.border,
      icon: colors.textPrimary,
      shadow: elevation.raised,
      selectedFill: colors.accent,
      selectedIcon: colors.onAccent,
      tipFill: colors.surfaceRaised,
      tipText: colors.textPrimary,
      tipMuted: colors.textSecondary,
    };
    const handles = handlesRef.current;
    const markers = (trip ? [] : (places ?? [])).map((place) => {
      const handle = placeElement(place, markerColors, (id) => {
        onPlacePressRef.current?.(id);
      });
      handle.setSelected(place.id === selectedRef.current);
      handles.set(place.id, handle);
      return new MapLibreMarker({ element: handle.element })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map);
    });
    return () => {
      markers.forEach((marker) => marker.remove());
      handles.clear();
    };
  }, [
    places,
    trip,
    colors.surface,
    colors.border,
    colors.textPrimary,
    colors.accent,
    colors.onAccent,
    colors.surfaceRaised,
    colors.textSecondary,
    elevation.raised,
  ]);

  useEffect(() => {
    handlesRef.current.forEach((handle, id) => {
      handle.setSelected(id === selectedPlaceId);
    });
    const map = mapRef.current;
    const place = places?.find((entry) => entry.id === selectedPlaceId);
    if (!map || !place || tripRef.current) {
      return;
    }
    map.easeTo({
      center: [place.longitude, place.latitude],
      zoom: Math.max(map.getZoom(), placeFocusZoom),
      padding: paddingRef.current,
      duration: reducedMotion ? 0 : duration.slow,
    });
  }, [selectedPlaceId, places, reducedMotion]);

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: mapPalettes[scheme].land }, style]}
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
