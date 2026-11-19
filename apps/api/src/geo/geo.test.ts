import { decodePolyline } from '@repo/shared';
import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../lib/ttlCache';
import { createPhotonGeocoder, placeFromPhoton, UpstreamError } from './geocoder';
import { createNominatimGeocoder, withGeocoderFallback } from './nominatim';
import {
  createEstimateRouter,
  createOsrmRouter,
  type Router,
  withFallback,
  withRouteCache,
} from './router';

const from = { latitude: 37.7955, longitude: -122.3937 };
const to = { latitude: 37.7596, longitude: -122.427 };

function urlOf(input: string | URL | Request): string {
  return input instanceof Request ? input.url : input.toString();
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('placeFromPhoton', () => {
  it('uses the name and builds an address from the rest', () => {
    expect(
      placeFromPhoton({
        geometry: { coordinates: [-122.3937, 37.7955] },
        properties: {
          osm_type: 'W',
          osm_id: 123,
          name: 'Ferry Building',
          housenumber: '1',
          street: 'Ferry Building',
          city: 'San Francisco',
          state: 'California',
        },
      }),
    ).toEqual({
      id: 'osm:W123',
      name: 'Ferry Building',
      address: '1 Ferry Building, San Francisco, California',
      latitude: 37.7955,
      longitude: -122.3937,
    });
  });

  it('falls back to the street line for unnamed addresses', () => {
    const place = placeFromPhoton({
      geometry: { coordinates: [-122.4, 37.7] },
      properties: { housenumber: '500', street: 'Market St', city: 'San Francisco' },
    });
    expect(place?.name).toBe('500 Market St');
    expect(place?.address).toBe('San Francisco');
    expect(place?.id).toBe('pt:37.70000,-122.40000');
  });

  it('drops features with nothing to show', () => {
    expect(placeFromPhoton({ geometry: { coordinates: [0, 0] }, properties: {} })).toBeNull();
  });
});

describe('createPhotonGeocoder', () => {
  it('sends the bias and user agent, then caches the result', async () => {
    const fetchMock = vi.fn((_input: string | URL | Request, _init?: RequestInit) =>
      Promise.resolve(
        jsonResponse({
          features: [
            {
              geometry: { coordinates: [-122.39, 37.79] },
              properties: { name: 'Ferry Building', city: 'San Francisco' },
            },
            {
              geometry: { coordinates: [-122.39, 37.79] },
              properties: { name: 'Ferry Building', city: 'San Francisco' },
            },
            {
              geometry: { coordinates: [-122.4, 37.8] },
              properties: { osm_type: 'W', osm_id: 1, name: 'Pier 1', street: 'A' },
            },
            {
              geometry: { coordinates: [-122.4, 37.8] },
              properties: { osm_type: 'W', osm_id: 1, name: 'Pier 1', street: 'B' },
            },
            {
              geometry: { coordinates: [-3.7, 40.4] },
              properties: { name: 'Valencia Street', city: 'Madrid' },
            },
            { geometry: { coordinates: 'bad' }, properties: {} },
          ],
        }),
      ),
    );
    const geocoder = createPhotonGeocoder({
      baseUrl: 'https://photon.example',
      userAgent: 'test-agent',
      timeoutMs: 1000,
      fetch: fetchMock,
    });
    const query = { text: 'ferry', near: from, limit: 5 };
    const places = await geocoder.search(query);
    await geocoder.search(query);
    expect(places.map((place) => place.name)).toEqual(['Ferry Building', 'Pier 1']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, init] = fetchMock.mock.calls[0]!;
    const url = new URL(urlOf(input));
    expect(url.origin).toBe('https://photon.example');
    expect(url.searchParams.get('q')).toBe('ferry');
    expect(url.searchParams.get('lat')).toBe('37.7955');
    expect(new Headers(init?.headers).get('User-Agent')).toBe('test-agent');
  });

  it('wraps failures as upstream errors', async () => {
    const geocoder = createPhotonGeocoder({
      baseUrl: 'https://photon.example',
      userAgent: 'test',
      timeoutMs: 1000,
      fetch: () => Promise.resolve(jsonResponse({}, 503)),
    });
    await expect(geocoder.search({ text: 'x y', limit: 3 })).rejects.toBeInstanceOf(UpstreamError);
  });
});

describe('routers', () => {
  it('estimates a straight-line route', async () => {
    const route = await createEstimateRouter().route(from, to);
    expect(route.source).toBe('estimate');
    expect(route.distanceMeters).toBeGreaterThan(6000);
    expect(decodePolyline(route.polyline)).toHaveLength(2);
  });

  it('parses an OSRM response', async () => {
    const router = createOsrmRouter({
      baseUrl: 'https://osrm.example',
      userAgent: 'test',
      timeoutMs: 1000,
      fetch: (input) => {
        expect(urlOf(input)).toContain(
          '/route/v1/driving/-122.393700,37.795500;-122.427000,37.759600',
        );
        return Promise.resolve(
          jsonResponse({
            code: 'Ok',
            routes: [{ distance: 6123.4, duration: 901.6, geometry: 'abc' }],
          }),
        );
      },
    });
    expect(await router.route(from, to)).toEqual({
      distanceMeters: 6123,
      durationSeconds: 902,
      polyline: 'abc',
      source: 'osrm',
    });
  });

  it('falls back when OSRM finds no route', async () => {
    const osrm = createOsrmRouter({
      baseUrl: 'https://osrm.example',
      userAgent: 'test',
      timeoutMs: 1000,
      fetch: () => Promise.resolve(jsonResponse({ code: 'NoRoute' })),
    });
    const onFallback = vi.fn();
    const route = await withFallback(osrm, createEstimateRouter(), onFallback).route(from, to);
    expect(route.source).toBe('estimate');
    expect(onFallback).toHaveBeenCalledOnce();
  });

  it('caches routes by coordinates', async () => {
    const estimate = createEstimateRouter();
    const spy = vi.fn((a: typeof from, b: typeof to) => estimate.route(a, b));
    const inner: Router = { route: spy };
    const router = withRouteCache(inner);
    await router.route(from, to);
    await router.route(from, to);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('TtlCache', () => {
  it('expires entries and evicts the least recently used', () => {
    let now = 0;
    const cache = new TtlCache<number>(100, 2, () => now);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    now = 150;
    expect(cache.get('a')).toBeUndefined();
  });
});

describe('Nominatim fallback geocoder', () => {
  it('maps results and only runs the newest queued search', async () => {
    const seen: string[] = [];
    const geocoder = createNominatimGeocoder({
      baseUrl: 'https://nominatim.test',
      userAgent: 'test',
      timeoutMs: 1000,
      sleep: () => Promise.resolve(),
      fetch: (input) => {
        const url = new URL(input instanceof Request ? input.url : String(input));
        seen.push(url.searchParams.get('q') ?? '');
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                osm_type: 'node',
                osm_id: 7,
                lat: '37.76',
                lon: '-122.42',
                name: 'Dolores Park',
                display_name: 'Dolores Park, San Francisco',
                address: { road: 'Dolores Street', city: 'San Francisco', state: 'California' },
              },
            ]),
          ),
        );
      },
    });
    expect(await geocoder.search({ text: 'do', limit: 5 })).toEqual([]);
    const [first, second] = await Promise.all([
      geocoder.search({ text: 'dolo', limit: 5 }),
      geocoder.search({ text: 'dolores', limit: 5 }),
    ]);
    expect(first).toEqual([]);
    expect(second[0]).toMatchObject({
      id: 'osm:N7',
      name: 'Dolores Park',
      address: 'Dolores Street, San Francisco, California',
    });
    expect(seen).toEqual(['dolores']);
  });

  it('switches to the fallback when the primary fails', async () => {
    let primaryCalls = 0;
    const geocoder = withGeocoderFallback(
      {
        search: () => {
          primaryCalls += 1;
          return Promise.reject(new Error('down'));
        },
      },
      {
        search: () =>
          Promise.resolve([{ id: 'a', name: 'A', address: '', latitude: 37.7, longitude: -122.4 }]),
      },
    );
    expect(await geocoder.search({ text: 'x', limit: 1 })).toHaveLength(1);
    expect(await geocoder.search({ text: 'y', limit: 1 })).toHaveLength(1);
    expect(primaryCalls).toBe(1);
  });
});
