'use client';

import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';
import IndexHooks from '@/app/components/hooks/index_hooks';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import Link from 'next/link';

amplifyConfigure();
export default function SignUp() {
  const {
    username,
    setUsername,
    error,
    buttonElement,
    handleClick,
    activeUsers,
    password,
    setPassword,
    email,
    setEmail,
    repeatPass,
    setRepeatPass,
  } = IndexHooks();

  return (
    <>
      <form
        className="flex flex-col gap-3 justify-center items-center w-full h-[89vh]"
        onSubmit={handleClick}
      >
        <h1 className="text-2xl font-bold">Sign up</h1>
        <p className="text-gray-500">Create an account to get started</p>
        {error === '' ? <></> : <p className="text-red-400">{error}</p>}
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Give yourself a name"
          className="border border-gray-300 rounded px-2 py-1"
        />
        <Input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="border border-gray-300 rounded px-2 py-1"
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="border border-gray-300 rounded px-2 py-1"
        />
        <Input
          type="password"
          value={repeatPass}
          onChange={(e) => setRepeatPass(e.target.value)}
          placeholder="Repeat your password"
          className="border border-gray-300 rounded px-2 py-1"
        />
        <div className="flex justify-center items-center flex-col gap-2">
          {activeUsers === '' ? <></> : <p>{activeUsers}</p>}
        </div>
        <div className="flex flex-col items-center">
          <p>
            Already have an account?{' '}
            <Link className="underline" href="/login">
              Log in&#x2e;
            </Link>
          </p>
          <p>
            Can&apos;t remember your password?{' '}
            <Link className="underline" href="/reset-password">
              Reset password.
            </Link>
          </p>
        </div>
        <Button ref={buttonElement} text="Register!" />
      </form>
      <div className="flex flex-col gap-2 justify-center items-center">
        <span className="text-xs">
          ©Slagalica by Matija Bogdanovic&#x2e; All rights reserved&#x2e;
        </span>
        <span className="text-xs">
          If it&apos;s your first time playing the game make sure to check out
          the{' '}
          <Link
            href="/documentation"
            className="underline text-blue-600 hover:text-blue-800"
          >
            documentation&#x2e;
          </Link>
          &#x2e;
        </span>
      </div>
    </>
  );
}
