import type { RideQuote } from '@repo/shared';
import { describe, expect, it } from 'vitest';
import {
  cheapestQuoteId,
  classesPresent,
  fastestQuoteId,
  filterQuotes,
  providerSpreadCents,
  sortQuotes,
} from './quoteSorting';

function quote(overrides: Partial<RideQuote> & Pick<RideQuote, 'id'>): RideQuote {
  return {
    providerId: 'uber',
    productName: 'UberX',
    rideClass: 'economy',
    seats: 4,
    autonomous: false,
    priceCents: 1500,
    surgeMultiplier: 1,
    pickupEtaMinutes: 5,
    tripMinutes: 20,
    bookVia: 'uber',
    bookingUrl: 'https://m.uber.com/ul/',
    ...overrides,
  };
}

const quotes = [
  quote({ id: 'uber:uberx', priceCents: 1800, pickupEtaMinutes: 3 }),
  quote({ id: 'lyft:standard', providerId: 'lyft', priceCents: 1650, pickupEtaMinutes: 9 }),
  quote({
    id: 'waymo:waymo',
    providerId: 'waymo',
    rideClass: 'comfort',
    priceCents: 1650,
    pickupEtaMinutes: 4,
  }),
  quote({ id: 'uber:black', rideClass: 'premium', priceCents: 4200, pickupEtaMinutes: 6 }),
];

describe('sortQuotes', () => {
  it('sorts by price, breaking ties by arrival time', () => {
    expect(sortQuotes(quotes, 'price').map((item) => item.id)).toEqual([
      'waymo:waymo',
      'lyft:standard',
      'uber:uberx',
      'uber:black',
    ]);
  });

  it('sorts by arrival time, breaking ties by price', () => {
    expect(sortQuotes(quotes, 'time').map((item) => item.id)).toEqual([
      'uber:uberx',
      'waymo:waymo',
      'uber:black',
      'lyft:standard',
    ]);
  });

  it('does not mutate its input', () => {
    const before = quotes.map((item) => item.id);
    sortQuotes(quotes, 'time');
    expect(quotes.map((item) => item.id)).toEqual(before);
  });
});

describe('quote helpers', () => {
  it('finds the cheapest and fastest', () => {
    expect(cheapestQuoteId(quotes)).toBe('waymo:waymo');
    expect(fastestQuoteId(quotes)).toBe('uber:uberx');
    expect(cheapestQuoteId([])).toBeNull();
  });

  it('filters by class', () => {
    expect(filterQuotes(quotes, 'economy')).toHaveLength(2);
    expect(filterQuotes(quotes, 'all')).toHaveLength(4);
    expect(classesPresent(quotes)).toEqual(new Set(['economy', 'comfort', 'premium']));
  });

  it('measures the spread between the cheapest option on each app', () => {
    expect(providerSpreadCents(filterQuotes(quotes, 'economy'))).toBe(150);
    expect(providerSpreadCents([quotes[0]!])).toBe(0);
  });
});
