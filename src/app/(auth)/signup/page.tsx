'use client';

import TextField from '@/app/(arena)/_components/text_field';
import GoogleButton from '@/app/(arena)/_components/google_button';
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
      <h1 className="mb-1 text-2xl font-bold tracking-wide">
        {t('auth.signupTitle')}
      </h1>
      <p className="mb-6 text-[11px] tracking-wider text-arena-200">
        {t('auth.signupSub')}
      </p>

      {error && (
        <p
          className="mb-5 border border-gold/30 bg-gold/10 px-4 py-3 text-[12px] leading-relaxed text-gold"
          role="alert"
        >
          {error}
        </p>
      )}

      {offerConfirm && (
        <button
          type="button"
          className="mb-5 w-full cursor-pointer border border-gold/40 px-4 py-3 text-[11px] tracking-wider text-gold transition-colors hover:bg-gold/10 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          onClick={goConfirmExisting}
        >
          {t('auth.confirmInstead')}
        </button>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          fieldId="signup-username"
          label={t('auth.username')}
          placeholder={t('auth.namePlaceholder')}
          autoComplete="username"
          value={username}
          disabled={busy}
          onValueChange={setUsername}
        />

        <TextField
          fieldId="signup-email"
          label={t('auth.email')}
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          autoComplete="email"
          value={email}
          disabled={busy}
          onValueChange={setEmail}
        />

        <TextField
          fieldId="signup-password"
          label={t('auth.password')}
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          autoComplete="new-password"
          hint={t('auth.passwordHint')}
          value={password}
          disabled={busy}
          onValueChange={setPassword}
        />

        <TextField
          fieldId="signup-repeat"
          label={t('auth.repeatPassword')}
          type="password"
          placeholder={t('auth.repeatPlaceholder')}
          autoComplete="new-password"
          value={repeatPass}
          disabled={busy}
          onValueChange={setRepeatPass}
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
          {busy ? t('auth.registering') : t('auth.register')}
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
        {t('auth.haveAccount')}{' '}
        <Link
          href="/login"
          className="text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          {t('auth.loginLink')}
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

