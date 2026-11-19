import { describe, expect, it } from 'vitest';
import { places } from '../testDeps';
import { sampleRestaurants } from './catalog';
import {
  createOsmRestaurantSource,
  cuisineFromTag,
  guessCuisine,
  nearbyFromPhoton,
  parseOsmRestaurantId,
} from './osm';

const near = places.doloresPark;

function feature(
  type: 'N' | 'W',
  id: number,
  name: string | undefined,
  kind: string,
  lat: number,
  lon: number,
) {
  return {
    geometry: { coordinates: [lon, lat] },
    properties: {
      osm_type: type,
      osm_id: id,
      osm_value: kind,
      name,
      housenumber: '3500',
      street: '19th Street',
      city: 'San Francisco',
    },
  };
}

const byKind: Record<string, unknown[]> = {
  restaurant: [
    feature('N', 101, 'Real Taqueria', 'restaurant', 37.7601, -122.4262),
    feature('N', 102, 'Golden Lotus', 'restaurant', 37.7605, -122.4266),
    feature('N', 103, undefined, 'restaurant', 37.76, -122.42),
  ],
  fast_food: [feature('N', 101, 'Real Taqueria', 'fast_food', 37.7601, -122.4262)],
  cafe: [feature('W', 202, 'Corner Coffee', 'cafe', 37.7612, -122.4251)],
};

type Calls = { photon: string[]; nominatim: string[] };

function fakeFetch(calls: Calls, options: { photonStatus?: number } = {}): typeof fetch {
  return (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.host === 'photon.test') {
      calls.photon.push(url.searchParams.get('osm_tag') ?? '');
      const kind = (url.searchParams.get('osm_tag') ?? '').split(':')[1] ?? '';
      return Promise.resolve(
        new Response(JSON.stringify({ features: byKind[kind] ?? [] }), {
          status: options.photonStatus ?? 200,
        }),
      );
    }
    calls.nominatim.push(url.searchParams.get('osm_ids') ?? '');
    return Promise.resolve(
      new Response(
        JSON.stringify([
          {
            osm_type: 'node',
            osm_id: 102,
            lat: '37.7605',
            lon: '-122.4266',
            type: 'restaurant',
            name: 'Golden Lotus',
            extratags: { cuisine: 'vietnamese' },
            address: { house_number: '1', road: 'Valencia Street', city: 'San Francisco' },
          },
        ]),
      ),
    );
  };
}

function source(calls: Calls, options: { photonStatus?: number } = {}) {
  return createOsmRestaurantSource(
    {
      photonUrl: 'https://photon.test',
      nominatimUrl: 'https://nominatim.test',
      userAgent: 'test',
      timeoutMs: 1000,
      fetch: fakeFetch(calls, options),
      sleep: () => Promise.resolve(),
    },
    sampleRestaurants,
  );
}

describe('OpenStreetMap restaurants', () => {
  it('maps cuisine tags and guesses from names', () => {
    expect(cuisineFromTag('japanese;sushi')).toBe('sushi');
    expect(cuisineFromTag('Greek')).toBe('mediterranean');
    expect(cuisineFromTag('unknown_food')).toBeNull();
    expect(guessCuisine('Pizza Due', 'restaurant')).toBe('pizza');
    expect(guessCuisine('Pho Huynh Hiep', 'restaurant')).toBe('vietnamese');
    expect(guessCuisine('Linea', 'cafe')).toBe('cafe');
    expect(guessCuisine('Bandit', 'restaurant')).toBe('american');
  });

  it('reads Photon places and skips unnamed ones', () => {
    expect(nearbyFromPhoton(byKind.cafe?.[0])).toMatchObject({
      id: 'osm_w202',
      lookupKey: 'W202',
      name: 'Corner Coffee',
      address: '3500 19th Street, San Francisco',
    });
    expect(nearbyFromPhoton(byKind.restaurant?.[2])).toBeNull();
  });

  it('round-trips ids', () => {
    expect(parseOsmRestaurantId('osm_w202')).toEqual({ type: 'W', id: 202 });
    expect(parseOsmRestaurantId('r_1_2_0')).toBeNull();
  });

  it('lists real places once, uses OpenStreetMap cuisine tags, and caches the area', async () => {
    const calls: Calls = { photon: [], nominatim: [] };
    const restaurants = source(calls);
    const results = await restaurants.search({ near });
    expect(results.map((entry) => entry.name).sort()).toEqual([
      'Corner Coffee',
      'Golden Lotus',
      'Real Taqueria',
    ]);
    expect(results.find((entry) => entry.name === 'Golden Lotus')?.cuisine).toBe('vietnamese');
    expect(results.find((entry) => entry.name === 'Real Taqueria')?.cuisine).toBe('mexican');
    expect(results.every((entry) => entry.source === 'openstreetmap' && entry.photo)).toBe(true);
    await restaurants.search({ near, cuisine: 'cafe' });
    expect(calls.photon).toHaveLength(3);
    expect(calls.nominatim).toHaveLength(1);
    expect((await restaurants.find('osm_n101', near))?.name).toBe('Real Taqueria');
    expect(calls.nominatim).toHaveLength(1);
  });

  it('looks up a restaurant it has not seen by id', async () => {
    const calls: Calls = { photon: [], nominatim: [] };
    const found = await source(calls).find('osm_n102');
    expect(found).toMatchObject({
      name: 'Golden Lotus',
      cuisine: 'vietnamese',
      address: '1 Valencia Street, San Francisco',
    });
    expect(calls.nominatim).toEqual(['N102']);
  });

  it('falls back to sample restaurants when the service fails', async () => {
    const calls: Calls = { photon: [], nominatim: [] };
    const results = await source(calls, { photonStatus: 503 }).search({ near });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((entry) => entry.source === 'sample')).toBe(true);
  });
});
