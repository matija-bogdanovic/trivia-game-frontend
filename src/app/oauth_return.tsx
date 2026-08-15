'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useT } from '@/app/lib/i18n';
import { waitForSession } from '@/app/lib/wait_for_session';

/**
 * Completes the hosted-UI round trip.
 *
 * Cognito sends the browser back to the app root carrying `?code=…`, and
 * Amplify exchanges that code for tokens on its own — but only if the page
 * that receives it actually runs Amplify in the browser. The root used to be a
 * server component that redirected to /home unconditionally, which threw the
 * query string away before any client code saw it. So the root only redirects
 * when there is no code to lose, and hands the callback here.
 *
 * ONE THING DECIDES THE OUTCOME: whether a session exists. Not whether an
 * event arrived, not whether one arrived in time.
 *
 * This screen used to infer failure from silence. It listened on the Hub for
 * signInWithRedirect, probed fetchAuthSession once at mount, and showed the
 * error screen if neither had answered within eight seconds. All three are
 * unreliable in the same direction — they miss a success that did happen:
 *
 *   - Amplify starts the exchange inside Amplify.configure(), which runs at
 *     module scope in Providers. That is before React renders, so the success
 *     event can be dispatched before this component mounts to hear it. Hub
 *     does not replay, so the event is then gone for good.
 *   - The single fetchAuthSession() ran concurrently with the in-flight
 *     exchange, so it usually saw no tokens, and never looked again.
 *   - signInWithRedirect_failure was treated as fatal without checking for a
 *     session, so a benign duplicate exchange — a code already spent by a
 *     first attempt that succeeded — could condemn a working session.
 *
 * With all three missing, the timer fired and announced failure over a
 * perfectly good sign-in. The window is widest exactly where it was reported:
 * on the tunnel, where slower chunk loading puts more time between configure()
 * and hydration.
 *
 * Polling the session removes the race instead of narrowing it, so the Hub
 * listener is gone rather than fixed.
 */
export default function OAuthReturn({ failed }: { failed: boolean }) {
  const router = useRouter();
  const { t } = useT();
  const [error, setError] = useState(failed);

  useEffect(() => {
    // Cognito said no before the exchange ever started; nothing to wait for
    if (failed) return;

    const control = { cancelled: false };

    const hasSession = async () => {
      const session = await fetchAuthSession();
      return Boolean(session.tokens?.idToken);
    };

    void waitForSession({ hasSession, control }).then((signedIn) => {
      if (control.cancelled) return;
      // replace, so the spent code never sits in history
      if (signedIn) router.replace('/home');
      else setError(true);
    });

    return () => {
      control.cancelled = true;
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
