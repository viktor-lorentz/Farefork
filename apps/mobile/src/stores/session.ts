import { create } from 'zustand';
import { queryClient } from '@/lib/queryClient';

export type SessionStatus = 'loading' | 'signedIn' | 'signedOut' | 'unavailable';

type SessionState = {
  status: SessionStatus;
  userId: string | null;
  email: string | null;
};

export const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export const useSession = create<SessionState>(() => ({
  status: clerkPublishableKey ? 'loading' : 'unavailable',
  userId: null,
  email: null,
}));

export function applySession(userId: string | null, email: string | null): void {
  const previous = useSession.getState().userId;
  if (previous !== null && previous !== userId) {
    queryClient.removeQueries({ queryKey: ['account'] });
  }
  useSession.setState({ userId, email, status: userId ? 'signedIn' : 'signedOut' });
}

export function useUserId(): string | null {
  return useSession((state) => state.userId);
}
