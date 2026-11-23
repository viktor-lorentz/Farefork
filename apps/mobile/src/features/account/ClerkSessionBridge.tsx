import { useAuth, useUser } from '@clerk/expo';
import { useEffect } from 'react';
import { registerAccountActions } from '@/features/account/auth';
import { setSupabaseTokenGetter } from '@/lib/supabase';
import { applySession } from '@/stores/session';

export function ClerkSessionBridge() {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  useEffect(() => {
    setSupabaseTokenGetter(() => getToken());
    return () => {
      setSupabaseTokenGetter(null);
    };
  }, [getToken]);

  useEffect(() => {
    registerAccountActions({
      signOut: () => signOut(),
      deleteUser: async () => {
        if (user) {
          await user.delete();
        }
      },
    });
    return () => {
      registerAccountActions(null);
    };
  }, [signOut, user]);

  useEffect(() => {
    if (isLoaded) {
      applySession(isSignedIn ? userId : null, isSignedIn ? email : null);
    }
  }, [isLoaded, isSignedIn, userId, email]);

  return null;
}
