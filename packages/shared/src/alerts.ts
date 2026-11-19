import { z } from 'zod';
import { membershipIdsSchema } from './memberships';
import { providerIdSchema } from './providers';

export const alertPlaceSchema = z.object({
  name: z.string().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type AlertPlace = z.infer<typeof alertPlaceSchema>;

export const MIN_ALERT_CENTS = 100;
export const MAX_ALERTS = 20;
export const ALERT_LIFETIME_DAYS = 7;

export const priceAlertRowSchema = z.object({
  id: z.string(),
  pickup: alertPlaceSchema,
  dropoff: alertPlaceSchema,
  title: z.string(),
  target_cents: z.number().int(),
  membership_ids: membershipIdsSchema,
  active: z.boolean(),
  expires_at: z.string(),
  last_checked_at: z.string().nullable(),
  last_price_cents: z.number().int().nullable(),
  last_provider_id: providerIdSchema.nullable().catch(null),
  triggered_at: z.string().nullable(),
  triggered_price_cents: z.number().int().nullable(),
  triggered_provider_id: providerIdSchema.nullable().catch(null),
  created_at: z.string(),
});

export type PriceAlertRow = z.infer<typeof priceAlertRowSchema>;

export type NewPriceAlert = {
  pickup: AlertPlace;
  dropoff: AlertPlace;
  title: string;
  targetCents: number;
  membershipIds: string[];
};

export function suggestedTargetCents(cheapestCents: number): number {
  return Math.max(MIN_ALERT_CENTS, Math.floor((cheapestCents * 0.9) / 50) * 50);
}

export type AlertStatus = 'triggered' | 'watching' | 'paused' | 'expired';

export function alertStatus(alert: PriceAlertRow, now: Date): AlertStatus {
  if (alert.triggered_at !== null && !alert.active) {
    return 'triggered';
  }
  if (new Date(alert.expires_at).getTime() <= now.getTime()) {
    return 'expired';
  }
  return alert.active ? 'watching' : 'paused';
}
