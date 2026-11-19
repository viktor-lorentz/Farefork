import {
  foodErrorCodes,
  type FoodQuotesRequest,
  type FoodQuotesResponse,
  haversineMeters,
  type MenuItem,
  type UnavailableDelivery,
} from '@repo/shared';
import { findRestaurant } from './catalog';
import type { DeliveryLine, DeliveryProvider } from './providers';

export class FoodRequestError extends Error {
  constructor(
    readonly code: string,
    readonly status: 404 | 422,
    message: string,
  ) {
    super(message);
    this.name = 'FoodRequestError';
  }
}

export type FoodQuoteDeps = {
  providers: readonly DeliveryProvider[];
  now?: () => Date;
};

export async function getFoodQuotes(
  request: FoodQuotesRequest,
  deps: FoodQuoteDeps,
): Promise<FoodQuotesResponse> {
  const restaurant = findRestaurant(request.restaurantId, request.deliverTo);
  if (!restaurant) {
    throw new FoodRequestError(
      foodErrorCodes.restaurantNotFound,
      404,
      'This restaurant is no longer available.',
    );
  }
  const items = new Map<string, MenuItem>(
    restaurant.categories.flatMap((category) => category.items.map((item) => [item.id, item])),
  );
  const quantities = new Map<string, number>();
  for (const line of request.items) {
    quantities.set(line.itemId, Math.min(20, (quantities.get(line.itemId) ?? 0) + line.quantity));
  }
  const lines: DeliveryLine[] = [];
  for (const [itemId, quantity] of quantities) {
    const item = items.get(itemId);
    if (!item) {
      throw new FoodRequestError(
        foodErrorCodes.unknownItem,
        422,
        'Your cart has an item this restaurant no longer sells.',
      );
    }
    lines.push({ item, quantity });
  }

  const now = deps.now?.() ?? new Date();
  const context = {
    restaurant,
    deliverTo: request.deliverTo,
    distanceMeters: haversineMeters(restaurant, request.deliverTo),
    lines,
    now,
  };

  const settled = await Promise.allSettled(
    deps.providers.map((provider) => provider.getQuote(context)),
  );
  const quotes: FoodQuotesResponse['quotes'] = [];
  const unavailable: UnavailableDelivery[] = [];
  settled.forEach((result, index) => {
    const provider = deps.providers[index];
    if (!provider) {
      return;
    }
    if (result.status === 'rejected') {
      unavailable.push({ providerId: provider.id, reason: 'Prices could not be loaded.' });
    } else if (result.value.status === 'ok') {
      quotes.push(result.value.quote);
    } else {
      unavailable.push({ providerId: provider.id, reason: result.value.reason });
    }
  });
  quotes.sort((a, b) => a.totalBeforeTipCents - b.totalBeforeTipCents);

  return {
    simulated: true,
    generatedAt: now.toISOString(),
    restaurantId: restaurant.id,
    inStoreSubtotalCents: lines.reduce(
      (sum, line) => sum + line.item.priceCents * line.quantity,
      0,
    ),
    quotes,
    unavailable,
  };
}
