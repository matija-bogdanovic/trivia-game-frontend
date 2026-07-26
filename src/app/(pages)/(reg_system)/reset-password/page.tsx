'use client';

import Button from '@/app/components/general/button';
import Input from '@/app/components/general/input';
import { amplifyConfigure } from '@/app/lib/amplify_configure';
import React, { useState } from 'react';

amplifyConfigure();
function Page() {
  const [email, setEmail] = useState('');
  return (
    <section className="section">
      <div className="container flex flex-col gap-4 justify-center items-center h-[89vh]">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-gray-500">Enter your email to reset your password</p>
        <form className="flex flex-col gap-4 ">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={'border border-gray-300 rounded px-2 py-1'}
          />
          <Button text="Reset Password" onClick={() => {}} />
        </form>
      </div>
    </section>
  );
}

export default Page;
