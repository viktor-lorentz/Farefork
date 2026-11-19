import type { RideQuote, Route } from '@repo/shared';
import { describe, expect, it } from 'vitest';
import { createEstimateRouter } from '../geo/router';
import { fixedNow, places } from '../testDeps';
import { lyftAppUrl, lyftBookingUrl, uberAppUrl, uberBookingUrl } from './deepLinks';
import {
  createMockProvider,
  createMockRideProviders,
  lyftSpec,
  priceProduct,
  uberSpec,
  waymoSpec,
} from './providers/mock';
import type { RideProvider, TripContext } from './providers/types';
import { getRideQuotes } from './quoteService';
import { areaServing, pointInRing, waymoServiceAreas } from './serviceAreas';

const route: Route = {
  distanceMeters: 8047,
  durationSeconds: 1200,
  polyline: '',
  source: 'estimate',
};

function trip(overrides: Partial<TripContext> = {}): TripContext {
  return {
    pickup: places.ferryBuilding,
    dropoff: places.doloresPark,
    route,
    now: fixedNow,
    ...overrides,
  };
}

async function quotesFor(provider: RideProvider, context: TripContext): Promise<RideQuote[]> {
  const result = await provider.getQuotes(context);
  if (result.status !== 'ok') {
    throw new Error(`expected quotes, got: ${result.reason}`);
  }
  return result.quotes;
}

describe('priceProduct', () => {
  const uberX = uberSpec.products[0]!;

  it('applies base, distance, time and booking fee', () => {
    expect(priceProduct(uberX, 5, 20, 1, 1)).toBe(280 + 145 * 5 + 38 * 20 + 295);
  });

  it('applies surge to the metered fare but not the booking fee', () => {
    const metered = 280 + 145 * 5 + 38 * 20;
    expect(priceProduct(uberX, 5, 20, 1.5, 1)).toBe(Math.round(metered * 1.5 + 295));
  });

  it('never goes below the minimum fare', () => {
    expect(priceProduct(uberX, 0.2, 1, 1, 1)).toBe(uberX.minimumCents);
  });
});

describe('mock providers', () => {
  it('are deterministic within a quote window', async () => {
    const uber = createMockProvider(uberSpec);
    const first = await quotesFor(uber, trip());
    const second = await quotesFor(uber, trip({ now: new Date(fixedNow.getTime() + 30_000) }));
    expect(second).toEqual(first);
  });

  it('change between quote windows', async () => {
    const lyft = createMockProvider(lyftSpec);
    const windows = await Promise.all(
      [0, 1, 2, 3, 4, 5].map((step) =>
        quotesFor(lyft, trip({ now: new Date(fixedNow.getTime() + step * 120_000) })),
      ),
    );
    const prices = new Set(windows.map((quotes) => quotes[0]?.priceCents));
    expect(prices.size).toBeGreaterThan(1);
  });

  it('price larger classes above economy for the same trip', async () => {
    for (const spec of [uberSpec, lyftSpec]) {
      const quotes = await quotesFor(createMockProvider(spec), trip());
      const economy = quotes.find((quote) => quote.rideClass === 'economy')!;
      const premium = quotes.find((quote) => quote.rideClass === 'premium')!;
      expect(premium.priceCents).toBeGreaterThan(economy.priceCents);
      expect(quotes.every((quote) => quote.surgeMultiplier >= 1)).toBe(true);
    }
  });

  it('book Waymo in the Waymo app in San Francisco and through Uber in Austin', async () => {
    const waymo = createMockProvider(waymoSpec());
    const sf = await quotesFor(waymo, trip());
    expect(sf[0]).toMatchObject({ providerId: 'waymo', bookVia: 'waymo', autonomous: true });

    const austin = await quotesFor(
      waymo,
      trip({ pickup: places.texasCapitol, dropoff: places.zilkerPark }),
    );
    expect(austin[0]).toMatchObject({ providerId: 'waymo', bookVia: 'uber' });
    expect(austin[0]?.bookingUrl.startsWith('https://m.uber.com/ul/')).toBe(true);
    expect(austin[0]?.appUrl?.startsWith('uber://')).toBe(true);
    expect(sf[0]?.appUrl).toBeNull();
  });

  it('reports Waymo as unavailable when the trip leaves the service area', async () => {
    const result = await createMockProvider(waymoSpec()).getQuotes(
      trip({ dropoff: places.oaklandAirport }),
    );
    expect(result.status).toBe('unavailable');
  });
});

describe('service areas', () => {
  it('uses an even-odd point in polygon test', () => {
    const square = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ] as const;
    expect(pointInRing({ latitude: 5, longitude: 5 }, square)).toBe(true);
    expect(pointInRing({ latitude: 15, longitude: 5 }, square)).toBe(false);
  });

  it('requires pickup and dropoff in the same area', () => {
    expect(areaServing(waymoServiceAreas, places.ferryBuilding, places.doloresPark)?.id).toBe(
      'sf-bay',
    );
    expect(
      areaServing(waymoServiceAreas, places.ferryBuilding, places.texasCapitol),
    ).toBeUndefined();
  });
});

describe('deep links', () => {
  const target = {
    pickup: places.ferryBuilding,
    dropoff: places.doloresPark,
    dropoffName: 'Dolores Park',
  };

  it('builds an Uber universal link with pickup and dropoff', () => {
    const url = new URL(uberBookingUrl(target));
    expect(url.origin).toBe('https://m.uber.com');
    expect(url.searchParams.get('action')).toBe('setPickup');
    expect(url.searchParams.get('pickup[latitude]')).toBe('37.795500');
    expect(url.searchParams.get('dropoff[longitude]')).toBe('-122.427000');
    expect(url.searchParams.get('dropoff[nickname]')).toBe('Dolores Park');
  });

  it('builds app scheme links that open the installed apps', () => {
    const uber = new URL(uberAppUrl(target));
    expect(uber.protocol).toBe('uber:');
    expect(uber.searchParams.get('dropoff[latitude]')).toBe('37.759600');
    const lyft = new URL(lyftAppUrl(target, 'lyft'));
    expect(lyft.protocol).toBe('lyft:');
    expect(lyft.host).toBe('ridetype');
    expect(lyft.searchParams.get('pickup[longitude]')).toBe('-122.393700');
  });

  it('builds a Lyft link with the ride type', () => {
    const url = new URL(lyftBookingUrl(target, 'lyft_plus'));
    expect(url.origin).toBe('https://lyft.com');
    expect(url.searchParams.get('id')).toBe('lyft_plus');
    expect(url.searchParams.get('destination[latitude]')).toBe('37.759600');
  });
});

describe('getRideQuotes', () => {
  it('keeps other providers when one fails', async () => {
    const broken: RideProvider = {
      id: 'lyft',
      getQuotes: () => Promise.reject(new Error('boom')),
    };
    const [uber] = createMockRideProviders();
    const response = await getRideQuotes(
      { pickup: places.ferryBuilding, dropoff: places.doloresPark },
      { router: createEstimateRouter(), providers: [uber!, broken], now: () => fixedNow },
    );
    expect(response.quotes.every((quote) => quote.providerId === 'uber')).toBe(true);
    expect(response.unavailable).toEqual([
      { providerId: 'lyft', reason: 'Prices could not be loaded.' },
    ]);
    expect(response.expiresAt).toBe('2026-11-18T18:02:00.000Z');
  });
});
