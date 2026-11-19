import { type Place, rideQuotesResponseSchema } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { ApiError, apiPost } from '@/lib/api';
import { usePreferences } from '@/stores/preferences';
import { isCurrentLocation } from '@/stores/trip';

const QUOTE_STALE_MS = 60 * 1000;

function coordinateKey(place: Place): string {
  return `${place.latitude.toFixed(5)},${place.longitude.toFixed(5)}`;
}

export function useRideQuotes(pickup: Place | null, dropoff: Place | null) {
  const membershipIds = usePreferences((state) => state.membershipIds);
  return useQuery({
    queryKey: [
      'rides',
      'quotes',
      pickup ? coordinateKey(pickup) : null,
      dropoff ? coordinateKey(dropoff) : null,
      [...membershipIds].sort().join(','),
    ],
    queryFn: ({ signal }) => {
      if (!pickup || !dropoff) {
        throw new Error('A pickup and a destination are required');
      }
      return apiPost(
        '/v1/rides/quotes',
        {
          pickup: { latitude: pickup.latitude, longitude: pickup.longitude },
          dropoff: { latitude: dropoff.latitude, longitude: dropoff.longitude },
          pickupName: isCurrentLocation(pickup) ? 'Current location' : pickup.name,
          dropoffName: dropoff.name,
          membershipIds,
        },
        rideQuotesResponseSchema,
        signal,
      );
    },
    enabled: pickup !== null && dropoff !== null,
    staleTime: QUOTE_STALE_MS,
    refetchInterval: QUOTE_STALE_MS * 2,
    retry: (failureCount, error) =>
      failureCount < 1 &&
      !(error instanceof ApiError && error.status !== null && error.status < 500),
  });
}
