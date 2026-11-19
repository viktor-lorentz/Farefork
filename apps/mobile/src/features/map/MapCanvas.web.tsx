import 'maplibre-gl/dist/maplibre-gl.css';
import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import { useEffect, useRef, type ComponentRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/design/theme';
import { mapPalettes } from './palette';
import { defaultZoom, type MapCanvasProps } from './types';
import { webMapStyle } from './webMapStyle';

setWorkerUrl('/maplibre-gl-worker.mjs');

export function MapCanvas({ center, zoom = defaultZoom, insets, style }: MapCanvasProps) {
  const { scheme } = useTheme();
  const containerRef = useRef<ComponentRef<typeof View>>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initial = useRef({ center, zoom, scheme });

  useEffect(() => {
    const element = containerRef.current as unknown as HTMLElement | null;
    if (!element) {
      return;
    }
    const map = new MapLibreMap({
      container: element,
      style: webMapStyle(mapPalettes[initial.current.scheme]),
      center: [initial.current.center.longitude, initial.current.center.latitude],
      zoom: initial.current.zoom,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });
    map.touchZoomRotate.disableRotation();
    mapRef.current = map;
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
    mapRef.current?.setStyle(webMapStyle(mapPalettes[scheme]));
  }, [scheme]);

  useEffect(() => {
    mapRef.current?.setPadding({
      top: insets?.top ?? 0,
      right: insets?.right ?? 0,
      bottom: insets?.bottom ?? 0,
      left: insets?.left ?? 0,
    });
  }, [insets?.top, insets?.right, insets?.bottom, insets?.left]);

  return (
    <View
      style={[StyleSheet.absoluteFill, style]}
      accessibilityLabel="Map"
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
