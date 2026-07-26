'use client';

import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';
import { getCookie } from '@/app/helpers/token_operations';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { fetchAuthSession, signIn } from 'aws-amplify/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { FormEvent, useEffect, useState } from 'react';

amplifyConfigure();
function Page() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function logIn(e: FormEvent) {
    e.preventDefault();
    try {
      await signIn({
        username,
        password,
      });
      router.push('/');
    } catch (error) {
      setError(String(error));
      console.log('Something went wrong', error);
    }
  }
  useEffect(() => {
    const token = getCookie('token');
    async function somethingELse() {
      const session = await fetchAuthSession();
      const idToken = session;

      console.log(idToken);
    }
    somethingELse();

    if (token) {
      router.push('/');
      alert("You're already signed in.");
      return;
    } else {
      return;
    }
  }, [router]);
  return (
    <section className="section">
      <div className="container">
        <form
          className="w-full h-[89vh] flex flex-col justify-center items-center gap-4"
          onSubmit={logIn}
        >
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-gray-500">Login to your account to get started</p>
          {error === '' ? <></> : <p className="text-red-500">{error}</p>}
          <Input
            type={'text'}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={'Username'}
            className={'border border-gray-300 rounded px-2 py-1'}
          />
          <Input
            type={'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={'Password'}
            className={'border border-gray-300 rounded px-2 py-1'}
          />
          <div className="flex flex-col items-center">
            <p>
              Don&apos;t have an account?{' '}
              <Link className="underline" href="/signup">
                Sign up.
              </Link>
            </p>
            <p>
              Can&apos;t remember your password?{' '}
              <Link className="underline" href="/reset-password">
                Reset password.
              </Link>
            </p>
          </div>
          <Button text={'Login'} type={'submit'} />
        </form>
      </div>
    </section>
  );
}

export default Page;
