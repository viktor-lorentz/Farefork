import {
  type NewFavorite,
  type Place,
  type RestaurantSummary,
  routeFavoriteKey,
} from '@repo/shared';

export function routeFavorite(pickup: Place, dropoff: Place, fromHere: boolean): NewFavorite {
  const from = fromHere ? null : pickup;
  const payload = { pickup: from, dropoff };
  return {
    kind: 'route',
    key: routeFavoriteKey(payload),
    title: from ? `${from.name} to ${dropoff.name}` : dropoff.name,
    subtitle: from ? null : 'From where you are',
    payload,
  };
}

export function restaurantFavorite(
  restaurant: Pick<RestaurantSummary, 'id' | 'name'>,
  subtitle: string,
): NewFavorite {
  return {
    kind: 'restaurant',
    key: restaurant.id,
    title: restaurant.name,
    subtitle,
    payload: { restaurantId: restaurant.id },
  };
}
