'use client';

import { fetchAuthSession } from 'aws-amplify/auth';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useT } from '@/app/lib/i18n';

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { lang, setLang, t } = useT();
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

        <div className="flex flex-row gap-4 items-center">
          {!loading && decodedToken ? (
            <>
              <Link href="/profile">{t('nav.profile')}</Link>
              <Link href="/playgame">{t('nav.play')}</Link>
              <Link href="/joingame">{t('nav.join')}</Link>
              <Link href="/shop">{t('nav.shop')}</Link>
            </>
          ) : (
            <>
              <Link href="/login">{t('nav.login')}</Link>
              <Link href="/signup">{t('nav.signup')}</Link>
            </>
          )}
          <button
            className="border border-gray-300 rounded px-2 py-1 text-sm cursor-pointer"
            onClick={() => setLang(lang === 'en' ? 'sr' : 'en')}
            aria-label="Switch language"
          >
            {lang === 'en' ? 'SR' : 'EN'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
