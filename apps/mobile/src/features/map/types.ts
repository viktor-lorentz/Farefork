import type { Cuisine, LatLng } from '@repo/shared';
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

export type MapPlace = {
  id: string;
  name: string;
  cuisine: Cuisine;
  latitude: number;
  longitude: number;
};

export type MapCanvasProps = {
  center: LatLng;
  zoom?: number;
  insets?: Partial<MapInsets>;
  showsUserLocation?: boolean;
  trip?: MapTrip | null;
  places?: readonly MapPlace[];
  onPlacePress?: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};

export const defaultCenter: LatLng = { latitude: 37.7793, longitude: -122.4193 };
export const defaultZoom = 13.2;
export const placesZoom = 14.8;
export const fitPadding = 56;
const minVisible = 80;

export type MapSize = { width: number; height: number };

function clampPair(start: number, end: number, available: number): [number, number] {
  const total = start + end;
  if (total <= available || total <= 0) {
    return [start, end];
  }
  const ratio = Math.max(available, 0) / total;
  return [Math.floor(start * ratio), Math.floor(end * ratio)];
}

export function framePadding(insets: MapInsets, size: MapSize): MapInsets {
  const [top, bottom] = clampPair(
    insets.top + fitPadding,
    insets.bottom + fitPadding,
    size.height - minVisible,
  );
  const [left, right] = clampPair(
    insets.left + fitPadding,
    insets.right + fitPadding,
    size.width - minVisible,
  );
  return { top, right, bottom, left };
}

export function resolveInsets(insets: Partial<MapInsets> | undefined): MapInsets {
  return {
    top: insets?.top ?? 0,
    right: insets?.right ?? 0,
    bottom: insets?.bottom ?? 0,
    left: insets?.left ?? 0,
  };
}
