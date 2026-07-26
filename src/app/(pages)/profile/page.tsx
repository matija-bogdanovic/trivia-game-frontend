'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { decodeJwt, getCookie } from '@/app/helpers/token_operations';
import React, { useEffect, useState } from 'react';
import { amplifyConfigure } from '@/app/lib/amplify_configure';

amplifyConfigure();
function Page() {
  const [decodedToken, setDecodedToken] = useState<any>(null);
  useEffect(() => {
    const rawToken = getCookie('token');
    if (rawToken) {
      setDecodedToken(decodeJwt(rawToken));
    }
  }, []);

  return (
    <section className="section">
      <div className="container">
        <h5>Achievements</h5>
        <h1 className="text-[32px] font-bold">
          {decodedToken ? `${decodedToken.username}` : ''}
        </h1>
      </div>
    </section>
  );
}

export default Page;
