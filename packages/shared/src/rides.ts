import { z } from 'zod';
import { latLngSchema } from './geo';
import { rideProviderIdSchema } from './providers';

export const rideClasses = ['economy', 'comfort', 'xl', 'premium'] as const;
export const rideClassSchema = z.enum(rideClasses);
export type RideClass = z.infer<typeof rideClassSchema>;

export const rideClassLabels: Record<RideClass, string> = {
  economy: 'Economy',
  comfort: 'Comfort',
  xl: 'XL',
  premium: 'Premium',
};

export const routeSourceSchema = z.enum(['osrm', 'estimate']);
export type RouteSource = z.infer<typeof routeSourceSchema>;

export const routeSchema = z.object({
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  polyline: z.string(),
  source: routeSourceSchema,
});

export type Route = z.infer<typeof routeSchema>;

export const rideQuoteSchema = z.object({
  id: z.string().min(1),
  providerId: rideProviderIdSchema,
  productName: z.string().min(1),
  rideClass: rideClassSchema,
  seats: z.number().int().positive(),
  autonomous: z.boolean(),
  priceCents: z.number().int().nonnegative(),
  surgeMultiplier: z.number().min(1),
  pickupEtaMinutes: z.number().int().nonnegative(),
  tripMinutes: z.number().int().nonnegative(),
  bookVia: rideProviderIdSchema,
  bookingUrl: z.url(),
  appUrl: z.string().min(1).nullable(),
});

export type RideQuote = z.infer<typeof rideQuoteSchema>;

export const unavailableRideSchema = z.object({
  providerId: rideProviderIdSchema,
  reason: z.string().min(1),
});

export type UnavailableRide = z.infer<typeof unavailableRideSchema>;

export const rideQuotesRequestSchema = z.object({
  pickup: latLngSchema,
  dropoff: latLngSchema,
  dropoffName: z.string().max(200).optional(),
});

export type RideQuotesRequest = z.infer<typeof rideQuotesRequestSchema>;

export const rideQuotesResponseSchema = z.object({
  simulated: z.literal(true),
  generatedAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
  route: routeSchema,
  quotes: z.array(rideQuoteSchema),
  unavailable: z.array(unavailableRideSchema),
});

export type RideQuotesResponse = z.infer<typeof rideQuotesResponseSchema>;

export const apiErrorBodySchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export const rideErrorCodes = {
  invalidRequest: 'invalid_request',
  tooClose: 'trip_too_short',
  tooFar: 'trip_too_long',
  geocoderUnavailable: 'geocoder_unavailable',
} as const;
