import type { LatLng, RideProviderId, RideQuote, Route } from '@repo/shared';

export type TripContext = {
  pickup: LatLng;
  dropoff: LatLng;
  dropoffName?: string;
  route: Route;
  now: Date;
};

export type RideProviderResult =
  { status: 'ok'; quotes: RideQuote[] } | { status: 'unavailable'; reason: string };

export type RideProvider = {
  id: RideProviderId;
  getQuotes(trip: TripContext): Promise<RideProviderResult>;
};
