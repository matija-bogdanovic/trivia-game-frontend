'use client';

import { fetchAuthSession } from 'aws-amplify/auth';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const session = await fetchAuthSession();
        console.log(session);
        const idToken = session.tokens?.accessToken.payload;
        console.log(idToken);
        setDecodedToken(idToken);
      } catch (error) {
        console.log(error);
        setDecodedToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  useEffect(() => {
    if (loading) return;
    const publicRoutes = ['/login', '/signup', '/confirm', '/reset-password'];
    if (!decodedToken && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [decodedToken, loading, pathname, router]);

  return (
    <header className="section fixed top-0 left-0 right-0">
      <div className="container flex flex-row justify-between items-center py-8">
        <Link href="/">
          <Image src="/rrl.png" width={40} height={40} alt="rrl" />
        </Link>

        {!loading && decodedToken ? (
          <div className="flex flex-row gap-4 items-center">
            <span className="text-sm text-gray-700"></span>
            <Link href="/profile">Profile</Link>
            <Link href="/playgame">Play Game</Link>
            <Link href="/joingame">Join Game</Link>
          </div>
        ) : (
          <div className="flex flex-row gap-4">
            <Link href="/login">Login</Link>
            <Link href="/signup">Signup</Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
