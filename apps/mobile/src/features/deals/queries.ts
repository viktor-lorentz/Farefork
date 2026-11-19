import { type DealKind, dealsResponseSchema } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { usePreferences } from '@/stores/preferences';

export function useDeals(kind: DealKind | null) {
  const membershipIds = usePreferences((state) => state.membershipIds);
  const key = [...membershipIds].sort().join(',');
  return useQuery({
    queryKey: ['deals', kind, key],
    staleTime: 15 * 60 * 1000,
    queryFn: ({ signal }) => {
      const params = new URLSearchParams();
      if (kind) {
        params.set('kind', kind);
      }
      if (key.length > 0) {
        params.set('membershipIds', key);
      }
      return apiGet(`/v1/deals?${params.toString()}`, dealsResponseSchema, signal);
    },
  });
}
