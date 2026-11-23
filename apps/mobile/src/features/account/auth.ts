import { isClerkAPIResponseError, isClerkRuntimeError } from '@clerk/expo';
import { z } from 'zod';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

export const emailSchema = z.email();
export const codeSchema = z.string().regex(/^\d{6,10}$/);

export type AuthResult = { ok: true } | { ok: false; message: string };

export const unavailableMessage = 'Accounts aren’t set up in this build.';

type AccountActions = {
  signOut: () => Promise<void>;
  deleteUser: () => Promise<void>;
};

let actions: AccountActions | null = null;

export function registerAccountActions(next: AccountActions | null): void {
  actions = next;
}

export function errorCode(error: unknown): string | null {
  if (isClerkAPIResponseError(error)) {
    return error.errors[0]?.code ?? null;
  }
  if (isClerkRuntimeError(error)) {
    return error.code;
  }
  return null;
}

export function authMessage(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    const first = error.errors[0];
    if (error.status === 429 || first?.code === 'too_many_requests') {
      return 'Too many codes requested. Wait a minute, then try again.';
    }
    if (
      first?.code === 'form_code_incorrect' ||
      first?.code === 'verification_expired' ||
      first?.code === 'verification_failed'
    ) {
      return 'That code didn’t work or has expired. Check the latest email, or send a new code.';
    }
    return first?.longMessage ?? first?.message ?? 'Something went wrong. Try again.';
  }
  if (isClerkRuntimeError(error) && error.code === 'network_error') {
    return 'Can’t reach the sign-in service. Check your connection.';
  }
  return 'Something went wrong. Try again.';
}

export async function signOut(): Promise<void> {
  if (!actions) {
    return;
  }
  await actions.signOut();
  queryClient.removeQueries({ queryKey: ['account'] });
}

export async function deleteAccount(): Promise<AuthResult> {
  if (!actions || !supabase) {
    return { ok: false, message: unavailableMessage };
  }
  const { error } = await supabase.rpc('delete_my_account');
  if (error) {
    return { ok: false, message: error.message };
  }
  try {
    await actions.deleteUser();
  } catch (deleteError) {
    await signOut();
    return { ok: false, message: authMessage(deleteError) };
  }
  queryClient.removeQueries({ queryKey: ['account'] });
  return { ok: true };
}
