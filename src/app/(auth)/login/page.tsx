'use client';

import TextField from '@/app/(arena)/_components/text_field';
import GoogleButton from '@/app/(arena)/_components/google_button';
import { authErrorKey } from '@/app/helpers/auth_errors';
import {
  amplifyConfigure,
  googleAuthEnabled,
} from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';
import { fetchAuthSession, signIn, signInWithRedirect } from 'aws-amplify/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { FormEvent, useEffect, useState } from 'react';

amplifyConfigure();

function Page() {
  const { t } = useT();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // already signed in? straight to the game
  useEffect(() => {
    fetchAuthSession()
      .then((session) => {
        if (session.tokens) router.replace('/');
      })
      .catch(() => {});
  }, [router]);

  async function logIn(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError('');
    setBusy(true);
    try {
      const result = await signIn({ username: username.trim(), password });
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        // account exists but was never verified — finish that first
        sessionStorage.setItem('signupUsername', username.trim());
        router.push('/confirm');
        return;
      }
      router.push('/');
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === 'UserAlreadyAuthenticatedException') {
        router.push('/');
        return;
      }
      if (name === 'UserNotConfirmedException') {
        sessionStorage.setItem('signupUsername', username.trim());
        router.push('/confirm');
        return;
      }
      console.error('Login error:', err);
      setError(t(authErrorKey(err)));
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-wide">
        {t('auth.login')}
      </h1>
      <p className="mb-6 text-[11px] tracking-wider text-arena-200">
        {t('auth.loginSub')}
      </p>

      {error && (
        <p
          className="mb-5 border border-gold/30 bg-gold/10 px-4 py-3 text-[12px] leading-relaxed text-gold"
          role="alert"
        >
          {error}
        </p>
      )}

      <form className="space-y-4" onSubmit={logIn}>
        <TextField
          fieldId="login-username"
          label={t('auth.username')}
          placeholder={t('auth.namePlaceholder')}
          autoComplete="username"
          value={username}
          disabled={busy}
          onValueChange={setUsername}
        />

        <TextField
          fieldId="login-password"
          label={t('auth.password')}
          placeholder={t('auth.passwordPlaceholder')}
          type="password"
          autoComplete="current-password"
          value={password}
          disabled={busy}
          onValueChange={setPassword}
        />

        <button
          type="submit"
          disabled={busy}
          className={`w-full py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-800 focus-visible:outline-none ${
            busy
              ? 'cursor-not-allowed bg-arena-700 text-arena-400'
              : 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
          }`}
        >
          {busy ? t('auth.signingIn') : t('auth.login')}
        </button>
      </form>

      {googleAuthEnabled && (
        <GoogleButton
          label={t('auth.google')}
          disabled={busy}
          onPress={() => signInWithRedirect({ provider: 'Google' })}
        />
      )}

      <p className="mt-6 text-center text-[11px] text-arena-200">
        {t('auth.noAccount')}{' '}
        <Link
          href="/signup"
          className="text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          {t('auth.signupLink')}
        </Link>
      </p>
      <p className="mt-2 text-center text-[11px] text-arena-200">
        {t('auth.forgot')}{' '}
        <Link
          href="/reset-password"
          className="text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          {t('auth.resetLink')}
        </Link>
      </p>
    </>
  );
}

export default Page;
