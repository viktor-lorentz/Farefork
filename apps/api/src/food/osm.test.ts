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

function fakeFetch(
  calls: Calls,
  options: { photonStatus?: number; nominatimStatus?: number } = {},
): typeof fetch {
  return (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.host === 'photon.test' && url.pathname === '/api/') {
      calls.photon.push(`q:${url.searchParams.get('q') ?? ''}`);
      return Promise.resolve(
        new Response(
          JSON.stringify({
            features: [
              feature('N', 501, 'Zuni Café', 'restaurant', 37.7735, -122.4216),
              feature('N', 502, 'Zuni Cafe Annex', 'restaurant', 40.7, -74.0),
            ],
          }),
        ),
      );
    }
    if (url.host === 'photon.test') {
      const tags = url.searchParams.getAll('osm_tag');
      calls.photon.push(tags.join(','));
      const features = tags.flatMap((tag) => byKind[tag.split(':')[1] ?? ''] ?? []);
      return Promise.resolve(
        new Response(JSON.stringify({ features }), {
          status: options.photonStatus ?? 200,
        }),
      );
    }
    const searched = url.pathname === '/search';
    calls.nominatim.push(
      searched
        ? `search:${url.searchParams.get('amenity') ?? url.searchParams.get('q') ?? ''}`
        : (url.searchParams.get('osm_ids') ?? ''),
    );
    if (searched && url.searchParams.get('amenity') !== 'restaurant') {
      return Promise.resolve(new Response('[]', { status: options.nominatimStatus ?? 200 }));
    }
    return Promise.resolve(
      new Response(
        JSON.stringify([
          {
            category: 'amenity',
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
        { status: options.nominatimStatus ?? 200 },
      ),
    );
  };
}

function source(calls: Calls, options: { photonStatus?: number; nominatimStatus?: number } = {}) {
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
    expect(guessCuisine('Zuni Café', 'restaurant')).toBe('american');
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
    expect(calls.photon).toHaveLength(7);
    expect(calls.nominatim).toHaveLength(1);
    expect((await restaurants.find('osm_n101', near))?.name).toBe('Real Taqueria');
    expect(calls.nominatim).toHaveLength(1);
  });

  it('finds restaurants by name farther away, ignoring accents, and skips distant cities', async () => {
    const calls: Calls = { photon: [], nominatim: [] };
    const results = await source(calls).search({ near, text: 'zuni cafe' });
    expect(results.map((entry) => entry.name)).toEqual(['Zuni Café']);
    await source(calls).search({ near, text: 'z' });
    expect(calls.photon.filter((call) => call.startsWith('q:'))).toEqual(['q:zuni cafe']);
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

  it('uses Nominatim when Photon is down', async () => {
    const calls: Calls = { photon: [], nominatim: [] };
    const results = await source(calls, { photonStatus: 503 }).search({ near });
    expect(results.map((entry) => entry.name)).toEqual(['Golden Lotus']);
    expect(results[0]?.cuisine).toBe('vietnamese');
    expect(calls.nominatim).toEqual(['search:restaurant', 'search:fast_food', 'search:cafe']);
  });

  it('falls back to sample restaurants when every map service fails', async () => {
    const calls: Calls = { photon: [], nominatim: [] };
    const results = await source(calls, { photonStatus: 503, nominatimStatus: 503 }).search({
      near,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((entry) => entry.source === 'sample')).toBe(true);
  });

  it('fixes cuisines when slow lookups finish after the first response', async () => {
    const calls: Calls = { photon: [], nominatim: [] };
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const slowFetch = fakeFetch(calls);
    const restaurants = createOsmRestaurantSource({
      photonUrl: 'https://photon.test',
      nominatimUrl: 'https://nominatim.test',
      userAgent: 'test',
      timeoutMs: 1000,
      sleep: () => Promise.resolve(),
      fetch: async (input, init) => {
        const url = new URL(input instanceof Request ? input.url : String(input));
        if (url.host === 'nominatim.test') {
          await gate;
        }
        return slowFetch(input, init);
      },
    });
    const first = await restaurants.search({ near });
    expect(first.find((entry) => entry.name === 'Golden Lotus')?.cuisine).toBe('american');
    release();
    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = await restaurants.search({ near });
    expect(second.find((entry) => entry.name === 'Golden Lotus')?.cuisine).toBe('vietnamese');
  });
});
