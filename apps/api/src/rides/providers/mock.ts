import { metersToMiles, type RideClass, type RideProviderId, type RideQuote } from '@repo/shared';
import { type BookingTarget, lyftBookingUrl, uberBookingUrl, waymoBookingUrl } from '../deepLinks';
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

export type SurgeSpec = {
  probability: number;
  max: number;
};

type Availability = { bookVia: RideProviderId } | { reason: string };

export type MockProviderSpec = {
  id: RideProviderId;
  autonomous: boolean;
  products: readonly ProductSpec[];
  surge: SurgeSpec;
  availability: (trip: TripContext) => Availability;
  bookingUrl: (target: BookingTarget, product: ProductSpec, bookVia: RideProviderId) => string;
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

export function priceProduct(
  product: ProductSpec,
  miles: number,
  minutes: number,
  surgeMultiplier: number,
  variance: number,
): number {
  const metered =
    product.baseCents + product.perMileCents * miles + product.perMinuteCents * minutes;
  const total = metered * surgeMultiplier * variance + product.bookingFeeCents;
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
      const surging = random.chance(spec.surge.probability);
      const surgeMultiplier = surging
        ? Math.round(random.between(1.1, spec.surge.max) * 10) / 10
        : 1;
      const miles = metersToMiles(trip.route.distanceMeters);
      const minutes = trip.route.durationSeconds / 60;
      const target: BookingTarget = {
        pickup: trip.pickup,
        dropoff: trip.dropoff,
        dropoffName: trip.dropoffName,
      };
      const quotes: RideQuote[] = spec.products.map((product) => ({
        id: `${spec.id}:${product.key}`,
        providerId: spec.id,
        productName: product.name,
        rideClass: product.rideClass,
        seats: product.seats,
        autonomous: spec.autonomous,
        priceCents: priceProduct(
          product,
          miles,
          minutes,
          surgeMultiplier,
          random.between(0.95, 1.06),
        ),
        surgeMultiplier,
        pickupEtaMinutes: random.int(product.pickupEta[0], product.pickupEta[1]),
        tripMinutes: Math.max(1, Math.ceil(minutes)),
        bookVia: availability.bookVia,
        bookingUrl: spec.bookingUrl(target, product, availability.bookVia),
      }));
      return Promise.resolve({ status: 'ok', quotes });
    },
  };
}

export const uberSpec: MockProviderSpec = {
  id: 'uber',
  autonomous: false,
  surge: { probability: 0.3, max: 1.9 },
  availability: () => ({ bookVia: 'uber' }),
  bookingUrl: (target) => uberBookingUrl(target),
  products: [
    {
      key: 'uberx',
      name: 'UberX',
      rideClass: 'economy',
      seats: 4,
      baseCents: 280,
      perMileCents: 145,
      perMinuteCents: 38,
      bookingFeeCents: 295,
      minimumCents: 950,
      pickupEta: [2, 7],
    },
    {
      key: 'comfort',
      name: 'Comfort',
      rideClass: 'comfort',
      seats: 4,
      baseCents: 350,
      perMileCents: 190,
      perMinuteCents: 48,
      bookingFeeCents: 295,
      minimumCents: 1200,
      pickupEta: [3, 9],
    },
    {
      key: 'uberxl',
      name: 'UberXL',
      rideClass: 'xl',
      seats: 6,
      baseCents: 400,
      perMileCents: 245,
      perMinuteCents: 55,
      bookingFeeCents: 295,
      minimumCents: 1300,
      pickupEta: [4, 11],
    },
    {
      key: 'black',
      name: 'Uber Black',
      rideClass: 'premium',
      seats: 4,
      baseCents: 800,
      perMileCents: 375,
      perMinuteCents: 75,
      bookingFeeCents: 0,
      minimumCents: 2500,
      pickupEta: [5, 14],
    },
  ],
};

export const lyftSpec: MockProviderSpec = {
  id: 'lyft',
  autonomous: false,
  surge: { probability: 0.3, max: 1.8 },
  availability: () => ({ bookVia: 'lyft' }),
  bookingUrl: (target, product) => lyftBookingUrl(target, product.deepLinkId ?? 'lyft'),
  products: [
    {
      key: 'standard',
      name: 'Lyft',
      rideClass: 'economy',
      seats: 4,
      baseCents: 250,
      perMileCents: 140,
      perMinuteCents: 40,
      bookingFeeCents: 310,
      minimumCents: 925,
      pickupEta: [2, 8],
      deepLinkId: 'lyft',
    },
    {
      key: 'extra_comfort',
      name: 'Extra Comfort',
      rideClass: 'comfort',
      seats: 4,
      baseCents: 320,
      perMileCents: 185,
      perMinuteCents: 46,
      bookingFeeCents: 310,
      minimumCents: 1150,
      pickupEta: [3, 10],
    },
    {
      key: 'xl',
      name: 'Lyft XL',
      rideClass: 'xl',
      seats: 6,
      baseCents: 380,
      perMileCents: 235,
      perMinuteCents: 55,
      bookingFeeCents: 310,
      minimumCents: 1275,
      pickupEta: [4, 12],
      deepLinkId: 'lyft_plus',
    },
    {
      key: 'black',
      name: 'Lyft Black',
      rideClass: 'premium',
      seats: 4,
      baseCents: 750,
      perMileCents: 360,
      perMinuteCents: 72,
      bookingFeeCents: 0,
      minimumCents: 2400,
      pickupEta: [6, 15],
      deepLinkId: 'lyft_lux',
    },
  ],
};

export function waymoSpec(areas: readonly ServiceArea[] = waymoServiceAreas): MockProviderSpec {
  return {
    id: 'waymo',
    autonomous: true,
    surge: { probability: 0.15, max: 1.4 },
    availability: (trip) => {
      const area = areaServing(areas, trip.pickup, trip.dropoff);
      return area
        ? { bookVia: area.bookVia }
        : { reason: 'This trip is outside the simulated Waymo service areas.' };
    },
    bookingUrl: (target, _product, bookVia) =>
      bookVia === 'uber' ? uberBookingUrl(target) : waymoBookingUrl(),
    products: [
      {
        key: 'waymo',
        name: 'Waymo',
        rideClass: 'comfort',
        seats: 4,
        baseCents: 300,
        perMileCents: 195,
        perMinuteCents: 42,
        bookingFeeCents: 0,
        minimumCents: 1000,
        pickupEta: [3, 12],
      },
    ],
  };
}

export function createMockRideProviders(): RideProvider[] {
  return [uberSpec, lyftSpec, waymoSpec()].map(createMockProvider);
}
