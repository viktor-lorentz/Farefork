import type { StyleProp, ViewStyle } from 'react-native';

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type MapInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type MapCanvasProps = {
  center: LatLng;
  zoom?: number;
  insets?: Partial<MapInsets>;
  showsUserLocation?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const defaultCenter: LatLng = { latitude: 37.7793, longitude: -122.4193 };
export const defaultZoom = 13.2;
