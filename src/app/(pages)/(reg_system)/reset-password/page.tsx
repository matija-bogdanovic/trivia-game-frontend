'use client';

import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { useT } from '@/app/lib/i18n';
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth';
import Link from 'next/link';
import React, { FormEvent, useState } from 'react';

amplifyConfigure();

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
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
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
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section">
      <div className="container flex flex-col gap-4 justify-center items-center h-[89vh]">
        <h1 className="text-2xl font-bold">{t('reset.title')}</h1>
        {error && <p className="text-red-500 max-w-md text-center">{error}</p>}

        {step === 'request' && (
          <>
            <p className="text-gray-500">{t('reset.sub')}</p>
            <form className="flex flex-col gap-4" onSubmit={requestCode}>
              <Input
                type="text"
                placeholder={t('auth.username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={'border border-gray-300 rounded px-2 py-1'}
              />
              <Button
                text={busy ? '…' : t('reset.button')}
                type="submit"
                disabled={busy}
              />
            </form>
          </>
        )}

        {step === 'confirm' && (
          <>
            <p className="text-gray-500 max-w-md text-center">
              {t('reset.codeSent')}
            </p>
            <form className="flex flex-col gap-4" onSubmit={confirm}>
              <Input
                type="text"
                placeholder={t('reset.code')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={'border border-gray-300 rounded px-2 py-1'}
              />
              <Input
                type="password"
                placeholder={t('reset.newPassword')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={'border border-gray-300 rounded px-2 py-1'}
              />
              <Button
                text={busy ? '…' : t('reset.confirm')}
                type="submit"
                disabled={busy}
              />
            </form>
          </>
        )}

        {step === 'done' && (
          <>
            <p className="text-green-600">{t('reset.done')}</p>
            <Link href="/login" className="underline">
              {t('reset.toLogin')}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export default Page;
