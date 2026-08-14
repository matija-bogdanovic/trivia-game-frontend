'use client';

import { fetchAuthSession, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { useT } from '@/app/lib/i18n';

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { lang, setLang, t } = useT();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkUserSession = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      setDecodedToken(session.tokens?.accessToken.payload ?? null);
    } catch {
      setDecodedToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // re-check on every navigation AND on auth events (manual sign-in,
  // Google redirect completion, sign-out) so the header is never stale
  useEffect(() => {
    checkUserSession();
  }, [checkUserSession, pathname]);

  useEffect(() => {
    const unsubscribe = Hub.listen('auth', () => {
      checkUserSession();
    });
    return unsubscribe;
  }, [checkUserSession]);

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
              <Link href="/legacy/profile">{t('nav.profile')}</Link>
              <Link href="/playgame">{t('nav.play')}</Link>
              <Link href="/joingame">{t('nav.join')}</Link>
              <Link href="/shop">{t('nav.shop')}</Link>
              <Link href="/legacy/friends">{t('nav.friends')}</Link>
              <button
                className="text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
                onClick={async () => {
                  try {
                    await signOut();
                  } finally {
                    setDecodedToken(null);
                    router.push('/login');
                  }
                }}
              >
                {t('nav.signout')}
              </button>
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
