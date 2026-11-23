import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

export function setSupabaseTokenGetter(getter: TokenGetter | null): void {
  tokenGetter = getter;
}

function create(): SupabaseClient | null {
  if (!url || !anonKey) {
    return null;
  }
  return createClient(url, anonKey, {
    accessToken: async () => (tokenGetter ? await tokenGetter() : null),
  });
}

export const supabase = create();
