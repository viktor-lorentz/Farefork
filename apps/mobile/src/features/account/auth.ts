import { AuthError } from '@supabase/supabase-js';
import { z } from 'zod';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';

export const emailSchema = z.email();
export const codeSchema = z.string().regex(/^\d{6,10}$/);

export type AuthResult = { ok: true } | { ok: false; message: string };

function message(error: unknown): string {
  if (error instanceof AuthError) {
    if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
      return 'Too many codes requested. Wait a minute, then try again.';
    }
    if (error.code === 'otp_expired' || error.code === 'invalid_credentials') {
      return 'That code didn’t work or has expired. Check the latest email, or send a new code.';
    }
    if (error.status === 0 || error.name === 'AuthRetryableFetchError') {
      return 'Can’t reach the sign-in service. Check your connection.';
    }
    return error.message;
  }
  return 'Something went wrong. Try again.';
}

export async function sendCode(email: string): Promise<AuthResult> {
  if (!supabase) {
    return { ok: false, message: 'Accounts aren’t set up in this build.' };
  }
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return error ? { ok: false, message: message(error) } : { ok: true };
  } catch (error) {
    return { ok: false, message: message(error) };
  }
}

export async function verifyCode(email: string, token: string): Promise<AuthResult> {
  if (!supabase) {
    return { ok: false, message: 'Accounts aren’t set up in this build.' };
  }
  try {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    return error ? { ok: false, message: message(error) } : { ok: true };
  } catch (error) {
    return { ok: false, message: message(error) };
  }
}

export async function signOut(): Promise<void> {
  if (!supabase) {
    return;
  }
  await supabase.auth.signOut();
  queryClient.removeQueries({ queryKey: ['account'] });
}

export async function deleteAccount(): Promise<AuthResult> {
  if (!supabase) {
    return { ok: false, message: 'Accounts aren’t set up in this build.' };
  }
  const { error } = await supabase.rpc('delete_my_account');
  if (error) {
    return { ok: false, message: error.message };
  }
  await signOut();
  return { ok: true };
}
