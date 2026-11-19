import type { AppDeps } from './app';
import { createMockGeocoder } from './geo/geocoder';
import { createEstimateRouter } from './geo/router';
import { createMockRideProviders } from './rides/providers/mock';

export const fixedNow = new Date('2026-11-18T18:00:00.000Z');

export function testDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    geocoder: createMockGeocoder(),
    router: createEstimateRouter(),
    rideProviders: createMockRideProviders(),
    now: () => fixedNow,
    ...overrides,
  };
}

export const places = {
  ferryBuilding: { latitude: 37.7955, longitude: -122.3937 },
  doloresPark: { latitude: 37.7596, longitude: -122.427 },
  oaklandAirport: { latitude: 37.7126, longitude: -122.2197 },
  texasCapitol: { latitude: 30.2747, longitude: -97.7404 },
  zilkerPark: { latitude: 30.267, longitude: -97.7729 },
  timesSquare: { latitude: 40.758, longitude: -73.9855 },
  jfk: { latitude: 40.6413, longitude: -73.7781 },
} as const;
