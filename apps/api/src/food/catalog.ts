import {
  type Cuisine,
  cuisineIds,
  cuisineLabels,
  type DeliveryProviderId,
  haversineMeters,
  type LatLng,
  type MenuCategory,
  type RestaurantDetail,
  type RestaurantSummary,
} from '@repo/shared';
import { seededRandom } from '../rides/random';
import { cuisineTemplates } from './menus';

export const CELL_DEGREES = 0.02;
export const RESTAURANTS_PER_CELL = 3;
export const SEARCH_RADIUS_METERS = 5000;
const SEARCH_CELL_SPAN = 3;
const MAX_RESULTS = 40;

const carryProbability: Record<DeliveryProviderId, number> = {
  ubereats: 0.85,
  doordash: 0.9,
  grubhub: 0.6,
  postmates: 0.5,
};

type Generated = {
  detail: Omit<RestaurantDetail, 'distanceMeters'>;
};

function roundToNickel(cents: number): number {
  return Math.max(5, Math.round(cents / 5) * 5);
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

function generate(cellLat: number, cellLng: number, index: number): Generated {
  const id = restaurantId(cellLat, cellLng, index);
  const random = seededRandom(`restaurant|${id}`);
  const cuisine: Cuisine = cuisineIds[random.int(0, cuisineIds.length - 1)] ?? 'pizza';
  const template = cuisineTemplates[cuisine];
  const name = template.names[random.int(0, template.names.length - 1)] ?? cuisineLabels[cuisine];
  const latitude = (cellLat + random.next()) * CELL_DEGREES;
  const longitude = (cellLng + random.next()) * CELL_DEGREES;
  const priceFactor = random.between(0.9, 1.2);
  const providerIds = (Object.keys(carryProbability) as DeliveryProviderId[]).filter((provider) =>
    random.chance(carryProbability[provider]),
  );
  for (const fallback of ['doordash', 'ubereats'] as const) {
    if (providerIds.length < 2 && !providerIds.includes(fallback)) {
      providerIds.push(fallback);
    }
  }
  const popularIndex = random.int(0, 3);
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
    detail: {
      id,
      name,
      cuisine,
      latitude,
      longitude,
      priceLevel: template.priceLevel,
      prepMinutes: random.int(template.prepMinutes[0], template.prepMinutes[1]),
      providerIds,
      categories,
    },
  };
}

export function findRestaurant(id: string, from?: LatLng): RestaurantDetail | null {
  const parsed = parseRestaurantId(id);
  if (!parsed) {
    return null;
  }
  const { detail } = generate(parsed.cellLat, parsed.cellLng, parsed.index);
  return {
    ...detail,
    distanceMeters: from ? Math.round(haversineMeters(from, detail)) : 0,
  };
}

export type RestaurantQuery = {
  near: LatLng;
  text?: string;
  cuisine?: Cuisine;
};

function matches(detail: Generated['detail'], text: string): boolean {
  const haystack = [
    detail.name,
    cuisineLabels[detail.cuisine],
    ...detail.categories.flatMap((category) => category.items.map((entry) => entry.name)),
  ]
    .join(' ')
    .toLowerCase();
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function searchRestaurants(query: RestaurantQuery): RestaurantSummary[] {
  const baseLat = Math.floor(query.near.latitude / CELL_DEGREES);
  const baseLng = Math.floor(query.near.longitude / CELL_DEGREES);
  const results: RestaurantSummary[] = [];
  for (let dLat = -SEARCH_CELL_SPAN; dLat <= SEARCH_CELL_SPAN; dLat += 1) {
    for (let dLng = -SEARCH_CELL_SPAN; dLng <= SEARCH_CELL_SPAN; dLng += 1) {
      for (let index = 0; index < RESTAURANTS_PER_CELL; index += 1) {
        const { detail } = generate(baseLat + dLat, baseLng + dLng, index);
        const distanceMeters = haversineMeters(query.near, detail);
        if (distanceMeters > SEARCH_RADIUS_METERS) {
          continue;
        }
        if (query.cuisine !== undefined && detail.cuisine !== query.cuisine) {
          continue;
        }
        if (query.text !== undefined && query.text.length > 0 && !matches(detail, query.text)) {
          continue;
        }
        const { categories: _categories, ...summary } = detail;
        results.push({ ...summary, distanceMeters: Math.round(distanceMeters) });
      }
    }
  }
  return results.sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, MAX_RESULTS);
}
