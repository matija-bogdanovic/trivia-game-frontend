/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { amplifyConfigure } from '@/app/lib/amplify_configure';
import { fetchAuthSession } from 'aws-amplify/auth';
import React, { useEffect, useState } from 'react';

amplifyConfigure();
function Page() {
  const [decodedToken, setDecodedToken] = useState<any>(null);

  useEffect(() => {
    async function decodingToken() {
      const session = await fetchAuthSession();
      setDecodedToken(session.tokens?.idToken?.payload);
    }
    decodingToken();
  }, []);

  return (
    <section className="section">
      <div className="container">
        <p>
          {decodedToken
            ? `Hello ${
                decodedToken['name'] ||
                decodedToken['cognito:username'] ||
                decodedToken['email']
              }!`
            : 'No token found.'}
        </p>
      </div>
    </section>
  );
}

export default Page;
