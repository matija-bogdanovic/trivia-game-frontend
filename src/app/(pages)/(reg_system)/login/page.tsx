'use client';

import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';
import { authErrorKey } from '@/app/helpers/auth_errors';
import {
  amplifyConfigure,
  googleAuthEnabled,
} from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';
import {
  fetchAuthSession,
  signIn,
  signInWithRedirect,
} from 'aws-amplify/auth';
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
    <section className="section">
      <div className="container">
        <form
          className="w-full h-[89vh] flex flex-col justify-center items-center gap-4"
          onSubmit={logIn}
        >
          <h1 className="text-2xl font-bold">{t('auth.login')}</h1>
          <p className="text-gray-500">{t('auth.loginSub')}</p>
          {error && (
            <p className="text-red-500 max-w-md text-center">{error}</p>
          )}
          <Input
            type={'text'}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('auth.username')}
            className={'border border-gray-300 rounded px-2 py-1'}
          />
          <Input
            type={'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.password')}
            className={'border border-gray-300 rounded px-2 py-1'}
          />
          <div className="flex flex-col items-center">
            <p>
              {t('auth.noAccount')}{' '}
              <Link className="underline" href="/signup">
                {t('auth.signupLink')}
              </Link>
            </p>
            <p>
              {t('auth.forgot')}{' '}
              <Link className="underline" href="/reset-password">
                {t('auth.resetLink')}
              </Link>
            </p>
          </div>
          <Button
            text={busy ? t('auth.signingIn') : t('auth.login')}
            type={'submit'}
            disabled={busy}
          />
          {googleAuthEnabled && (
            <button
              type="button"
              className="border border-gray-300 rounded px-4 py-2 flex items-center gap-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => signInWithRedirect({ provider: 'Google' })}
            >
              <span className="font-bold text-blue-600">G</span>
              {t('auth.google')}
            </button>
          )}
        </form>
      </div>
    </section>
  );
}

export default Page;
