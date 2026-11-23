import { useDeviceLocation } from '@/stores/location';
import { MapLibreCanvas } from './MapLibreCanvas';
import type { MapCanvasProps } from './types';

export function MapCanvas({ showsUserLocation = false, ...props }: MapCanvasProps) {
  const lastKnown = useDeviceLocation((state) => state.lastKnown);
  return <MapLibreCanvas {...props} user={showsUserLocation ? lastKnown : null} />;
}
