'use client';

import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';
import { authErrorKey } from '@/app/helpers/auth_errors';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';
import { fetchAuthSession, signUp } from 'aws-amplify/auth';
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
      // the confirm page needs these to verify and resend codes
      sessionStorage.setItem('signupUsername', username.trim());
      sessionStorage.setItem('signupEmail', email.trim());
      router.push('/confirm');
    } catch (err) {
      console.error('Signup error:', err);
      setError(t(authErrorKey(err)));
      setBusy(false);
    }
  };

  return (
    <>
      <form
        className="flex flex-col gap-3 justify-center items-center w-full h-[89vh]"
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold">{t('auth.signupTitle')}</h1>
        <p className="text-gray-500">{t('auth.signupSub')}</p>
        {error && <p className="text-red-500 max-w-md text-center">{error}</p>}
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('auth.namePlaceholder')}
          className="border border-gray-300 rounded px-2 py-1"
        />
        <Input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.emailPlaceholder')}
          className="border border-gray-300 rounded px-2 py-1"
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.passwordPlaceholder')}
          className="border border-gray-300 rounded px-2 py-1"
        />
        <Input
          type="password"
          value={repeatPass}
          onChange={(e) => setRepeatPass(e.target.value)}
          placeholder={t('auth.repeatPlaceholder')}
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
