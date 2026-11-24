import { metersToMiles, type RideClass, type RideProviderId, type RideQuote } from '@repo/shared';
import {
  type BookingTarget,
  lyftAppUrl,
  lyftBookingUrl,
  uberAppUrl,
  uberBookingUrl,
  waymoAppUrl,
} from '../deepLinks';
import { seededRandom } from '../random';
import { areaServing, type ServiceArea, waymoServiceAreas } from '../serviceAreas';
import type { RideProvider, TripContext } from './types';

export const QUOTE_WINDOW_MS = 2 * 60 * 1000;

export type ProductSpec = {
  key: string;
  name: string;
  rideClass: RideClass;
  seats: number;
  baseCents: number;
  perMileCents: number;
  perMinuteCents: number;
  bookingFeeCents: number;
  minimumCents: number;
  pickupEta: readonly [min: number, max: number];
  deepLinkId?: string;
};

type Availability = { bookVia: RideProviderId } | { reason: string };

export type MockProviderSpec = {
  id: RideProviderId;
  autonomous: boolean;
  products: readonly ProductSpec[];
  availability: (trip: TripContext) => Availability;
  bookingUrl: (target: BookingTarget, product: ProductSpec, bookVia: RideProviderId) => string;
  appUrl: (target: BookingTarget, product: ProductSpec, bookVia: RideProviderId) => string | null;
};

function roundCoordinate(value: number): string {
  return value.toFixed(3);
}

export function tripSeed(providerId: RideProviderId, trip: TripContext): string {
  const window = Math.floor(trip.now.getTime() / QUOTE_WINDOW_MS);
  return [
    providerId,
    roundCoordinate(trip.pickup.latitude),
    roundCoordinate(trip.pickup.longitude),
    roundCoordinate(trip.dropoff.latitude),
    roundCoordinate(trip.dropoff.longitude),
    window,
  ].join('|');
}

export function priceProduct(product: ProductSpec, miles: number, minutes: number): number {
  const total =
    product.baseCents +
    product.perMileCents * miles +
    product.perMinuteCents * minutes +
    product.bookingFeeCents;
  return Math.max(product.minimumCents, Math.round(total));
}

export function createMockProvider(spec: MockProviderSpec): RideProvider {
  return {
    id: spec.id,
    getQuotes(trip) {
      const availability = spec.availability(trip);
      if ('reason' in availability) {
        return Promise.resolve({ status: 'unavailable', reason: availability.reason });
      }
      const random = seededRandom(tripSeed(spec.id, trip));
      const miles = metersToMiles(trip.route.distanceMeters);
      const minutes = trip.route.durationSeconds / 60;
      const target: BookingTarget = {
        pickup: trip.pickup,
        dropoff: trip.dropoff,
        pickupName: trip.pickupName,
        dropoffName: trip.dropoffName,
        pickupAddress: trip.pickupAddress,
        dropoffAddress: trip.dropoffAddress,
      };
      const quotes: RideQuote[] = spec.products.map((product) => {
        const priceCents = priceProduct(product, miles, minutes);
        return {
          id: `${spec.id}:${product.key}`,
          providerId: spec.id,
          productName: product.name,
          rideClass: product.rideClass,
          seats: product.seats,
          autonomous: spec.autonomous,
          priceCents,
          standardPriceCents: priceCents,
          membership: null,
          creditBackCents: 0,
          membershipNote: null,
          surgeMultiplier: 1,
          pickupEtaMinutes: random.int(product.pickupEta[0], product.pickupEta[1]),
          tripMinutes: Math.max(1, Math.ceil(minutes)),
          bookVia: availability.bookVia,
          bookingUrl: spec.bookingUrl(target, product, availability.bookVia),
          appUrl: spec.appUrl(target, product, availability.bookVia),
        };
      });
      return Promise.resolve({ status: 'ok', quotes });
    },
  };
}

export const uberSpec: MockProviderSpec = {
  id: 'uber',
  autonomous: false,
  availability: () => ({ bookVia: 'uber' }),
  bookingUrl: (target) => uberBookingUrl(target),
  appUrl: (target) => uberAppUrl(target),
  products: [
    {
      key: 'uberx',
      name: 'UberX',
      rideClass: 'economy',
      seats: 4,
      baseCents: 165,
      perMileCents: 135,
      perMinuteCents: 26,
      bookingFeeCents: 990,
      minimumCents: 1050,
      pickupEta: [2, 7],
    },
    {
      key: 'comfort',
      name: 'Comfort',
      rideClass: 'comfort',
      seats: 4,
      baseCents: 200,
      perMileCents: 150,
      perMinuteCents: 30,
      bookingFeeCents: 990,
      minimumCents: 1250,
      pickupEta: [3, 9],
    },
    {
      key: 'uberxl',
      name: 'UberXL',
      rideClass: 'xl',
      seats: 6,
      baseCents: 300,
      perMileCents: 230,
      perMinuteCents: 40,
      bookingFeeCents: 850,
      minimumCents: 1400,
      pickupEta: [4, 11],
    },
    {
      key: 'black',
      name: 'Uber Black',
      rideClass: 'premium',
      seats: 4,
      baseCents: 900,
      perMileCents: 170,
      perMinuteCents: 33,
      bookingFeeCents: 0,
      minimumCents: 1500,
      pickupEta: [5, 14],
    },
  ],
};

export const lyftSpec: MockProviderSpec = {
  id: 'lyft',
  autonomous: false,
  availability: () => ({ bookVia: 'lyft' }),
  bookingUrl: (target, product) => lyftBookingUrl(target, product.deepLinkId ?? 'lyft'),
  appUrl: (target, product) => lyftAppUrl(target, product.deepLinkId ?? 'lyft'),
  products: [
    {
      key: 'standard',
      name: 'Lyft',
      rideClass: 'economy',
      seats: 4,
      baseCents: 200,
      perMileCents: 240,
      perMinuteCents: 48,
      bookingFeeCents: 430,
      minimumCents: 1100,
      pickupEta: [2, 8],
      deepLinkId: 'lyft',
    },
    {
      key: 'extra_comfort',
      name: 'Extra Comfort',
      rideClass: 'comfort',
      seats: 4,
      baseCents: 250,
      perMileCents: 255,
      perMinuteCents: 50,
      bookingFeeCents: 430,
      minimumCents: 1300,
      pickupEta: [3, 10],
    },
    {
      key: 'xl',
      name: 'Lyft XL',
      rideClass: 'xl',
      seats: 6,
      baseCents: 300,
      perMileCents: 333,
      perMinuteCents: 60,
      bookingFeeCents: 430,
      minimumCents: 1500,
      pickupEta: [4, 12],
      deepLinkId: 'lyft_plus',
    },
    {
      key: 'black',
      name: 'Lyft Black',
      rideClass: 'premium',
      seats: 4,
      baseCents: 750,
      perMileCents: 380,
      perMinuteCents: 70,
      bookingFeeCents: 0,
      minimumCents: 2000,
      pickupEta: [6, 15],
      deepLinkId: 'lyft_lux',
    },
  ],
};

export function waymoSpec(areas: readonly ServiceArea[] = waymoServiceAreas): MockProviderSpec {
  return {
    id: 'waymo',
    autonomous: true,
    availability: (trip) => {
      const area = areaServing(areas, trip.pickup, trip.dropoff);
      return area
        ? { bookVia: area.bookVia }
        : { reason: 'This trip is outside the simulated Waymo service areas.' };
    },
    bookingUrl: (target, _product, bookVia) =>
      bookVia === 'uber' ? uberBookingUrl(target) : waymoAppUrl(target),
    appUrl: (target, _product, bookVia) =>
      bookVia === 'uber' ? uberAppUrl(target) : waymoAppUrl(target),
    products: [
      {
        key: 'waymo',
        name: 'Waymo',
        rideClass: 'comfort',
        seats: 4,
        baseCents: 400,
        perMileCents: 220,
        perMinuteCents: 45,
        bookingFeeCents: 0,
        minimumCents: 1200,
        pickupEta: [3, 12],
      },
    ],
  };
}

export function createMockRideProviders(): RideProvider[] {
  return [uberSpec, lyftSpec, waymoSpec()].map(createMockProvider);
}
