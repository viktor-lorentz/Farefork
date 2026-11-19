import type { Cuisine, LatLng, RestaurantDetail, RestaurantSummary } from '@repo/shared';
import { z } from 'zod';
import { UpstreamError } from '../geo/geocoder';
import { cached, TtlCache } from '../lib/ttlCache';
import {
  buildRestaurant,
  rankRestaurants,
  type RestaurantQuery,
  type RestaurantSource,
  type StoredRestaurant,
  withDistance,
} from './catalog';

export const OSM_CELL_DEGREES = 0.01;
export const OSM_SEARCH_RADIUS_METERS = 3000;
const NEARBY_RADIUS_KM = 3;
const PER_KIND = 50;
const LOOKUP_BATCH = 50;
const LOOKUP_SPACING_MS = 1100;
const LOOKUP_BUDGET_MS = 1500;
const CELL_TTL_MS = 24 * 60 * 60 * 1000;
const amenityKinds = ['restaurant', 'fast_food', 'cafe'] as const;

type AmenityKind = (typeof amenityKinds)[number];

export type OsmConfig = {
  photonUrl: string;
  nominatimUrl: string;
  userAgent: string;
  timeoutMs: number;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

const photonFeatureSchema = z.object({
  geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
  properties: z.object({
    osm_type: z.enum(['N', 'W', 'R']),
    osm_id: z.number().int(),
    osm_value: z.string().optional(),
    name: z.string().optional(),
    housenumber: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
  }),
});

const photonResponseSchema = z.object({ features: z.array(z.unknown()) });

const nominatimPlaceSchema = z.object({
  osm_type: z.enum(['node', 'way', 'relation']),
  osm_id: z.number().int(),
  lat: z.string(),
  lon: z.string(),
  type: z.string().optional(),
  name: z.string().optional(),
  extratags: z.record(z.string(), z.string()).nullable().optional(),
  address: z.record(z.string(), z.string()).optional(),
});

const cuisineAliases: [Cuisine, readonly string[]][] = [
  ['pizza', ['pizza']],
  ['burgers', ['burger', 'hamburger']],
  ['mexican', ['mexican', 'tex-mex', 'tacos', 'taco', 'burrito', 'latin_american', 'salvadoran']],
  ['sushi', ['sushi', 'japanese', 'ramen', 'poke']],
  ['thai', ['thai', 'lao']],
  ['indian', ['indian', 'pakistani', 'nepalese', 'bangladeshi', 'sri_lankan', 'curry']],
  [
    'chinese',
    ['chinese', 'dim_sum', 'cantonese', 'szechuan', 'sichuan', 'taiwanese', 'dumpling', 'noodle'],
  ],
  [
    'mediterranean',
    [
      'mediterranean',
      'greek',
      'lebanese',
      'turkish',
      'middle_eastern',
      'falafel',
      'kebab',
      'persian',
      'israeli',
      'moroccan',
    ],
  ],
  ['salads', ['salad', 'vegan', 'vegetarian', 'healthy', 'juice']],
  ['breakfast', ['breakfast', 'brunch', 'pancake', 'bagel', 'donut', 'bakery']],
  ['italian', ['italian', 'pasta']],
  [
    'american',
    [
      'american',
      'chicken',
      'barbecue',
      'bbq',
      'sandwich',
      'diner',
      'wings',
      'steak_house',
      'hot_dog',
      'regional',
      'fish_and_chips',
      'seafood',
    ],
  ],
  ['vietnamese', ['vietnamese', 'pho']],
  ['korean', ['korean']],
  ['cafe', ['coffee_shop', 'coffee', 'tea', 'bubble_tea', 'cafe']],
];

const nameHints: [Cuisine, RegExp][] = [
  ['pizza', /\bpizz/i],
  ['burgers', /burger/i],
  ['vietnamese', /\bpho\b|banh mi|vietnam|saigon/i],
  ['mexican', /taquer|\btaco|burrito|mexic|cantina|tortill/i],
  ['sushi', /sushi|ramen|izakaya|japan|teriyaki|udon/i],
  ['thai', /\bthai\b/i],
  ['indian', /india|curry|tandoor|masala|biryani|punjab|nepal/i],
  ['korean', /korea|seoul|bibimbap/i],
  ['chinese', /china|chinese|dim sum|dumpling|\bwok\b|szechuan|sichuan|noodle/i],
  ['mediterranean', /falafel|hummus|shawarma|kebab|greek|gyro|mediterr|lebanes|persian/i],
  ['salads', /salad|\bpoke\b|juice|greens/i],
  ['breakfast', /pancake|breakfast|brunch|bagel|donut|doughnut|bakery|waffle/i],
  ['italian', /pasta|trattoria|osteria|italian|ristorante|pizzeria/i],
  ['cafe', /caf[eé]|coffee|espresso|roaster|\btea\b|boba/i],
  ['american', /chicken|bbq|barbecue|diner|grill|wings|sandwich|\bdeli\b|smokehouse/i],
];

export function cuisineFromTag(tag: string | undefined): Cuisine | null {
  const values = (tag ?? '')
    .toLowerCase()
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter(Boolean);
  for (const value of values) {
    for (const [cuisine, aliases] of cuisineAliases) {
      if (aliases.includes(value)) {
        return cuisine;
      }
    }
  }
  return null;
}

export function guessCuisine(name: string, kind: string | undefined): Cuisine {
  for (const [cuisine, pattern] of nameHints) {
    if (pattern.test(name)) {
      return cuisine;
    }
  }
  return kind === 'cafe' ? 'cafe' : 'american';
}

export function osmRestaurantId(type: 'N' | 'W' | 'R', id: number): string {
  return `osm_${type.toLowerCase()}${id}`;
}

export function parseOsmRestaurantId(id: string): { type: 'N' | 'W' | 'R'; id: number } | null {
  const match = /^osm_([nwr])(\d{1,15})$/.exec(id);
  if (!match?.[1]) {
    return null;
  }
  const type = match[1].toUpperCase();
  return type === 'N' || type === 'W' || type === 'R' ? { type, id: Number(match[2]) } : null;
}

type NearbyPlace = {
  id: string;
  lookupKey: string;
  name: string;
  kind: string | undefined;
  latitude: number;
  longitude: number;
  address: string | null;
};

function photonAddress(
  properties: z.infer<typeof photonFeatureSchema>['properties'],
): string | null {
  if (properties.street === undefined) {
    return null;
  }
  const line =
    properties.housenumber !== undefined
      ? `${properties.housenumber} ${properties.street}`
      : properties.street;
  return properties.city !== undefined ? `${line}, ${properties.city}` : line;
}

export function nearbyFromPhoton(raw: unknown): NearbyPlace | null {
  const parsed = photonFeatureSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const { properties, geometry } = parsed.data;
  const name = properties.name?.trim();
  if (!name) {
    return null;
  }
  const [longitude, latitude] = geometry.coordinates;
  return {
    id: osmRestaurantId(properties.osm_type, properties.osm_id),
    lookupKey: `${properties.osm_type}${properties.osm_id}`,
    name: name.slice(0, 120),
    kind: properties.osm_value,
    latitude,
    longitude,
    address: photonAddress(properties),
  };
}

function toRestaurant(place: NearbyPlace, cuisineTag: string | undefined): StoredRestaurant {
  return buildRestaurant({
    id: place.id,
    name: place.name,
    cuisine: cuisineFromTag(cuisineTag) ?? guessCuisine(place.name, place.kind),
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address,
    source: 'openstreetmap',
  });
}

function cellOf(point: LatLng): { key: string; center: LatLng } {
  const cellLat = Math.floor(point.latitude / OSM_CELL_DEGREES);
  const cellLng = Math.floor(point.longitude / OSM_CELL_DEGREES);
  return {
    key: `${cellLat}:${cellLng}`,
    center: {
      latitude: (cellLat + 0.5) * OSM_CELL_DEGREES,
      longitude: (cellLng + 0.5) * OSM_CELL_DEGREES,
    },
  };
}

function budget(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms).unref();
  });
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createOsmRestaurantSource(
  config: OsmConfig,
  fallback?: RestaurantSource,
): RestaurantSource {
  const doFetch = config.fetch ?? fetch;
  const sleep = config.sleep ?? defaultSleep;
  const cells = new TtlCache<StoredRestaurant[]>(CELL_TTL_MS, 400);
  const byId = new TtlCache<StoredRestaurant>(CELL_TTL_MS, 20_000);
  let lookupQueue: Promise<unknown> = Promise.resolve();

  async function getJson(url: URL): Promise<unknown> {
    const response = await doFetch(url, {
      headers: { 'User-Agent': config.userAgent, Accept: 'application/json' },
      signal: AbortSignal.timeout(config.timeoutMs),
    });
    if (!response.ok) {
      throw new UpstreamError(`${url.host} responded ${response.status}`);
    }
    return response.json();
  }

  async function nearby(center: LatLng, kind: AmenityKind): Promise<NearbyPlace[]> {
    const url = new URL('/reverse', config.photonUrl);
    url.searchParams.set('lat', center.latitude.toFixed(5));
    url.searchParams.set('lon', center.longitude.toFixed(5));
    url.searchParams.set('radius', String(NEARBY_RADIUS_KM));
    url.searchParams.set('limit', String(PER_KIND));
    url.searchParams.set('osm_tag', `amenity:${kind}`);
    const parsed = photonResponseSchema.safeParse(await getJson(url));
    if (!parsed.success) {
      throw new UpstreamError('Photon returned an unexpected response');
    }
    return parsed.data.features
      .map(nearbyFromPhoton)
      .filter((place): place is NearbyPlace => place !== null);
  }

  function lookup(
    keys: readonly string[],
    options: { details?: boolean; sink?: z.infer<typeof nominatimPlaceSchema>[] } = {},
  ): Promise<z.infer<typeof nominatimPlaceSchema>[]> {
    const run = lookupQueue.then(async () => {
      const results = options.sink ?? [];
      for (let start = 0; start < keys.length; start += LOOKUP_BATCH) {
        if (start > 0) {
          await sleep(LOOKUP_SPACING_MS);
        }
        const url = new URL('/lookup', config.nominatimUrl);
        url.searchParams.set('osm_ids', keys.slice(start, start + LOOKUP_BATCH).join(','));
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('extratags', '1');
        url.searchParams.set('addressdetails', options.details === true ? '1' : '0');
        const body = await getJson(url);
        if (Array.isArray(body)) {
          for (const entry of body) {
            const place = nominatimPlaceSchema.safeParse(entry);
            if (place.success) {
              results.push(place.data);
            }
          }
        }
      }
      return results;
    });
    lookupQueue = run.then(
      () => sleep(LOOKUP_SPACING_MS),
      () => sleep(LOOKUP_SPACING_MS),
    );
    return run;
  }

  async function cuisineTags(places: readonly NearbyPlace[]): Promise<Map<string, string>> {
    const tags = new Map<string, string>();
    const found: z.infer<typeof nominatimPlaceSchema>[] = [];
    try {
      await Promise.race([
        lookup(
          places.map((place) => place.lookupKey),
          { sink: found },
        ),
        budget(LOOKUP_BUDGET_MS),
      ]);
    } catch {
      tags.clear();
    }
    for (const place of found) {
      const cuisine = place.extratags?.cuisine;
      if (cuisine !== undefined) {
        const type = place.osm_type === 'node' ? 'N' : place.osm_type === 'way' ? 'W' : 'R';
        tags.set(osmRestaurantId(type, place.osm_id), cuisine);
      }
    }
    return tags;
  }

  async function loadCell(center: LatLng): Promise<StoredRestaurant[]> {
    const lists = await Promise.all(amenityKinds.map((kind) => nearby(center, kind)));
    const unique = new Map<string, NearbyPlace>();
    for (const place of lists.flat()) {
      unique.set(place.id, place);
    }
    const places = [...unique.values()];
    if (places.length === 0) {
      return [];
    }
    const tags = await cuisineTags(places);
    return places.map((place) => {
      const existing = byId.get(place.id);
      const restaurant = existing ?? toRestaurant(place, tags.get(place.id));
      byId.set(place.id, restaurant);
      return restaurant;
    });
  }

  return {
    async search(query: RestaurantQuery): Promise<RestaurantSummary[]> {
      const { key, center } = cellOf(query.near);
      try {
        const restaurants = await cached(cells, key, () => loadCell(center));
        if (restaurants.length === 0 && fallback) {
          return await fallback.search(query);
        }
        return rankRestaurants(restaurants, query, OSM_SEARCH_RADIUS_METERS);
      } catch (error) {
        if (fallback) {
          return await fallback.search(query);
        }
        throw error;
      }
    },
    async find(id: string, from?: LatLng): Promise<RestaurantDetail | null> {
      const parsed = parseOsmRestaurantId(id);
      if (!parsed) {
        return fallback ? fallback.find(id, from) : null;
      }
      const known = byId.get(id);
      if (known) {
        return withDistance(known, from);
      }
      const [place] = await lookup([`${parsed.type}${parsed.id}`], { details: true });
      const name = place?.name?.trim();
      if (!place || !name) {
        return null;
      }
      const address = place.address;
      const street = address?.road;
      const restaurant = toRestaurant(
        {
          id,
          lookupKey: `${parsed.type}${parsed.id}`,
          name,
          kind: place.type,
          latitude: Number(place.lat),
          longitude: Number(place.lon),
          address:
            street === undefined
              ? null
              : [address?.house_number, street].filter(Boolean).join(' ') +
                (address?.city !== undefined ? `, ${address.city}` : ''),
        },
        place.extratags?.cuisine,
      );
      byId.set(id, restaurant);
      return withDistance(restaurant, from);
    },
  };
}
