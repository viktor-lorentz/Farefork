import { cuisineLabels, formatMiles, type RestaurantSummary } from '@repo/shared';

export function priceLevelLabel(level: number): string {
  return '$'.repeat(Math.max(1, Math.min(3, level)));
}

export function estimatedMinutes(restaurant: RestaurantSummary): number {
  return restaurant.prepMinutes + Math.round((restaurant.distanceMeters / 1000) * 2.6) + 5;
}

export function restaurantMeta(restaurant: RestaurantSummary): string {
  const eta = estimatedMinutes(restaurant);
  return [
    cuisineLabels[restaurant.cuisine],
    formatMiles(restaurant.distanceMeters),
    priceLevelLabel(restaurant.priceLevel),
    `${eta}–${eta + 10} min`,
  ].join(' · ');
}
