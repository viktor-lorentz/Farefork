import type { LatLng, Place } from '@repo/shared';
import * as Location from 'expo-location';
import { useDeviceLocation } from '@/stores/location';
import { CURRENT_LOCATION_ID } from '@/stores/trip';
import { usePreferences } from '@/stores/preferences';
import { currentLocationPermission, requestLocationPermission } from '@/lib/permissions';

const LOCATE_TIMEOUT_MS = 10_000;

export type LocateResult =
  { status: 'ok'; point: LatLng } | { status: 'denied' } | { status: 'unavailable' };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, ms);
    }),
  ]);
}

export async function locateDevice(options: { prompt?: boolean } = {}): Promise<LocateResult> {
  const permission =
    options.prompt === false
      ? await currentLocationPermission()
      : await requestLocationPermission();
  usePreferences.getState().setLocationPermission(permission);
  if (permission !== 'granted') {
    return { status: 'denied' };
  }
  try {
    const recent = await Location.getLastKnownPositionAsync({ maxAge: 2 * 60 * 1000 });
    const position =
      recent ??
      (await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        LOCATE_TIMEOUT_MS,
      ));
    if (!position) {
      return { status: 'unavailable' };
    }
    const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    useDeviceLocation.getState().setLastKnown(point);
    return { status: 'ok', point };
  } catch {
    return { status: 'unavailable' };
  }
}

export function currentLocationPlace(point: LatLng): Place {
  return {
    id: CURRENT_LOCATION_ID,
    name: 'Current location',
    address: `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`,
    latitude: point.latitude,
    longitude: point.longitude,
  };
}
