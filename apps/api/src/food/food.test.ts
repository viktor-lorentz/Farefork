import {
  foodQuotesResponseSchema,
  type RestaurantDetail,
  restaurantDetailResponseSchema,
  restaurantSearchResponseSchema,
} from '@repo/shared';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { fixedNow, places, testDeps } from '../testDeps';
import {
  findRestaurant,
  parseRestaurantId,
  searchRestaurants,
  SEARCH_RADIUS_METERS,
} from './catalog';
import {
  createMockDeliveryProvider,
  deliverySpecs,
  ESTIMATED_TAX_RATE,
  markedUpCents,
  priceFeeCents,
} from './providers';

const near = places.doloresPark;

function firstRestaurant(): RestaurantDetail {
  const summary = searchRestaurants({ near })[0]!;
  return findRestaurant(summary.id, near)!;
}

describe('restaurant catalog', () => {
  it('returns the same restaurants for the same place', () => {
    expect(searchRestaurants({ near })).toEqual(searchRestaurants({ near }));
  });

  it('only returns restaurants inside the radius, nearest first, with cafes ranked lower', () => {
    const results = searchRestaurants({ near });
    expect(results.length).toBeGreaterThan(5);
    expect(results.every((entry) => entry.distanceMeters <= SEARCH_RADIUS_METERS)).toBe(true);
    const meals = results.filter((entry) => entry.cuisine !== 'cafe').map((e) => e.distanceMeters);
    expect(meals).toEqual([...meals].sort((a, b) => a - b));
    const cafes = searchRestaurants({ near, cuisine: 'cafe' }).map((e) => e.distanceMeters);
    expect(cafes).toEqual([...cafes].sort((a, b) => a - b));
  });

  it('filters by cuisine and by text, including menu items', () => {
    const pizza = searchRestaurants({ near, cuisine: 'pizza' });
    expect(pizza.every((entry) => entry.cuisine === 'pizza')).toBe(true);
    const margherita = searchRestaurants({ near, text: 'margherita' });
    expect(margherita.every((entry) => entry.cuisine === 'pizza')).toBe(true);
    expect(searchRestaurants({ near, text: 'zzzz-not-food' })).toEqual([]);
  });

  it('regenerates the full menu from the id alone', () => {
    const restaurant = firstRestaurant();
    expect(restaurant.categories.length).toBeGreaterThan(0);
    expect(findRestaurant(restaurant.id)?.categories).toEqual(restaurant.categories);
    expect(restaurant.providerIds.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects malformed ids', () => {
    expect(parseRestaurantId('r_1_2_9')).toBeNull();
    expect(parseRestaurantId('nope')).toBeNull();
    expect(findRestaurant('r_1_2')).toBeNull();
  });
});

describe('fee helpers', () => {
  it('rounds fees to prices ending in 49 or 99', () => {
    expect(priceFeeCents(10)).toBe(49);
    expect(priceFeeCents(310)).toBe(299);
    expect(priceFeeCents(330)).toBe(349);
  });

  it('rounds marked-up menu prices to the nickel', () => {
    expect(markedUpCents(1000, 0)).toBe(1000);
    expect(markedUpCents(1095, 0.15)).toBe(1260);
  });
});

describe('mock delivery providers', () => {
  const restaurant = firstRestaurant();
  const item = restaurant.categories[0]!.items[0]!;
  const doordash = deliverySpecs.find((spec) => spec.id === 'doordash')!;

  it('builds a total from menu, fees and tax, with no tip', async () => {
    const provider = createMockDeliveryProvider(doordash);
    const result = await provider.getQuote({
      restaurant: { ...restaurant, providerIds: ['doordash'] },
      deliverTo: near,
      distanceMeters: 2000,
      lines: [{ item, quantity: 2 }],
      now: fixedNow,
    });
    if (result.status !== 'ok') {
      throw new Error(result.reason);
    }
    const { quote } = result;
    const fees = quote.fees.reduce((sum, fee) => sum + fee.amountCents, 0);
    expect(quote.totalBeforeTipCents).toBe(quote.subtotalCents + fees + quote.taxCents);
    expect(quote.taxCents).toBe(Math.round(quote.subtotalCents * ESTIMATED_TAX_RATE));
    expect(quote.subtotalCents).toBeGreaterThanOrEqual(item.priceCents * 2);
    expect(quote.fees.map((fee) => fee.kind)).not.toContain('tip');
    expect(quote.fees.find((fee) => fee.kind === 'service')!.amountCents).toBeGreaterThanOrEqual(
      300,
    );
  });

  it('adds a small order fee under the threshold only', async () => {
    const provider = createMockDeliveryProvider({ ...doordash, inStorePriceChance: 1 });
    const base = {
      restaurant: { ...restaurant, providerIds: ['doordash' as const] },
      deliverTo: near,
      distanceMeters: 1000,
      now: fixedNow,
    };
    const cheap = await provider.getQuote({
      ...base,
      lines: [{ item: { ...item, priceCents: 500 }, quantity: 1 }],
    });
    const big = await provider.getQuote({
      ...base,
      lines: [{ item: { ...item, priceCents: 500 }, quantity: 4 }],
    });
    expect(
      cheap.status === 'ok' && cheap.quote.fees.some((fee) => fee.kind === 'small_order'),
    ).toBe(true);
    expect(big.status === 'ok' && big.quote.fees.some((fee) => fee.kind === 'small_order')).toBe(
      false,
    );
  });

  it('is unavailable when the restaurant is not listed or too far', async () => {
    const provider = createMockDeliveryProvider(doordash);
    const lines = [{ item, quantity: 1 }];
    const missing = await provider.getQuote({
      restaurant: { ...restaurant, providerIds: ['grubhub'] },
      deliverTo: near,
      distanceMeters: 1000,
      lines,
      now: fixedNow,
    });
    expect(missing.status).toBe('unavailable');
    const far = await provider.getQuote({
      restaurant: { ...restaurant, providerIds: ['doordash'] },
      deliverTo: near,
      distanceMeters: 50_000,
      lines,
      now: fixedNow,
    });
    expect(far.status).toBe('unavailable');
  });
});

describe('food endpoints', () => {
  const app = createApp(testDeps());
  const restaurant = firstRestaurant();
  const itemId = restaurant.categories[0]!.items[0]!.id;

  it('searches restaurants near a point', async () => {
    const response = await app.request(
      `/v1/food/restaurants?lat=${near.latitude}&lng=${near.longitude}&cuisine=${restaurant.cuisine}`,
    );
    expect(response.status).toBe(200);
    const body = restaurantSearchResponseSchema.parse(await response.json());
    expect(body.restaurants.some((entry) => entry.id === restaurant.id)).toBe(true);
  });

  it('requires a location for search', async () => {
    expect((await app.request('/v1/food/restaurants?q=pizza')).status).toBe(400);
  });

  it('serves a restaurant with its menu', async () => {
    const response = await app.request(`/v1/food/restaurants/${restaurant.id}`);
    const body = restaurantDetailResponseSchema.parse(await response.json());
    expect(body.restaurant.name).toBe(restaurant.name);
    expect((await app.request('/v1/food/restaurants/r_x')).status).toBe(404);
  });

  it('quotes a cart on every app that lists the restaurant, sorted by total before tip', async () => {
    const response = await app.request('/v1/food/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: restaurant.id,
        deliverTo: near,
        items: [
          { itemId, quantity: 1 },
          { itemId, quantity: 1 },
        ],
      }),
    });
    expect(response.status).toBe(200);
    const body = foodQuotesResponseSchema.parse(await response.json());
    expect(body.inStoreSubtotalCents).toBe(restaurant.categories[0]!.items[0]!.priceCents * 2);
    expect(body.quotes.length + body.unavailable.length).toBe(4);
    expect(new Set(body.quotes.map((quote) => quote.providerId))).toEqual(
      new Set(restaurant.providerIds),
    );
    const totals = body.quotes.map((quote) => quote.totalBeforeTipCents);
    expect(totals).toEqual([...totals].sort((a, b) => a - b));
  });

  it('applies delivery memberships before sorting', async () => {
    const big = restaurant.categories.flatMap((category) => category.items)[0]!;
    const request = (membershipIds: string[]) =>
      app.request('/v1/food/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          deliverTo: near,
          items: [{ itemId: big.id, quantity: 4 }],
          membershipIds,
        }),
      });
    const plain = foodQuotesResponseSchema.parse(await (await request([])).json());
    const member = foodQuotesResponseSchema.parse(
      await (await request(['dashpass_annual', 'grubhub_plus', 'uber_one'])).json(),
    );
    for (const quote of member.quotes) {
      const before = plain.quotes.find((entry) => entry.providerId === quote.providerId)!;
      expect(quote.standardTotalBeforeTipCents).toBe(before.totalBeforeTipCents);
      expect(quote.totalBeforeTipCents).toBeLessThan(before.totalBeforeTipCents);
      expect(quote.membership).not.toBeNull();
      expect(quote.fees.find((fee) => fee.kind === 'delivery')?.amountCents).toBe(0);
    }
    const totals = member.quotes.map((quote) => quote.totalBeforeTipCents);
    expect(totals).toEqual([...totals].sort((a, b) => a - b));
  });

  it('rejects unknown items and restaurants', async () => {
    const post = (body: unknown) =>
      app.request('/v1/food/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    const unknownItem = await post({
      restaurantId: restaurant.id,
      deliverTo: near,
      items: [{ itemId: 'nope', quantity: 1 }],
    });
    expect(unknownItem.status).toBe(422);
    const unknownRestaurant = await post({
      restaurantId: 'r_0_0_7',
      deliverTo: near,
      items: [{ itemId, quantity: 1 }],
    });
    expect(unknownRestaurant.status).toBe(404);
    expect((await post({ restaurantId: restaurant.id, deliverTo: near, items: [] })).status).toBe(
      400,
    );
  });
});
