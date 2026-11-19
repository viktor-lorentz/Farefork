import type { LatLng } from '@repo/shared';
import type { StyleProp, ViewStyle } from 'react-native';

export type { LatLng };

export type MapInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type MapTrip = {
  pickup: LatLng;
  dropoff: LatLng;
  path: readonly LatLng[];
};

export type MapCanvasProps = {
  center: LatLng;
  zoom?: number;
  insets?: Partial<MapInsets>;
  showsUserLocation?: boolean;
  trip?: MapTrip | null;
  style?: StyleProp<ViewStyle>;
};

export const defaultCenter: LatLng = { latitude: 37.7793, longitude: -122.4193 };
export const defaultZoom = 13.2;
export const fitPadding = 56;

export function resolveInsets(insets: Partial<MapInsets> | undefined): MapInsets {
  return {
    top: insets?.top ?? 0,
    right: insets?.right ?? 0,
    bottom: insets?.bottom ?? 0,
    left: insets?.left ?? 0,
  };
}
