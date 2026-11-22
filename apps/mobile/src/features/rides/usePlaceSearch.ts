import { type LatLng, placeSearchResponseSchema } from '@repo/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { dedupePlaces } from './placeText';
import { useDebouncedValue } from './useDebouncedValue';

export const MIN_QUERY_LENGTH = 2;

export function usePlaceSearch(text: string, near: LatLng | null) {
  const query = useDebouncedValue(text.trim(), 250);
  const lat = near ? near.latitude.toFixed(2) : null;
  const lng = near ? near.longitude.toFixed(2) : null;
  const enabled = query.length >= MIN_QUERY_LENGTH;
  const result = useQuery({
    queryKey: ['places', 'search', query.toLowerCase(), lat, lng],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ q: query });
      if (lat !== null && lng !== null) {
        params.set('lat', lat);
        params.set('lng', lng);
      }
      return apiGet(`/v1/places/search?${params.toString()}`, placeSearchResponseSchema, signal);
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  });
  return {
    ...result,
    enabled,
    settling: text.trim() !== query,
    places: enabled ? dedupePlaces(result.data?.places ?? []) : [],
  };
}
