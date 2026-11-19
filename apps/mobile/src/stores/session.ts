import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

export type SessionStatus = 'loading' | 'signedIn' | 'signedOut' | 'unavailable';

type SessionState = {
  status: SessionStatus;
  session: Session | null;
};

export const useSession = create<SessionState>(() => ({
  status: supabase ? 'loading' : 'unavailable',
  session: null,
}));

function apply(session: Session | null) {
  const previous = useSession.getState().session?.user.id ?? null;
  const next = session?.user.id ?? null;
  if (previous !== null && previous !== next) {
    queryClient.removeQueries({ queryKey: ['account'] });
  }
  useSession.setState({ session, status: session ? 'signedIn' : 'signedOut' });
}

export function startSessionSync(): () => void {
  if (!supabase) {
    return () => undefined;
  }
  let active = true;
  void supabase.auth.getSession().then(({ data }) => {
    if (active) {
      apply(data.session);
    }
  });
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    apply(session);
  });
  return () => {
    active = false;
    data.subscription.unsubscribe();
  };
}

export function useUserId(): string | null {
  return useSession((state) => state.session?.user.id ?? null);
}
