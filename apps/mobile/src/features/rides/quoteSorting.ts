import type { RideClass, RideQuote } from '@repo/shared';

export type QuoteSort = 'price' | 'time';
export type ClassFilter = RideClass | 'all';

export function arrivalMinutes(quote: RideQuote): number {
  return quote.pickupEtaMinutes + quote.tripMinutes;
}

export function sortQuotes(quotes: readonly RideQuote[], sort: QuoteSort): RideQuote[] {
  return [...quotes].sort((a, b) => {
    if (sort === 'time') {
      return (
        arrivalMinutes(a) - arrivalMinutes(b) ||
        a.priceCents - b.priceCents ||
        a.id.localeCompare(b.id)
      );
    }
    return (
      a.priceCents - b.priceCents ||
      arrivalMinutes(a) - arrivalMinutes(b) ||
      a.id.localeCompare(b.id)
    );
  });
}

export function filterQuotes(quotes: readonly RideQuote[], filter: ClassFilter): RideQuote[] {
  return filter === 'all' ? [...quotes] : quotes.filter((quote) => quote.rideClass === filter);
}

export function cheapestQuoteId(quotes: readonly RideQuote[]): string | null {
  return sortQuotes(quotes, 'price')[0]?.id ?? null;
}

export function fastestQuoteId(quotes: readonly RideQuote[]): string | null {
  return sortQuotes(quotes, 'time')[0]?.id ?? null;
}

export function classesPresent(quotes: readonly RideQuote[]): Set<RideClass> {
  return new Set(quotes.map((quote) => quote.rideClass));
}

export function providerSpreadCents(quotes: readonly RideQuote[]): number {
  const cheapestByProvider = new Map<string, number>();
  for (const quote of quotes) {
    const current = cheapestByProvider.get(quote.providerId);
    if (current === undefined || quote.priceCents < current) {
      cheapestByProvider.set(quote.providerId, quote.priceCents);
    }
  }
  if (cheapestByProvider.size < 2) {
    return 0;
  }
  const prices = [...cheapestByProvider.values()];
  return Math.max(...prices) - Math.min(...prices);
}
