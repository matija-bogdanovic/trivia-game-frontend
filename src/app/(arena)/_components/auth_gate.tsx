'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

/**
 * Nothing protected renders until there is a session.
 *
 * ── WHAT THE MIDDLEWARE ALREADY DOES, AND WHERE IT STOPS ───────────────────
 * The edge gate in src/middleware.ts catches every hard load: /home, /rooms,
 * /game/… and the rest all answer 307 to /login before a byte of the page is
 * rendered. That is the right place for it and this does not replace it.
 *
 * It stops short in three ways, all of them by design or by nature:
 *
 *   · It accepts an EXPIRED access token on purpose, because an expired one
 *     beside a live refresh token still means signed in. When the refresh
 *     token is dead too, the request passes the edge and the app renders —
 *     and then Amplify says there is no session, so six screens show a
 *     "sign in" prompt while the reader sits inside the app they are not in.
 *   · It reads cookies, and cookies outlive sessions. A sign-out that
 *     half-completes leaves them behind; middleware's own comment says so.
 *   · It only runs on a REQUEST. Sign out in another tab, or let the refresh
 *     token lapse while this one is open, and nothing ever kicks you out.
 *
 * ── WHY IT RENDERS NOTHING WHILE IT CHECKS ─────────────────────────────────
 * Returning children optimistically and redirecting afterwards is what
 * produces the flash this exists to prevent — a frame of somebody else's
 * dashboard before the bounce. So the gate holds the tree until the answer is
 * in. That costs one paint on the first mount of the shell, which survives
 * client navigation, so it is paid once per visit rather than per page.
 *
 * The blank is deliberately blank rather than a spinner: on a normal load the
 * check resolves in a few milliseconds, and a spinner that flickers on every
 * visit is worse than nothing appearing for one frame.
 */
type Status = 'checking' | 'in' | 'out';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let live = true;

    /** send them to login, remembering where they were headed */
    const bounce = () => {
      if (!live) return;
      setStatus('out');
      const next = encodeURIComponent(pathname || '/home');
      // replace, so Back does not walk into the page they were just refused
      router.replace(`/login?next=${next}`);
    };

    fetchAuthSession()
      .then((session) => {
        if (!live) return;
        /*
         * Tokens, not `credentials`. An identity pool with guest access hands
         * out credentials to anybody, so checking those would call an
         * anonymous visitor signed in — which is exactly the hole this is
         * here to close.
         */
        if (session.tokens?.accessToken) setStatus('in');
        else bounce();
      })
      .catch(bounce);

    /*
     * And keep listening. A session can end while the page is open — a
     * sign-out in another tab, a refresh token that lapses — and the edge
     * gate cannot help with either, because no request is made.
     */
    const stop = Hub.listen('auth', ({ payload }) => {
      if (
        payload.event === 'signedOut' ||
        payload.event === 'tokenRefresh_failure'
      ) {
        bounce();
      }
    });

    return () => {
      live = false;
      stop();
    };
  }, [router, pathname]);

  if (status !== 'in') return null;
  return <>{children}</>;
}
