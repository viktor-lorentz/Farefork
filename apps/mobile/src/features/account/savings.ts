import type { FoodQuote, NewHandoff, RideQuote } from '@repo/shared';

function average(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function savings(priceCents: number, baselineCents: number | null): number {
  return baselineCents === null ? 0 : Math.max(0, baselineCents - priceCents);
}

export function rideBaselineCents(chosen: RideQuote, quotes: readonly RideQuote[]): number | null {
  const cheapestByProvider = new Map<string, number>();
  for (const quote of quotes) {
    if (quote.providerId === chosen.providerId || quote.rideClass !== chosen.rideClass) {
      continue;
    }
    const current = cheapestByProvider.get(quote.providerId);
    if (current === undefined || quote.priceCents < current) {
      cheapestByProvider.set(quote.providerId, quote.priceCents);
    }
  }
  return average([...cheapestByProvider.values()]);
}

export function rideHandoff(
  chosen: RideQuote,
  quotes: readonly RideQuote[],
  route: { from: string; to: string },
): NewHandoff {
  const baseline = rideBaselineCents(chosen, quotes);
  return {
    kind: 'ride',
    provider_id: chosen.providerId,
    title: chosen.productName,
    subtitle: `${route.from} → ${route.to}`,
    price_cents: chosen.priceCents,
    standard_price_cents: chosen.standardPriceCents,
    baseline_cents: baseline,
    saved_cents: savings(chosen.priceCents, baseline),
    membership_saved_cents: Math.max(0, chosen.standardPriceCents - chosen.priceCents),
    simulated: true,
  };
}

export function foodBaselineCents(chosen: FoodQuote, quotes: readonly FoodQuote[]): number | null {
  return average(
    quotes
      .filter((quote) => quote.providerId !== chosen.providerId)
      .map((quote) => quote.totalBeforeTipCents),
  );
}

export function foodHandoff(
  chosen: FoodQuote,
  quotes: readonly FoodQuote[],
  order: { restaurantName: string; itemCount: number },
): NewHandoff {
  const baseline = foodBaselineCents(chosen, quotes);
  return {
    kind: 'food',
    provider_id: chosen.providerId,
    title: order.restaurantName,
    subtitle: `${order.itemCount} ${order.itemCount === 1 ? 'item' : 'items'}`,
    price_cents: chosen.totalBeforeTipCents,
    standard_price_cents: chosen.standardTotalBeforeTipCents,
    baseline_cents: baseline,
    saved_cents: savings(chosen.totalBeforeTipCents, baseline),
    membership_saved_cents: Math.max(
      0,
      chosen.standardTotalBeforeTipCents - chosen.totalBeforeTipCents,
    ),
    simulated: true,
  };
}
