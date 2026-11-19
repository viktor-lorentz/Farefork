import { z } from 'zod';
import { placeSchema } from './geo';

export const routeFavoritePayloadSchema = z.object({
  pickup: placeSchema.nullable(),
  dropoff: placeSchema,
});

export type RouteFavoritePayload = z.infer<typeof routeFavoritePayloadSchema>;

export const restaurantFavoritePayloadSchema = z.object({
  restaurantId: z.string().min(1),
});

export type RestaurantFavoritePayload = z.infer<typeof restaurantFavoritePayloadSchema>;

const favoriteBase = {
  id: z.uuid(),
  key: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().nullable(),
  created_at: z.string(),
};

export const favoriteRowSchema = z.discriminatedUnion('kind', [
  z.object({ ...favoriteBase, kind: z.literal('route'), payload: routeFavoritePayloadSchema }),
  z.object({
    ...favoriteBase,
    kind: z.literal('restaurant'),
    payload: restaurantFavoritePayloadSchema,
  }),
]);

export type FavoriteRow = z.infer<typeof favoriteRowSchema>;
export type FavoriteKind = FavoriteRow['kind'];

export type NewFavorite =
  | {
      kind: 'route';
      key: string;
      title: string;
      subtitle: string | null;
      payload: RouteFavoritePayload;
    }
  | {
      kind: 'restaurant';
      key: string;
      title: string;
      subtitle: string | null;
      payload: RestaurantFavoritePayload;
    };

export const handoffKindSchema = z.enum(['ride', 'food']);
export type HandoffKind = z.infer<typeof handoffKindSchema>;

export const handoffRowSchema = z.object({
  id: z.uuid(),
  kind: handoffKindSchema,
  provider_id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().nullable(),
  price_cents: z.number().int().nonnegative(),
  standard_price_cents: z.number().int().nonnegative(),
  baseline_cents: z.number().int().nonnegative().nullable(),
  saved_cents: z.number().int().nonnegative(),
  membership_saved_cents: z.number().int().nonnegative(),
  simulated: z.boolean(),
  created_at: z.string(),
});

export type HandoffRow = z.infer<typeof handoffRowSchema>;

export type NewHandoff = {
  kind: HandoffKind;
  provider_id: string;
  title: string;
  subtitle: string | null;
  price_cents: number;
  standard_price_cents: number;
  baseline_cents: number | null;
  saved_cents: number;
  membership_saved_cents: number;
  simulated: boolean;
};

export const savingsSummarySchema = z.object({
  handoff_count: z.number().int().nonnegative(),
  saved_cents: z.number().int().nonnegative(),
  membership_saved_cents: z.number().int().nonnegative(),
  saved_this_month_cents: z.number().int().nonnegative(),
  membership_saved_this_month_cents: z.number().int().nonnegative(),
});

export type SavingsSummary = z.infer<typeof savingsSummarySchema>;

export const emptySavingsSummary: SavingsSummary = {
  handoff_count: 0,
  saved_cents: 0,
  membership_saved_cents: 0,
  saved_this_month_cents: 0,
  membership_saved_this_month_cents: 0,
};

function coordinate(value: number): string {
  return value.toFixed(4);
}

export function routeFavoriteKey(payload: RouteFavoritePayload): string {
  const from = payload.pickup
    ? `${coordinate(payload.pickup.latitude)},${coordinate(payload.pickup.longitude)}`
    : 'here';
  return `${from}>${coordinate(payload.dropoff.latitude)},${coordinate(payload.dropoff.longitude)}`;
}
