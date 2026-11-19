import {
  type Cuisine,
  cuisineIds,
  cuisineLabels,
  type DeliveryProviderId,
  haversineMeters,
  type LatLng,
  type MenuCategory,
  type RestaurantDetail,
  type RestaurantSource as RestaurantSourceKind,
  type RestaurantSummary,
} from '@repo/shared';
import { seededRandom } from '../rides/random';
import { cuisineTemplates } from './menus';
import { photoFor } from './photos';

export const CELL_DEGREES = 0.02;
export const RESTAURANTS_PER_CELL = 3;
export const SEARCH_RADIUS_METERS = 5000;
const SEARCH_CELL_SPAN = 3;
export const MAX_RESULTS = 120;
const CAFE_RANK_PENALTY_METERS = 800;

const carryProbability: Record<DeliveryProviderId, number> = {
  ubereats: 0.85,
  doordash: 0.9,
  grubhub: 0.6,
  postmates: 0.5,
};

export type RestaurantBase = {
  id: string;
  name: string;
  cuisine: Cuisine;
  latitude: number;
  longitude: number;
  address: string | null;
  source: RestaurantSourceKind;
};

export type StoredRestaurant = Omit<RestaurantDetail, 'distanceMeters'>;

export type RestaurantQuery = {
  near: LatLng;
  text?: string;
  cuisine?: Cuisine;
};

export type RestaurantSource = {
  search(query: RestaurantQuery): Promise<RestaurantSummary[]>;
  find(id: string, from?: LatLng): Promise<RestaurantDetail | null>;
};

function roundToNickel(cents: number): number {
  return Math.max(5, Math.round(cents / 5) * 5);
}

export function buildRestaurant(base: RestaurantBase): StoredRestaurant {
  const random = seededRandom(`menu|${base.id}`);
  const template = cuisineTemplates[base.cuisine];
  const priceFactor = random.between(0.9, 1.2);
  const providerIds = (Object.keys(carryProbability) as DeliveryProviderId[]).filter((provider) =>
    random.chance(carryProbability[provider]),
  );
  for (const fallback of ['doordash', 'ubereats'] as const) {
    if (providerIds.length < 2 && !providerIds.includes(fallback)) {
      providerIds.push(fallback);
    }
  }
  const popularIndex = random.int(0, 2);
  const categories: MenuCategory[] = template.categories.map((category, categoryIndex) => ({
    id: category.key,
    name: category.name,
    items: category.items.map((entry, itemIndex) => ({
      id: `${category.key}.${entry.key}`,
      name: entry.name,
      description: entry.description,
      priceCents: roundToNickel(entry.priceCents * priceFactor),
      popular: categoryIndex === 0 && itemIndex === popularIndex,
    })),
  }));
  return {
    ...base,
    priceLevel: template.priceLevel,
    prepMinutes: random.int(template.prepMinutes[0], template.prepMinutes[1]),
    providerIds,
    photo: photoFor(base.id, base.cuisine),
    categories,
  };
}

export function withDistance(restaurant: StoredRestaurant, from?: LatLng): RestaurantDetail {
  return {
    ...restaurant,
    distanceMeters: from ? Math.round(haversineMeters(from, restaurant)) : 0,
  };
}

export function summarize(restaurant: RestaurantDetail): RestaurantSummary {
  const { categories: _categories, ...summary } = restaurant;
  return summary;
}

export function foldText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ');
}

function matches(restaurant: StoredRestaurant, text: string): boolean {
  const haystack = foldText(
    [
      restaurant.name,
      cuisineLabels[restaurant.cuisine],
      ...restaurant.categories.flatMap((category) => category.items.map((entry) => entry.name)),
    ].join(' '),
  );
  const compact = haystack.replace(/ /g, '');
  return foldText(text)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term) || compact.includes(term));
}

const NAME_MATCH_BONUS_METERS = 100_000;

function rankDistance(restaurant: RestaurantDetail, query: RestaurantQuery): number {
  const penalty =
    restaurant.cuisine === 'cafe' && query.cuisine !== 'cafe' ? CAFE_RANK_PENALTY_METERS : 0;
  const text = foldText(query.text ?? '').trim();
  const nameMiss =
    text.length > 0 && !foldText(restaurant.name).includes(text) ? NAME_MATCH_BONUS_METERS : 0;
  return restaurant.distanceMeters + penalty + nameMiss;
}

export function rankRestaurants(
  restaurants: readonly StoredRestaurant[],
  query: RestaurantQuery,
  radiusMeters: number,
): RestaurantSummary[] {
  const text = query.text?.trim() ?? '';
  return restaurants
    .map((restaurant) => withDistance(restaurant, query.near))
    .filter((restaurant) => restaurant.distanceMeters <= radiusMeters)
    .filter((restaurant) => query.cuisine === undefined || restaurant.cuisine === query.cuisine)
    .filter((restaurant) => text.length === 0 || matches(restaurant, text))
    .sort((a, b) => rankDistance(a, query) - rankDistance(b, query))
    .slice(0, MAX_RESULTS)
    .map(summarize);
}

export function restaurantId(cellLat: number, cellLng: number, index: number): string {
  return `r_${cellLat}_${cellLng}_${index}`;
}

export function parseRestaurantId(
  id: string,
): { cellLat: number; cellLng: number; index: number } | null {
  const match = /^r_(-?\d{1,5})_(-?\d{1,5})_(\d{1,2})$/.exec(id);
  if (!match) {
    return null;
  }
  const index = Number(match[3]);
  if (index >= RESTAURANTS_PER_CELL) {
    return null;
  }
  return { cellLat: Number(match[1]), cellLng: Number(match[2]), index };
}

function generateSample(cellLat: number, cellLng: number, index: number): StoredRestaurant {
  const id = restaurantId(cellLat, cellLng, index);
  const random = seededRandom(`restaurant|${id}`);
  const cuisine: Cuisine = cuisineIds[random.int(0, cuisineIds.length - 1)] ?? 'pizza';
  const template = cuisineTemplates[cuisine];
  const name = template.names[random.int(0, template.names.length - 1)] ?? cuisineLabels[cuisine];
  return buildRestaurant({
    id,
    name,
    cuisine,
    latitude: (cellLat + random.next()) * CELL_DEGREES,
    longitude: (cellLng + random.next()) * CELL_DEGREES,
    address: null,
    source: 'sample',
  });
}

export function findRestaurant(id: string, from?: LatLng): RestaurantDetail | null {
  const parsed = parseRestaurantId(id);
  if (!parsed) {
    return null;
  }
  return withDistance(generateSample(parsed.cellLat, parsed.cellLng, parsed.index), from);
}

export function searchRestaurants(query: RestaurantQuery): RestaurantSummary[] {
  const baseLat = Math.floor(query.near.latitude / CELL_DEGREES);
  const baseLng = Math.floor(query.near.longitude / CELL_DEGREES);
  const all: StoredRestaurant[] = [];
  for (let dLat = -SEARCH_CELL_SPAN; dLat <= SEARCH_CELL_SPAN; dLat += 1) {
    for (let dLng = -SEARCH_CELL_SPAN; dLng <= SEARCH_CELL_SPAN; dLng += 1) {
      for (let index = 0; index < RESTAURANTS_PER_CELL; index += 1) {
        all.push(generateSample(baseLat + dLat, baseLng + dLng, index));
      }
    }
  }
  return rankRestaurants(all, query, SEARCH_RADIUS_METERS);
}

export const sampleRestaurants: RestaurantSource = {
  search: (query) => Promise.resolve(searchRestaurants(query)),
  find: (id, from) => Promise.resolve(findRestaurant(id, from)),
};
