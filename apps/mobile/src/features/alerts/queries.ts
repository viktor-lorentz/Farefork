import {
  ALERT_LIFETIME_DAYS,
  type NewPriceAlert,
  type PriceAlertRow,
  priceAlertRowSchema,
} from '@repo/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AccountError } from '@/features/account/queries';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useSession, useUserId } from '@/stores/session';
import { registerForPushNotifications } from './push';

export const alertKeys = {
  all: (userId: string | null) => ['account', userId, 'alerts'] as const,
};

function client() {
  if (!supabase) {
    throw new AccountError('Accounts aren’t set up in this build.');
  }
  return supabase;
}

function fail(error: { message: string; code?: string }): never {
  if (error.code === '42P01' || error.code === 'PGRST205') {
    throw new AccountError(
      'Price alerts need the alerts database tables. Run the Supabase alerts migration.',
    );
  }
  throw new AccountError(error.message);
}

function freshExpiry(): string {
  return new Date(Date.now() + ALERT_LIFETIME_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function useAlerts() {
  const userId = useUserId();
  const signedIn = useSession((state) => state.status === 'signedIn');
  return useQuery({
    queryKey: alertKeys.all(userId),
    enabled: signedIn,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<PriceAlertRow[]> => {
      const { data, error } = await client()
        .from('price_alerts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        fail(error);
      }
      return (data as unknown[])
        .map((row) => priceAlertRowSchema.safeParse(row))
        .flatMap((parsed) => (parsed.success ? [parsed.data] : []));
    },
  });
}

function invalidate(userId: string | null) {
  return queryClient.invalidateQueries({ queryKey: alertKeys.all(userId) });
}

export function useCreateAlert() {
  const userId = useUserId();
  return useMutation({
    mutationFn: async (alert: NewPriceAlert) => {
      const { error } = await client().from('price_alerts').insert({
        pickup: alert.pickup,
        dropoff: alert.dropoff,
        title: alert.title,
        target_cents: alert.targetCents,
        membership_ids: alert.membershipIds,
      });
      if (error) {
        fail(error);
      }
      void registerForPushNotifications();
    },
    onSettled: () => invalidate(userId),
  });
}

export function useResumeAlert() {
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, targetCents }: { id: string; targetCents?: number }) => {
      const { error } = await client()
        .from('price_alerts')
        .update({
          active: true,
          expires_at: freshExpiry(),
          triggered_at: null,
          triggered_price_cents: null,
          triggered_provider_id: null,
          last_checked_at: null,
          ...(targetCents !== undefined ? { target_cents: targetCents } : {}),
        })
        .eq('id', id);
      if (error) {
        fail(error);
      }
    },
    onSettled: () => invalidate(userId),
  });
}

export function useDeleteAlert() {
  const userId = useUserId();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client().from('price_alerts').delete().eq('id', id);
      if (error) {
        fail(error);
      }
    },
    onMutate: (id) => {
      queryClient.setQueryData<PriceAlertRow[]>(alertKeys.all(userId), (rows) =>
        rows?.filter((row) => row.id !== id),
      );
    },
    onSettled: () => invalidate(userId),
  });
}
