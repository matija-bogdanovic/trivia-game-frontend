'use client';

import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';
import { authErrorKey } from '@/app/helpers/auth_errors';
import {
  amplifyConfigure,
  googleAuthEnabled,
} from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';
import { fetchAuthSession, signInWithRedirect, signUp } from 'aws-amplify/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { FormEvent, useEffect, useState } from 'react';

amplifyConfigure();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// mirrors the Cognito password policy: 8+ chars, upper, lower, digit, special
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function SignUp() {
  const { t } = useT();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPass, setRepeatPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // shown when the username is taken but might be an unconfirmed account
  const [offerConfirm, setOfferConfirm] = useState(false);

  // already signed in? no need to register
  useEffect(() => {
    fetchAuthSession()
      .then((session) => {
        if (session.tokens) router.replace('/');
      })
      .catch(() => {});
  }, [router]);

  const validationError = (): string | null => {
    const name = username.trim();
    if (name.length < 3) return 'authError.nameShort';
    if (/\s/.test(name)) return 'authError.nameWhitespace';
    if (/[<>#!]/.test(name)) return 'authError.nameSpecial';
    if (!EMAIL_RE.test(email.trim())) return 'authError.emailInvalid';
    if (!PASSWORD_RE.test(password)) return 'authError.passwordWeak';
    if (password !== repeatPass) return 'authError.passwordMismatch';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const invalid = validationError();
    if (invalid) {
      setError(t(invalid));
      return;
    }
    setError('');
    setOfferConfirm(false);
    setBusy(true);
    try {
      await signUp({
        username: username.trim(),
        password,
        options: {
          userAttributes: {
            email: email.trim(),
            name: username.trim(),
          },
          autoSignIn: true,
        },
      });
      // the confirm page needs these to verify and resend codes; the query
      // param is the fallback when the link is opened in another tab
      sessionStorage.setItem('signupUsername', username.trim());
      sessionStorage.setItem('signupEmail', email.trim());
      router.push(`/confirm?u=${encodeURIComponent(username.trim())}`);
    } catch (err) {
      console.error('Signup error:', err);
      const key = authErrorKey(err);
      setError(t(key));
      setOfferConfirm(key === 'authError.usernameTaken');
      setBusy(false);
    }
  };

  const goConfirmExisting = () => {
    sessionStorage.setItem('signupUsername', username.trim());
    router.push(`/confirm?u=${encodeURIComponent(username.trim())}`);
  };

  return (
    <>
      <button
        onClick={async () => {
          await fetch(
            'https://7pqkxtdnod.execute-api.eu-west-3.amazonaws.com/deployedStage/getData',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: 915185,
                username: 'Matija',
                email: 'matijabogdanovic4@gmail.com',
                password: 'Matija123!',
              }),
            }
          ).then(async (response) => {
            if (response.ok) {
              const data = await response.json();

              console.log('Full data:', data);
              console.log('Code:', data[0].code);
            }
          });
        }}
      >
        Press me!
      </button>
      <form
        className="flex flex-col gap-3 justify-center items-center w-full h-[89vh]"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold">{t('auth.signupTitle')}</h1>
        <p className="text-gray-500">{t('auth.signupSub')}</p>
        {error && <p className="text-red-500 max-w-md text-center">{error}</p>}
        {offerConfirm && (
          <button
            type="button"
            className="underline text-blue-600 cursor-pointer"
            onClick={goConfirmExisting}
          >
            {t('auth.confirmInstead')}
          </button>
        )}
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('auth.namePlaceholder')}
          autoComplete="username"
          className="border border-gray-300 rounded px-2 py-1"
        />
        <Input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.emailPlaceholder')}
          autoComplete="email"
          className="border border-gray-300 rounded px-2 py-1"
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.passwordPlaceholder')}
          autoComplete="new-password"
          className="border border-gray-300 rounded px-2 py-1"
        />
        <p className="text-xs text-gray-500 max-w-xs text-center">
          {t('auth.passwordHint')}
        </p>
        <Input
          type="password"
          value={repeatPass}
          onChange={(e) => setRepeatPass(e.target.value)}
          placeholder={t('auth.repeatPlaceholder')}
          autoComplete="new-password"
          className="border border-gray-300 rounded px-2 py-1"
        />
        <div className="flex flex-col items-center">
          <p>
            {t('auth.haveAccount')}{' '}
            <Link className="underline" href="/login">
              {t('auth.loginLink')}
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
          text={busy ? t('auth.registering') : t('auth.register')}
          type="submit"
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
      <div className="flex flex-col gap-2 justify-center items-center pb-6">
        <span className="text-xs">{t('footer.rights')}</span>
        <span className="text-xs">
          {t('footer.docs')}{' '}
          <Link
            href="/documentation"
            className="underline text-blue-600 hover:text-blue-800"
          >
            {t('footer.docsLink')}
          </Link>
        </span>
      </div>
    </>
  );
}
