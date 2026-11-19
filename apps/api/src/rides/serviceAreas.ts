import type { LatLng, RideProviderId } from '@repo/shared';

export type ServiceArea = {
  id: string;
  name: string;
  bookVia: RideProviderId;
  ring: readonly (readonly [longitude: number, latitude: number])[];
};

export const waymoServiceAreas: readonly ServiceArea[] = [
  {
    id: 'sf-bay',
    name: 'San Francisco Bay Area',
    bookVia: 'waymo',
    ring: [
      [-122.52, 37.81],
      [-122.36, 37.81],
      [-122.36, 37.7],
      [-122.2, 37.55],
      [-122.03, 37.38],
      [-122.1, 37.33],
      [-122.4, 37.55],
      [-122.52, 37.7],
    ],
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    bookVia: 'waymo',
    ring: [
      [-112.35, 33.7],
      [-111.6, 33.7],
      [-111.6, 33.25],
      [-112.35, 33.25],
    ],
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    bookVia: 'waymo',
    ring: [
      [-118.55, 34.12],
      [-118.2, 34.12],
      [-118.2, 33.92],
      [-118.55, 33.92],
    ],
  },
  {
    id: 'austin',
    name: 'Austin',
    bookVia: 'uber',
    ring: [
      [-97.85, 30.42],
      [-97.65, 30.42],
      [-97.65, 30.2],
      [-97.85, 30.2],
    ],
  },
  {
    id: 'atlanta',
    name: 'Atlanta',
    bookVia: 'uber',
    ring: [
      [-84.48, 33.86],
      [-84.3, 33.86],
      [-84.3, 33.7],
      [-84.48, 33.7],
    ],
  },
];

export function pointInRing(point: LatLng, ring: ServiceArea['ring']): boolean {
  let inside = false;
  const x = point.longitude;
  const y = point.latitude;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const a = ring[i];
    const b = ring[j];
    if (!a || !b) {
      continue;
    }
    const [xi, yi] = a;
    const [xj, yj] = b;
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) {
      inside = !inside;
    }
  }
  return inside;
}

export function areaServing(
  areas: readonly ServiceArea[],
  pickup: LatLng,
  dropoff: LatLng,
): ServiceArea | undefined {
  return areas.find((area) => pointInRing(pickup, area.ring) && pointInRing(dropoff, area.ring));
}
