'use client';

import TextField from '@/app/(arena)/_components/text_field';
import { authErrorKey } from '@/app/helpers/auth_errors';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth';
import Link from 'next/link';
import React, { FormEvent, useState } from 'react';

amplifyConfigure();

// same policy the pool enforces, checked here so the user finds out before
// the round trip instead of via a raw Cognito error
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

type Step = 'request' | 'confirm' | 'done';

function Page() {
  const { t } = useT();
  const [step, setStep] = useState<Step>('request');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const requestCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setBusy(true);
    setError('');
    try {
      await resetPassword({ username: username.trim() });
      setStep('confirm');
    } catch (err) {
      console.error('Reset request failed:', err);
      setError(t(authErrorKey(err)));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!PASSWORD_RE.test(newPassword)) {
      setError(t('authError.passwordWeak'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await confirmResetPassword({
        username: username.trim(),
        confirmationCode: code.trim(),
        newPassword,
      });
      setStep('done');
    } catch (err) {
      console.error('Reset confirm failed:', err);
      setError(t(authErrorKey(err)));
    } finally {
      setBusy(false);
    }
  };

  const submitClasses = (disabled: boolean) =>
    `w-full py-4 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-800 focus-visible:outline-none ${
      disabled
        ? 'cursor-not-allowed bg-arena-700 text-arena-400'
        : 'cursor-pointer bg-gold text-arena-950 hover:bg-gold-light'
    }`;

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-wide">
        {t('reset.title')}
      </h1>
      <p className="mb-6 text-[11px] tracking-wider text-arena-200">
        {step === 'confirm' ? t('reset.codeSent') : t('reset.sub')}
      </p>

      {error && (
        <p
          className="mb-5 rounded-sm border border-gold/30 bg-gold/10 px-4 py-3 text-[12px] leading-relaxed text-gold"
          role="alert"
        >
          {error}
        </p>
      )}

      {step === 'request' && (
        <form className="space-y-4" onSubmit={requestCode}>
          <TextField
            fieldId="reset-username"
            label={t('auth.username')}
            autoComplete="username"
            value={username}
            disabled={busy}
            onValueChange={setUsername}
          />
          <button type="submit" disabled={busy} className={submitClasses(busy)}>
            {busy ? '…' : t('reset.button')}
          </button>
        </form>
      )}

      {step === 'confirm' && (
        <form className="space-y-4" onSubmit={confirm}>
          <TextField
            fieldId="reset-code"
            label={t('reset.code')}
            autoComplete="one-time-code"
            value={code}
            disabled={busy}
            onValueChange={setCode}
          />
          <TextField
            fieldId="reset-new-password"
            label={t('reset.newPassword')}
            type="password"
            autoComplete="new-password"
            hint={t('auth.passwordHint')}
            value={newPassword}
            disabled={busy}
            onValueChange={setNewPassword}
          />
          <button type="submit" disabled={busy} className={submitClasses(busy)}>
            {busy ? '…' : t('reset.confirm')}
          </button>
        </form>
      )}

      {step === 'done' && (
        <>
          <p className="mb-6 rounded-sm border border-arena-400 bg-arena-750 px-4 py-3 text-[12px] text-arena-100">
            {t('reset.done')}
          </p>
          <Link
            href="/login"
            className="block w-full bg-gold py-4 text-center text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('reset.toLogin')}
          </Link>
        </>
      )}

      {step !== 'done' && (
        <p className="mt-6 text-center text-[11px] text-arena-200">
          <Link
            href="/login"
            className="text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('reset.toLogin')}
          </Link>
        </p>
      )}
    </>
  );
}

export default Page;
