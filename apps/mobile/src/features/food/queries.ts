import {
  type Cuisine,
  foodQuotesResponseSchema,
  type LatLng,
  restaurantDetailResponseSchema,
  restaurantSearchResponseSchema,
} from '@repo/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usePreferences } from '@/stores/preferences';
import { ApiError, apiGet, apiPost } from '@/lib/api';
import type { Cart } from './cart';
import { useDebouncedValue } from '@/features/rides/useDebouncedValue';

function roundedKey(point: LatLng | null): string | null {
  return point ? `${point.latitude.toFixed(3)},${point.longitude.toFixed(3)}` : null;
}

export function useRestaurants(near: LatLng | null, text: string, cuisine: Cuisine | null) {
  const query = useDebouncedValue(text.trim(), 250);
  return useQuery({
    queryKey: ['food', 'restaurants', roundedKey(near), query.toLowerCase(), cuisine],
    queryFn: ({ signal }) => {
      if (!near) {
        throw new Error('A delivery address is required');
      }
      const params = new URLSearchParams({
        lat: near.latitude.toFixed(5),
        lng: near.longitude.toFixed(5),
      });
      if (query.length > 0) {
        params.set('q', query);
      }
      if (cuisine) {
        params.set('cuisine', cuisine);
      }
      return apiGet(
        `/v1/food/restaurants?${params.toString()}`,
        restaurantSearchResponseSchema,
        signal,
      );
    },
    enabled: near !== null,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRestaurant(id: string | undefined, near: LatLng | null) {
  return useQuery({
    queryKey: ['food', 'restaurant', id, roundedKey(near)],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams();
      if (near) {
        params.set('lat', near.latitude.toFixed(5));
        params.set('lng', near.longitude.toFixed(5));
      }
      return apiGet(
        `/v1/food/restaurants/${encodeURIComponent(id ?? '')}?${params.toString()}`,
        restaurantDetailResponseSchema,
        signal,
      );
    },
    enabled: id !== undefined && id.length > 0,
    staleTime: 30 * 60 * 1000,
  });
}

export function useFoodQuotes(cart: Cart | null, deliverTo: LatLng | null) {
  const membershipIds = usePreferences((state) => state.membershipIds);
  const lines = cart?.items.map((item) => `${item.itemId}x${item.quantity}`).join(',') ?? '';
  return useQuery({
    queryKey: [
      'food',
      'quotes',
      cart?.restaurantId ?? null,
      lines,
      roundedKey(deliverTo),
      [...membershipIds].sort().join(','),
    ],
    queryFn: ({ signal }) => {
      if (!cart || !deliverTo) {
        throw new Error('A cart and a delivery address are required');
      }
      return apiPost(
        '/v1/food/quotes',
        {
          restaurantId: cart.restaurantId,
          deliverTo: { latitude: deliverTo.latitude, longitude: deliverTo.longitude },
          items: cart.items.map((item) => ({ itemId: item.itemId, quantity: item.quantity })),
          membershipIds,
        },
        foodQuotesResponseSchema,
        signal,
      );
    },
    enabled: cart !== null && deliverTo !== null,
    staleTime: 60 * 1000,
    retry: (failureCount, error) =>
      failureCount < 1 &&
      !(error instanceof ApiError && error.status !== null && error.status < 500),
  });
}
