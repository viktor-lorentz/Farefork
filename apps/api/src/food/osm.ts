import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  type Cuisine,
  cuisineIds,
  haversineMeters,
  type LatLng,
  type RestaurantDetail,
  type RestaurantSummary,
} from '@repo/shared';
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
const TEXT_TTL_MS = 60 * 60 * 1000;
export const OSM_TEXT_RADIUS_METERS = 15_000;
const TEXT_LIMIT = 30;
const PHOTON_CONCURRENCY = 3;
const PHOTON_REST_MS = 5 * 60 * 1000;
const NOMINATIM_NEARBY_BOX = 0.02;
const NOMINATIM_TEXT_BOX = 0.13;
const PROBE_OFFSETS: readonly [number, number][] = [
  [0, 0],
  [0.014, 0],
  [-0.014, 0],
  [0, 0.017],
  [0, -0.017],
];
const amenityKinds = ['restaurant', 'fast_food', 'cafe'] as const;

type AmenityKind = (typeof amenityKinds)[number];

export type OsmConfig = {
  photonUrl: string;
  nominatimUrl: string;
  userAgent: string;
  timeoutMs: number;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  cacheFile?: string;
};

const persistedSchema = z.object({
  version: z.literal(1),
  cells: z.record(
    z.string(),
    z.object({
      savedAt: z.number(),
      restaurants: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          cuisine: z.enum(cuisineIds),
          latitude: z.number(),
          longitude: z.number(),
          address: z.string().nullable(),
        }),
      ),
    }),
  ),
});

type PersistedCells = z.infer<typeof persistedSchema>['cells'];

function readPersisted(file: string | undefined): PersistedCells {
  if (file === undefined) {
    return {};
  }
  try {
    const parsed = persistedSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
    return parsed.success ? parsed.data.cells : {};
  } catch {
    return {};
  }
}

async function inPool<T>(
  tasks: readonly (() => Promise<T>)[],
  size: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array<PromiseSettledResult<T>>(tasks.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < tasks.length) {
      const index = next;
      next += 1;
      const task = tasks[index];
      if (!task) {
        continue;
      }
      try {
        results[index] = { status: 'fulfilled', value: await task() };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, tasks.length) }, () => worker()));
  return results;
}

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
  category: z.string().optional(),
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
    if (cuisine === 'cafe' && kind !== 'cafe') {
      continue;
    }
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

type NominatimPlace = z.infer<typeof nominatimPlaceSchema>;

function nominatimType(type: NominatimPlace['osm_type']): 'N' | 'W' | 'R' {
  return type === 'node' ? 'N' : type === 'way' ? 'W' : 'R';
}

function nominatimAddress(address: Record<string, string> | undefined): string | null {
  const street = address?.road;
  if (street === undefined) {
    return null;
  }
  const line = address?.house_number !== undefined ? `${address.house_number} ${street}` : street;
  const city = address?.city ?? address?.town ?? address?.village;
  return city !== undefined ? `${line}, ${city}` : line;
}

export function nearbyFromNominatim(place: NominatimPlace): NearbyPlace | null {
  const name = place.name?.trim();
  if (!name) {
    return null;
  }
  const type = nominatimType(place.osm_type);
  return {
    id: osmRestaurantId(type, place.osm_id),
    lookupKey: `${type}${place.osm_id}`,
    name: name.slice(0, 120),
    kind: place.type,
    latitude: Number(place.lat),
    longitude: Number(place.lon),
    address: nominatimAddress(place.address),
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
  const texts = new TtlCache<StoredRestaurant[]>(TEXT_TTL_MS, 2000);
  const persisted: PersistedCells = {};
  let writeTimer: ReturnType<typeof setTimeout> | null = null;

  for (const [key, cell] of Object.entries(readPersisted(config.cacheFile))) {
    if (Date.now() - cell.savedAt < CELL_TTL_MS) {
      persisted[key] = cell;
      const restaurants = cell.restaurants.map((base) => {
        const restaurant = buildRestaurant({ ...base, source: 'openstreetmap' });
        byId.set(restaurant.id, restaurant);
        return restaurant;
      });
      cells.set(key, restaurants);
    }
  }

  function persist(key: string, restaurants: readonly StoredRestaurant[]): void {
    const file = config.cacheFile;
    if (file === undefined) {
      return;
    }
    persisted[key] = {
      savedAt: Date.now(),
      restaurants: restaurants.map(({ id, name, cuisine, latitude, longitude, address }) => ({
        id,
        name,
        cuisine,
        latitude,
        longitude,
        address,
      })),
    };
    if (writeTimer !== null) {
      return;
    }
    writeTimer = setTimeout(() => {
      writeTimer = null;
      try {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, JSON.stringify({ version: 1, cells: persisted }));
      } catch {
        return;
      }
    }, 2000);
    writeTimer.unref();
  }
  let lookupQueue: Promise<unknown> = Promise.resolve();
  let photonDownUntil = 0;

  function photonAvailable(): boolean {
    return Date.now() >= photonDownUntil;
  }

  function markPhotonDown(): void {
    photonDownUntil = Date.now() + PHOTON_REST_MS;
  }

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

  async function nearby(center: LatLng, kind: AmenityKind | 'all'): Promise<NearbyPlace[]> {
    const url = new URL('/reverse', config.photonUrl);
    url.searchParams.set('lat', center.latitude.toFixed(5));
    url.searchParams.set('lon', center.longitude.toFixed(5));
    url.searchParams.set('radius', String(NEARBY_RADIUS_KM));
    url.searchParams.set('limit', String(PER_KIND));
    for (const tag of kind === 'all' ? amenityKinds : [kind]) {
      url.searchParams.append('osm_tag', `amenity:${tag}`);
    }
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
    return queued(async () => {
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
  }

  function queued<T>(task: () => Promise<T>): Promise<T> {
    const run = lookupQueue.then(task);
    lookupQueue = run.then(
      () => sleep(LOOKUP_SPACING_MS),
      () => sleep(LOOKUP_SPACING_MS),
    );
    return run;
  }

  function nominatimSearch(params: Record<string, string>, box: number): Promise<NominatimPlace[]> {
    return queued(async () => {
      const center = { latitude: Number(params.lat), longitude: Number(params.lon) };
      const url = new URL('/search', config.nominatimUrl);
      for (const [key, value] of Object.entries(params)) {
        if (key !== 'lat' && key !== 'lon') {
          url.searchParams.set(key, value);
        }
      }
      const lngBox = box / Math.max(0.2, Math.cos((center.latitude * Math.PI) / 180));
      url.searchParams.set(
        'viewbox',
        [
          center.longitude - lngBox,
          center.latitude + box,
          center.longitude + lngBox,
          center.latitude - box,
        ]
          .map((value) => value.toFixed(5))
          .join(','),
      );
      url.searchParams.set('bounded', '1');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('extratags', '1');
      url.searchParams.set('addressdetails', '1');
      const body = await getJson(url);
      if (!Array.isArray(body)) {
        throw new UpstreamError('Nominatim returned an unexpected response');
      }
      return body.flatMap((entry) => {
        const place = nominatimPlaceSchema.safeParse(entry);
        return place.success ? [place.data] : [];
      });
    });
  }

  async function nominatimPlaces(
    searches: readonly Record<string, string>[],
    box: number,
  ): Promise<{ places: NearbyPlace[]; tags: Map<string, string> }> {
    const tags = new Map<string, string>();
    const unique = new Map<string, NearbyPlace>();
    for (const params of searches) {
      for (const found of await nominatimSearch(params, box)) {
        if (found.category !== 'amenity' || !amenityKinds.some((kind) => kind === found.type)) {
          continue;
        }
        const place = nearbyFromNominatim(found);
        if (place) {
          unique.set(place.id, place);
          const cuisine = found.extratags?.cuisine;
          if (cuisine !== undefined) {
            tags.set(place.id, cuisine);
          }
        }
      }
    }
    return { places: [...unique.values()], tags };
  }

  function tagsFrom(found: readonly NominatimPlace[]): Map<string, string> {
    const tags = new Map<string, string>();
    for (const place of found) {
      const cuisine = place.extratags?.cuisine;
      if (cuisine !== undefined) {
        tags.set(osmRestaurantId(nominatimType(place.osm_type), place.osm_id), cuisine);
      }
    }
    return tags;
  }

  async function cuisineTags(
    places: readonly NearbyPlace[],
    onLate?: (tags: Map<string, string>) => void,
  ): Promise<Map<string, string>> {
    const found: NominatimPlace[] = [];
    const state = { done: false };
    const full = lookup(
      places.map((place) => place.lookupKey),
      { sink: found },
    ).then(
      () => {
        state.done = true;
      },
      () => {
        state.done = true;
      },
    );
    await Promise.race([full, budget(LOOKUP_BUDGET_MS)]);
    if (!state.done && onLate) {
      void full.then(() => {
        onLate(tagsFrom(found));
      });
    }
    return tagsFrom(found);
  }

  function remember(places: readonly NearbyPlace[], tags: Map<string, string>): StoredRestaurant[] {
    return places.map((place) => {
      const existing = byId.get(place.id);
      const restaurant = existing ?? toRestaurant(place, tags.get(place.id));
      byId.set(place.id, restaurant);
      return restaurant;
    });
  }

  function byDistance(center: LatLng, places: Iterable<NearbyPlace>): NearbyPlace[] {
    const unique = new Map<string, NearbyPlace>();
    for (const place of places) {
      unique.set(place.id, place);
    }
    return [...unique.values()].sort(
      (a, b) => haversineMeters(center, a) - haversineMeters(center, b),
    );
  }

  function fulfilled<T>(settled: readonly PromiseSettledResult<T>[]): T[] {
    return settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
  }

  function applyLateTags(key: string, places: readonly NearbyPlace[], late: Map<string, string>) {
    const known = new Map(places.map((place) => [place.id, place]));
    const current = cells.get(key) ?? [];
    const updated = current.map((restaurant) => {
      const place = known.get(restaurant.id);
      const tag = late.get(restaurant.id);
      const better = cuisineFromTag(tag);
      if (place && tag !== undefined && better !== null && better !== restaurant.cuisine) {
        const fixed = toRestaurant(place, tag);
        byId.set(place.id, fixed);
        return fixed;
      }
      return restaurant;
    });
    cells.set(key, updated);
    persist(key, updated);
  }

  async function extendCell(key: string, center: LatLng): Promise<void> {
    const probes = PROBE_OFFSETS.slice(1).map(
      ([dLat, dLng]) =>
        () =>
          nearby({ latitude: center.latitude + dLat, longitude: center.longitude + dLng }, 'all'),
    );
    const extra = byDistance(
      center,
      fulfilled(await inPool(probes, PHOTON_CONCURRENCY)).flat(),
    ).filter((place) => byId.get(place.id) === undefined);
    if (extra.length === 0) {
      return;
    }
    const tags = await cuisineTags(extra, (late) => {
      applyLateTags(key, extra, late);
    });
    const added = remember(extra, tags);
    const current = cells.get(key) ?? [];
    const merged = new Map<string, StoredRestaurant>();
    for (const restaurant of [...current, ...added]) {
      merged.set(restaurant.id, restaurant);
    }
    const all = [...merged.values()].sort(
      (a, b) => haversineMeters(center, a) - haversineMeters(center, b),
    );
    cells.set(key, all);
    persist(key, all);
  }

  async function loadCell(
    center: LatLng,
    key?: string,
  ): Promise<{ restaurants: StoredRestaurant[]; viaPhoton: boolean }> {
    const probes = amenityKinds.map((kind) => () => nearby(center, kind));
    const lists = photonAvailable() ? fulfilled(await inPool(probes, PHOTON_CONCURRENCY)) : [];
    if (lists.length === 0) {
      markPhotonDown();
      const found = await nominatimPlaces(
        amenityKinds.map((kind) => ({
          amenity: kind,
          limit: '40',
          lat: String(center.latitude),
          lon: String(center.longitude),
        })),
        NOMINATIM_NEARBY_BOX,
      );
      return { restaurants: remember(found.places, found.tags), viaPhoton: false };
    }
    const places = byDistance(center, lists.flat());
    if (places.length === 0) {
      return { restaurants: [], viaPhoton: true };
    }
    const tags = await cuisineTags(places, (late) => {
      if (key !== undefined) {
        applyLateTags(key, places, late);
      }
    });
    return { restaurants: remember(places, tags), viaPhoton: true };
  }

  async function loadAndPersistCell(key: string, center: LatLng): Promise<StoredRestaurant[]> {
    const { restaurants, viaPhoton } = await loadCell(center, key);
    if (restaurants.length > 0) {
      persist(key, restaurants);
    }
    if (viaPhoton) {
      const timer = setTimeout(() => {
        void extendCell(key, center).catch(() => undefined);
      }, 0);
      timer.unref();
    }
    return restaurants;
  }

  async function textSearch(text: string, near: LatLng): Promise<StoredRestaurant[]> {
    try {
      if (!photonAvailable()) {
        throw new UpstreamError('Photon is resting');
      }
      return await photonTextSearch(text, near);
    } catch {
      markPhotonDown();
      const found = await nominatimPlaces(
        [{ q: text, limit: '25', lat: String(near.latitude), lon: String(near.longitude) }],
        NOMINATIM_TEXT_BOX,
      );
      return remember(
        found.places.filter((place) => haversineMeters(near, place) <= OSM_TEXT_RADIUS_METERS),
        found.tags,
      );
    }
  }

  async function photonTextSearch(text: string, near: LatLng): Promise<StoredRestaurant[]> {
    const url = new URL('/api/', config.photonUrl);
    url.searchParams.set('q', text);
    url.searchParams.set('lat', near.latitude.toFixed(4));
    url.searchParams.set('lon', near.longitude.toFixed(4));
    url.searchParams.set('limit', String(TEXT_LIMIT));
    url.searchParams.set('location_bias_scale', '0.5');
    url.searchParams.set('zoom', '12');
    for (const kind of amenityKinds) {
      url.searchParams.append('osm_tag', `amenity:${kind}`);
    }
    const parsed = photonResponseSchema.safeParse(await getJson(url));
    if (!parsed.success) {
      throw new UpstreamError('Photon returned an unexpected response');
    }
    const places = parsed.data.features
      .map(nearbyFromPhoton)
      .filter((place): place is NearbyPlace => place !== null)
      .filter((place) => haversineMeters(near, place) <= OSM_TEXT_RADIUS_METERS);
    if (places.length === 0) {
      return [];
    }
    const unknown = places.filter((place) => byId.get(place.id) === undefined);
    return remember(
      places,
      unknown.length > 0 ? await cuisineTags(unknown) : new Map<string, string>(),
    );
  }

  return {
    async search(query: RestaurantQuery): Promise<RestaurantSummary[]> {
      const { key, center } = cellOf(query.near);
      try {
        const restaurants = await cached(cells, key, () => loadAndPersistCell(key, center));
        if (restaurants.length === 0 && fallback) {
          return await fallback.search(query);
        }
        const text = query.text?.trim().toLowerCase() ?? '';
        if (text.length < 2) {
          return rankRestaurants(restaurants, query, OSM_SEARCH_RADIUS_METERS);
        }
        const textKey = `${text}|${key}`;
        const found = await cached(texts, textKey, () => textSearch(text, center)).catch(() => []);
        const merged = new Map<string, StoredRestaurant>();
        for (const restaurant of [...found, ...restaurants]) {
          merged.set(restaurant.id, restaurant);
        }
        return rankRestaurants([...merged.values()], query, OSM_TEXT_RADIUS_METERS);
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
      const [found] = await lookup([`${parsed.type}${parsed.id}`], { details: true });
      const place = found ? nearbyFromNominatim(found) : null;
      if (!found || !place) {
        return null;
      }
      const restaurant = toRestaurant({ ...place, id }, found.extratags?.cuisine);
      byId.set(id, restaurant);
      return withDistance(restaurant, from);
    },
  };
}
