import { membershipCatalogSchema } from '@repo/shared';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';

export function useMembershipCatalog() {
  return useQuery({
    queryKey: ['memberships', 'catalog'],
    queryFn: ({ signal }) => apiGet('/v1/memberships', membershipCatalogSchema, signal),
    staleTime: 60 * 60 * 1000,
  });
}
