import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/design/theme';
import { useDeviceLocation } from '@/stores/location';
import MapDom from './MapDom';
import { mapPalettes } from './palette';
import type { MapCanvasProps } from './types';

export function MapCanvas({ showsUserLocation = false, style, ...props }: MapCanvasProps) {
  const { scheme } = useTheme();
  const lastKnown = useDeviceLocation((state) => state.lastKnown);
  const land = mapPalettes[scheme].land;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: land }, style]}>
      <MapDom
        {...props}
        scheme={scheme}
        user={showsUserLocation ? lastKnown : null}
        dom={{
          style: [styles.web, { backgroundColor: land }],
          scrollEnabled: false,
          overScrollMode: 'never',
          bounces: false,
          matchContents: false,
          geolocationEnabled: false,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  web: {
    flex: 1,
  },
});
