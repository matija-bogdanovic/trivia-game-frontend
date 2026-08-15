'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hub } from 'aws-amplify/utils';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useT } from '@/app/lib/i18n';

/**
 * Completes the hosted-UI round trip.
 *
 * Cognito sends the browser back to the app root carrying `?code=…`, and
 * Amplify exchanges that code for tokens on its own — but only if the page
 * that receives it actually runs Amplify in the browser. The root used to be a
 * server component that redirected to /home unconditionally, which threw the
 * query string away before any client code saw it: the sign-in silently never
 * completed and Google users landed back on the login screen. So the root only
 * redirects when there is no code to lose, and hands the callback here.
 *
 * Amplify announces the outcome on the Hub, but the exchange can also finish
 * before this effect subscribes, so the session is polled once as well —
 * whichever resolves first wins.
 */
export default function OAuthReturn({ failed }: { failed: boolean }) {
  const router = useRouter();
  const { t } = useT();
  const [error, setError] = useState(failed);

  useEffect(() => {
    if (failed) return;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      // replace, so the code never sits in history
      router.replace('/home');
    };

    const stop = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect') finish();
      if (payload.event === 'signInWithRedirect_failure') {
        if (!done) {
          done = true;
          setError(true);
        }
      }
    });

    fetchAuthSession()
      .then((session) => {
        if (session.tokens?.idToken) finish();
      })
      .catch(() => {
        /* the Hub listener is still the primary path */
      });

    /*
     * If neither fires, the exchange is wedged — an unlisted redirect URI, a
     * reused code. Sending them to /login is recoverable; a spinner forever
     * is not.
     */
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        setError(true);
      }
    }, 8000);

    return () => {
      stop();
      clearTimeout(timer);
    };
  }, [failed, router]);

  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-6 bg-arena-900 px-6 text-center">
      {error ? (
        <>
          <p className="text-sm text-arena-200">
            {t('arena.auth.oauthFailed')}
          </p>
          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="cursor-pointer border border-white/20 px-6 py-3 text-[11px] font-bold tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('arena.auth.backToLogin')}
          </button>
        </>
      ) : (
        <p
          className="text-[11px] tracking-[0.25em] text-arena-200 uppercase"
          aria-live="polite"
        >
          {t('arena.auth.signingIn')}
        </p>
      )}
    </main>
  );
}
