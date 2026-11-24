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
  const black = uberSpec.products[3]!;

  it('applies base, distance, time and booking fee', () => {
    expect(priceProduct(uberX, 5, 20)).toBe(165 + 135 * 5 + 26 * 20 + 990);
  });

  it('never goes below the minimum fare', () => {
    expect(priceProduct(black, 0.2, 1)).toBe(black.minimumCents);
  });
});

describe('mock providers', () => {
  it('are deterministic within a quote window', async () => {
    const uber = createMockProvider(uberSpec);
    const first = await quotesFor(uber, trip());
    const second = await quotesFor(uber, trip({ now: new Date(fixedNow.getTime() + 30_000) }));
    expect(second).toEqual(first);
  });

  it('match observed Los Angeles fares for an 8.2 mile trip', async () => {
    const la = trip({ route: { ...route, distanceMeters: 13223, durationSeconds: 990 } });
    const uber = await quotesFor(createMockProvider(uberSpec), la);
    const lyft = await quotesFor(createMockProvider(lyftSpec), la);
    const uberX = uber.find((quote) => quote.rideClass === 'economy')!;
    const lyftStandard = lyft.find((quote) => quote.rideClass === 'economy')!;
    expect(uberX.priceCents).toBeGreaterThan(2650);
    expect(uberX.priceCents).toBeLessThan(2750);
    expect(lyftStandard.priceCents).toBeGreaterThan(uberX.priceCents);
    expect([...uber, ...lyft].every((quote) => quote.surgeMultiplier === 1)).toBe(true);
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
    expect(austin[0]?.bookingUrl.startsWith('https://m.uber.com/go/product-selection')).toBe(true);
    expect(austin[0]?.appUrl?.startsWith('uber://')).toBe(true);
    expect(
      sf[0]?.appUrl?.startsWith('https://app.waymo.com/route/trip/create?pickup=my_location'),
    ).toBe(true);
    expect(new URL(sf[0]!.appUrl!).searchParams.get('dropoff_latitude')).toBe('37.759600');
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
    pickupName: 'Ferry Building',
    dropoffName: 'Dolores Park',
  };

  it('builds an Uber web link with pickup and dropoff filled in', () => {
    const url = new URL(uberBookingUrl(target));
    expect(url.origin + url.pathname).toBe('https://m.uber.com/go/product-selection');
    expect(JSON.parse(url.searchParams.get('pickup') ?? '')).toEqual({
      addressLine1: 'Ferry Building',
      latitude: 37.7955,
      longitude: -122.3937,
    });
    expect(JSON.parse(url.searchParams.get('drop[0]') ?? '')).toMatchObject({
      addressLine1: 'Dolores Park',
      longitude: -122.427,
    });
  });

  it('labels unnamed stops in the Uber web link', () => {
    const url = new URL(uberBookingUrl({ pickup: target.pickup, dropoff: target.dropoff }));
    expect(JSON.parse(url.searchParams.get('pickup') ?? '')).toMatchObject({
      addressLine1: 'Pickup',
    });
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

  it('passes place names and addresses so the apps do not guess a nearby business', () => {
    const named = {
      ...target,
      dropoffName: 'The Grove',
      dropoffAddress: '189 The Grove Dr, Los Angeles, CA',
    };
    const uber = new URL(uberAppUrl(named));
    expect(uber.searchParams.get('dropoff[nickname]')).toBe('The Grove');
    expect(uber.searchParams.get('dropoff[formatted_address]')).toBe(named.dropoffAddress);
    const web = new URL(uberBookingUrl(named));
    expect(JSON.parse(web.searchParams.get('drop[0]') ?? '')).toMatchObject({
      addressLine1: 'The Grove',
      addressLine2: named.dropoffAddress,
    });
    const lyft = new URL(lyftBookingUrl(named, 'lyft'));
    expect(lyft.searchParams.get('destination[address]')).toBe(
      'The Grove, 189 The Grove Dr, Los Angeles, CA',
    );
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
      { pickup: places.ferryBuilding, dropoff: places.doloresPark, membershipIds: [] },
      { router: createEstimateRouter(), providers: [uber!, broken], now: () => fixedNow },
    );
    expect(response.quotes.every((quote) => quote.providerId === 'uber')).toBe(true);
    expect(response.unavailable).toEqual([
      { providerId: 'lyft', reason: 'Prices could not be loaded.' },
    ]);
    expect(response.expiresAt).toBe('2026-11-18T18:02:00.000Z');
  });
});
