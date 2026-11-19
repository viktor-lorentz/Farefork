import { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '@/design/theme';
import { googleMapStyle } from './googleMapStyle';
import { mapPalettes } from './palette';
import { defaultZoom, type MapCanvasProps } from './types';

function zoomToDelta(zoom: number): number {
  return 360 / 2 ** zoom;
}

export function MapCanvas({
  center,
  zoom = defaultZoom,
  insets,
  showsUserLocation = false,
  style,
}: MapCanvasProps) {
  const { scheme } = useTheme();
  const customStyle = useMemo(() => googleMapStyle(mapPalettes[scheme]), [scheme]);
  const delta = zoomToDelta(zoom);
  const isAndroid = Platform.OS === 'android';

  return (
    <MapView
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
      mapPadding={{
        top: insets?.top ?? 0,
        right: insets?.right ?? 0,
        bottom: insets?.bottom ?? 0,
        left: insets?.left ?? 0,
      }}
      accessibilityLabel="Map"
    />
  );
}
