import {
  emptySavingsSummary,
  type FavoriteKind,
  type FavoriteRow,
  favoriteRowSchema,
  type HandoffRow,
  handoffRowSchema,
  type NewFavorite,
  type NewHandoff,
  type SavingsSummary,
  savingsSummarySchema,
} from '@repo/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { usePendingHandoff } from '@/stores/pendingHandoff';
import { useSession, useUserId } from '@/stores/session';

const HISTORY_LIMIT = 100;

type FavoriteInsert = {
  kind: FavoriteKind;
  key: string;
  title: string;
  subtitle: string | null;
  payload: NewFavorite['payload'];
};

export class AccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountError';
  }
}

function client() {
  if (!supabase) {
    throw new AccountError('Accounts aren’t set up in this build.');
  }
  return supabase;
}

function fail(error: { message: string; code?: string }): never {
  if (error.code === '42P01' || error.code === 'PGRST205') {
    throw new AccountError('The database tables are missing. Run the Supabase migration.');
  }
  throw new AccountError(error.message);
}

function parseRows<T>(rows: unknown[], parse: (row: unknown) => T | null): T[] {
  return rows.map(parse).filter((row): row is T => row !== null);
}

export const accountKeys = {
  favorites: (userId: string | null) => ['account', userId, 'favorites'] as const,
  history: (userId: string | null) => ['account', userId, 'history'] as const,
  savings: (userId: string | null) => ['account', userId, 'savings'] as const,
};

export function useFavorites() {
  const userId = useUserId();
  return useQuery({
    queryKey: accountKeys.favorites(userId),
    enabled: userId !== null,
    queryFn: async (): Promise<FavoriteRow[]> => {
      const { data, error } = await client()
        .from('favorites')
        .select('id, kind, key, title, subtitle, payload, created_at')
        .order('created_at', { ascending: false });
      if (error) {
        fail(error);
      }
      return parseRows(data, (row) => {
        const parsed = favoriteRowSchema.safeParse(row);
        return parsed.success ? parsed.data : null;
      });
    },
  });
}

export function useFavorite(kind: FavoriteKind, key: string | null) {
  const favorites = useFavorites();
  const match =
    key === null
      ? undefined
      : favorites.data?.find((favorite) => favorite.kind === kind && favorite.key === key);
  return { favorite: match, ready: favorites.isSuccess };
}

export function useAddFavorite() {
  const userId = useUserId();
  return useMutation({
    mutationFn: async (favorite: NewFavorite) => {
      const row: FavoriteInsert = { ...favorite };
      const { error } = await client()
        .from('favorites')
        .upsert(row, { onConflict: 'user_id,kind,key', ignoreDuplicates: true });
      if (error) {
        fail(error);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: accountKeys.favorites(userId) }),
  });
}

export function useRemoveFavorite() {
  const userId = useUserId();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client().from('favorites').delete().eq('id', id);
      if (error) {
        fail(error);
      }
    },
    onMutate: (id) => {
      queryClient.setQueryData<FavoriteRow[]>(accountKeys.favorites(userId), (rows) =>
        rows?.filter((row) => row.id !== id),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: accountKeys.favorites(userId) }),
  });
}

export function useHistory() {
  const userId = useUserId();
  return useQuery({
    queryKey: accountKeys.history(userId),
    enabled: userId !== null,
    queryFn: async (): Promise<HandoffRow[]> => {
      const { data, error } = await client()
        .from('handoffs')
        .select(
          'id, kind, provider_id, title, subtitle, price_cents, standard_price_cents, baseline_cents, saved_cents, membership_saved_cents, simulated, created_at',
        )
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (error) {
        fail(error);
      }
      return parseRows(data, (row) => {
        const parsed = handoffRowSchema.safeParse(row);
        return parsed.success ? parsed.data : null;
      });
    },
  });
}

export function useSavingsSummary() {
  const userId = useUserId();
  return useQuery({
    queryKey: accountKeys.savings(userId),
    enabled: userId !== null,
    queryFn: async (): Promise<SavingsSummary> => {
      const { data, error } = await client()
        .from('savings_summary')
        .select(
          'handoff_count, saved_cents, membership_saved_cents, saved_this_month_cents, membership_saved_this_month_cents',
        )
        .maybeSingle();
      if (error) {
        fail(error);
      }
      const parsed = savingsSummarySchema.safeParse(data);
      return parsed.success ? parsed.data : emptySavingsSummary;
    },
  });
}

export function useClearHistory() {
  const userId = useUserId();
  return useMutation({
    mutationFn: async () => {
      if (userId === null) {
        return;
      }
      const { error } = await client().from('handoffs').delete().eq('user_id', userId);
      if (error) {
        fail(error);
      }
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: accountKeys.history(userId) }),
        queryClient.invalidateQueries({ queryKey: accountKeys.savings(userId) }),
      ]),
  });
}

export function rememberHandoff(handoff: NewHandoff, appName: string): void {
  if (useSession.getState().status !== 'signedIn') {
    return;
  }
  usePendingHandoff.getState().setPending({ handoff, appName, openedAt: new Date().toISOString() });
}

export function useConfirmHandoff() {
  const userId = useUserId();
  return useMutation({
    mutationFn: async (handoff: NewHandoff) => {
      const { error } = await client().from('handoffs').insert(handoff);
      if (error) {
        fail(error);
      }
    },
    onSuccess: () => {
      usePendingHandoff.getState().clearPending();
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: accountKeys.history(userId) }),
        queryClient.invalidateQueries({ queryKey: accountKeys.savings(userId) }),
      ]),
  });
}
