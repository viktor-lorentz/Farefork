import { useSignIn, useSignUp, useSSO } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, Screen, ScreenHeader, SearchField, Text } from '@/design/components';
import { EnvelopeIcon, WarningCircleIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import {
  authMessage,
  codeSchema,
  emailSchema,
  errorCode,
  unavailableMessage,
} from '@/features/account/auth';
import { haptics } from '@/lib/haptics';
import { useSession } from '@/stores/session';

const RESEND_SECONDS = 60;

function ErrorNote({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.error, { backgroundColor: colors.fill }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <WarningCircleIcon size={18} color={colors.textPrimary} weight="bold" />
      <Text variant="caption" style={styles.flex}>
        {message}
      </Text>
    </View>
  );
}

export default function SignInScreen() {
  const { colors } = useTheme();
  const status = useSession((state) => state.status);
  if (status === 'unavailable') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Sign in" large />
        <Screen padTop={false} contentStyle={styles.content}>
          <ErrorNote message={unavailableMessage} />
        </Screen>
      </View>
    );
  }
  return <ClerkSignIn />;
}

type Outcome = { ok: true } | { ok: false; message: string };

function ClerkSignIn() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setResendIn((value) => value - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [resendIn]);

  const trimmedEmail = email.trim().toLowerCase();
  const emailValid = emailSchema.safeParse(trimmedEmail).success;
  const trimmedCode = code.replace(/\s/g, '');
  const codeValid = codeSchema.safeParse(trimmedCode).success;

  const finish = () => {
    haptics.success();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const sendCode = async (): Promise<Outcome> => {
    const sent = await signIn.emailCode.sendCode({ emailAddress: trimmedEmail });
    if (!sent.error) {
      setMode('signIn');
      return { ok: true };
    }
    if (errorCode(sent.error) !== 'form_identifier_not_found') {
      return { ok: false, message: authMessage(sent.error) };
    }
    const created = await signUp.create({ emailAddress: trimmedEmail });
    if (created.error) {
      return { ok: false, message: authMessage(created.error) };
    }
    const mailed = await signUp.verifications.sendEmailCode();
    if (mailed.error) {
      return { ok: false, message: authMessage(mailed.error) };
    }
    setMode('signUp');
    return { ok: true };
  };

  const verifyCode = async (): Promise<Outcome> => {
    if (mode === 'signIn') {
      const verified = await signIn.emailCode.verifyCode({ code: trimmedCode });
      if (verified.error) {
        return { ok: false, message: authMessage(verified.error) };
      }
      if (signIn.status !== 'complete') {
        return { ok: false, message: 'This account needs another sign-in step. Try again.' };
      }
      const done = await signIn.finalize();
      return done.error ? { ok: false, message: authMessage(done.error) } : { ok: true };
    }
    const verified = await signUp.verifications.verifyEmailCode({ code: trimmedCode });
    if (verified.error) {
      return { ok: false, message: authMessage(verified.error) };
    }
    if (signUp.status !== 'complete') {
      return { ok: false, message: 'Something went wrong. Try again.' };
    }
    const done = await signUp.finalize();
    return done.error ? { ok: false, message: authMessage(done.error) } : { ok: true };
  };

  const continueWithGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: 'oauth_google' });
      setBusy(false);
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        finish();
      }
    } catch (ssoError) {
      setBusy(false);
      haptics.warning();
      setError(authMessage(ssoError));
    }
  };

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    const result = await sendCode();
    setBusy(false);
    if (!result.ok) {
      haptics.warning();
      setError(result.message);
      return;
    }
    setStep('code');
    setCode('');
    setResendIn(RESEND_SECONDS);
  };

  const submitCode = async () => {
    setBusy(true);
    setError(null);
    const result = await verifyCode();
    setBusy(false);
    if (!result.ok) {
      haptics.warning();
      setError(result.message);
      return;
    }
    finish();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Sign in" large />
      <Screen padTop={false} contentStyle={styles.content}>
        {step === 'email' ? (
          <>
            <Text variant="body" tone="secondary">
              Save routes and restaurants, keep a history of what you opened, and track what you
              saved. We’ll email you a code. No password needed.
            </Text>
            <SearchField
              icon={EnvelopeIcon}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError(null);
              }}
              placeholder="you@example.com"
              size="md"
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              inputMode="email"
              returnKeyType="send"
              accessibilityLabel="Email address"
              onSubmitEditing={() => {
                if (emailValid && !busy) {
                  void requestCode();
                }
              }}
            />
            {error !== null ? <ErrorNote message={error} /> : null}
            <Button
              label="Email me a code"
              fullWidth
              loading={busy}
              disabled={!emailValid}
              onPress={() => {
                void requestCode();
              }}
            />
            {Platform.OS !== 'web' ? (
              <Button
                label="Continue with Google"
                variant="secondary"
                fullWidth
                disabled={busy}
                onPress={() => {
                  void continueWithGoogle();
                }}
              />
            ) : null}
          </>
        ) : (
          <>
            <Text variant="body" tone="secondary">
              Enter the code we sent to <Text variant="bodyStrong">{trimmedEmail}</Text>. It can
              take a minute to arrive.
            </Text>
            <SearchField
              icon={EnvelopeIcon}
              value={code}
              onChangeText={(value) => {
                setCode(value.replace(/[^\d\s]/g, ''));
                setError(null);
              }}
              placeholder="Code from the email"
              size="md"
              autoFocus
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={12}
              returnKeyType="done"
              accessibilityLabel="Sign-in code"
              onSubmitEditing={() => {
                if (codeValid && !busy) {
                  void submitCode();
                }
              }}
            />
            {error !== null ? <ErrorNote message={error} /> : null}
            <Button
              label="Sign in"
              fullWidth
              loading={busy}
              disabled={!codeValid}
              onPress={() => {
                void submitCode();
              }}
            />
            <View style={styles.secondary}>
              <Button
                label={resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}
                variant="tertiary"
                size="md"
                disabled={resendIn > 0 || busy}
                onPress={() => {
                  void requestCode();
                }}
              />
              <Button
                label="Use a different email"
                variant="tertiary"
                size="md"
                disabled={busy}
                onPress={() => {
                  setStep('email');
                  setError(null);
                }}
              />
            </View>
          </>
        )}
        <View nativeID="clerk-captcha" />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: space.md },
  flex: { flex: 1 },
  secondary: { alignItems: 'center', gap: space.xxs },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    padding: space.sm,
    borderRadius: radius.md,
  },
});
