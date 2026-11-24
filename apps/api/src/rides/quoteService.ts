import {
  haversineMeters,
  rideErrorCodes,
  type RideQuotesRequest,
  type RideQuotesResponse,
  type UnavailableRide,
} from '@repo/shared';
import type { Router } from '../geo/router';
import { applyRideMembership, resolveMemberships } from '../memberships/pricing';
import { catalogFor } from '../memberships/registry';
import { QUOTE_WINDOW_MS } from './providers/mock';
import type { RideProvider, TripContext } from './providers/types';

export const MIN_TRIP_METERS = 150;
export const MAX_TRIP_METERS = 160_000;

export class TripRejectedError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'TripRejectedError';
  }
}

export type QuoteServiceDeps = {
  router: Router;
  providers: readonly RideProvider[];
  now?: () => Date;
};

export async function getRideQuotes(
  request: RideQuotesRequest,
  deps: QuoteServiceDeps,
): Promise<RideQuotesResponse> {
  const straightLine = haversineMeters(request.pickup, request.dropoff);
  if (straightLine < MIN_TRIP_METERS) {
    throw new TripRejectedError(
      rideErrorCodes.tooClose,
      'Pickup and destination are too close together.',
    );
  }
  if (straightLine > MAX_TRIP_METERS) {
    throw new TripRejectedError(
      rideErrorCodes.tooFar,
      'This trip is longer than ride apps usually allow.',
    );
  }

  const now = deps.now?.() ?? new Date();
  const route = await deps.router.route(request.pickup, request.dropoff);
  const trip: TripContext = {
    pickup: request.pickup,
    dropoff: request.dropoff,
    pickupName: request.pickupName,
    dropoffName: request.dropoffName,
    pickupAddress: request.pickupAddress,
    dropoffAddress: request.dropoffAddress,
    route,
    now,
  };

  const results = await Promise.allSettled(
    deps.providers.map(async (provider) => ({
      provider,
      result: await provider.getQuotes(trip),
    })),
  );

  const quotes: RideQuotesResponse['quotes'] = [];
  const unavailable: UnavailableRide[] = [];
  results.forEach((settled, index) => {
    const provider = deps.providers[index];
    if (!provider) {
      return;
    }
    if (settled.status === 'rejected') {
      unavailable.push({ providerId: provider.id, reason: 'Prices could not be loaded.' });
      return;
    }
    const { result } = settled.value;
    if (result.status === 'ok') {
      quotes.push(...result.quotes);
    } else {
      unavailable.push({ providerId: provider.id, reason: result.reason });
    }
  });

  const memberships = resolveMemberships(catalogFor(now), request.membershipIds);
  const priced = quotes.map((quote) => applyRideMembership(quote, memberships));
  priced.sort((a, b) => a.priceCents - b.priceCents);

  return {
    simulated: true,
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + QUOTE_WINDOW_MS).toISOString(),
    route,
    quotes: priced,
    unavailable,
  };
}
