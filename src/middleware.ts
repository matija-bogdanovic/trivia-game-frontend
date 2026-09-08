import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth gate.
 *
 * The app had no route protection: the pre-reskin header carried a
 * redirect-to-login check and went with it when that chrome was retired, so
 * every arena screen was reachable signed out. This restores it at the edge,
 * before the page renders, rather than as a flash of protected UI followed by
 * a client-side bounce.
 *
 * This is the UX layer, not the security boundary. The API verifies every
 * token against the pool's JWKS and answers 401 otherwise — a forged bearer
 * already gets a 401 from /wallet — so nothing here validates a signature.
 *
 * What it does have to get right is *not locking anyone out*. Amplify leaves
 * cookies behind: a sign-out that half-completes, a session that expires, a
 * stale value from an earlier build. Treating any of those as "signed in"
 * bounces the user off /login while the app itself considers them signed out,
 * and there is then no way back in. So the checks below are asymmetric —
 * generous about letting people reach the login page, strict about calling
 * someone authenticated.
 */

const CLIENT_ID =
  process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '3j69q67dfk60kl92gukqhdlr91';

/** Signed out, these bounce to /login. */
const PROTECTED = [
  '/home',
  '/profile',
  '/settings',
  '/rooms',
  '/friends',
  '/history',
  '/achievements',
  '/leaderboards',
  '/game',
];

/**
 * Signed in, these bounce to /home. Nothing here may ever appear in PROTECTED:
 * /login is where the protected redirect points, so gating it would be a loop
 * with no exit.
 */
const AUTH_ROUTES = ['/login', '/signup', '/confirm', '/reset-password'];

const startsWithSegment = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * Amplify stores the access token as
 * `CognitoIdentityServiceProvider.<clientId>.<user>.accessToken`, and splits a
 * long one across `.accessToken.0`, `.accessToken.1`, … Chunks are reassembled
 * in index order; an unchunked cookie is returned as-is.
 */
function readAccessToken(request: NextRequest): string | null {
  const lastUser = request.cookies.get(
    `CognitoIdentityServiceProvider.${CLIENT_ID}.LastAuthUser`
  )?.value;
  if (!lastUser) return null;

  const base = `CognitoIdentityServiceProvider.${CLIENT_ID}.${lastUser}.accessToken`;

  const whole = request.cookies.get(base)?.value;
  if (whole) return whole;

  const chunks = request.cookies
    .getAll()
    .filter((c) => c.name.startsWith(`${base}.`))
    .map((c) => ({ i: Number(c.name.slice(base.length + 1)), v: c.value }))
    .filter((c) => Number.isInteger(c.i))
    .sort((a, b) => a.i - b.i);

  if (chunks.length === 0) return null;
  const joined = chunks.map((c) => c.v).join('');
  return joined.length > 0 ? joined : null;
}

interface TokenState {
  /** shaped like a JWT with a payload that parses — not merely non-empty */
  plausible: boolean;
  /** true only when the payload carries an exp that has passed */
  expired: boolean;
}

/**
 * Inspect the token without verifying it. The signature is the API's business;
 * all this needs to know is whether the cookie holds a real token rather than
 * a leftover husk, and whether it has already lapsed.
 */
function inspectToken(token: string | null): TokenState {
  if (!token) return { plausible: false, expired: false };

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((p) => p.length === 0)) {
    // "dummy", a truncated chunk, anything that is not a JWT
    return { plausible: false, expired: false };
  }

  try {
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
    ) as { exp?: number };
    return {
      plausible: true,
      expired:
        typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now(),
    };
  } catch {
    // shaped like a JWT but the payload is not decodable JSON
    return { plausible: false, expired: false };
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED.some((base) =>
    startsWithSegment(pathname, base)
  );
  const isAuthRoute = AUTH_ROUTES.some((base) =>
    startsWithSegment(pathname, base)
  );
  // anything else — the root redirect, a public page — passes straight through
  if (!isProtected && !isAuthRoute) return NextResponse.next();

  const { plausible, expired } = inspectToken(readAccessToken(request));

  /*
   * Protected routes accept an expired token. An expired access token
   * alongside a live refresh token still means signed in, and Amplify renews
   * it on the client — rejecting on exp here would bounce people who are
   * genuinely logged in.
   */
  if (isProtected && !plausible) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  /*
   * Auth pages are stricter, in the safe direction: only a token that is both
   * real and unexpired sends someone away. Anyone whose session has lapsed can
   * always reach /login to sign in again, which is what makes the lockout
   * impossible.
   */
  if (isAuthRoute && plausible && !expired) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals, the API, the favicon and static files.
     * The middleware then decides which of those paths it actually cares
     * about, so an unlisted public route falls straight through.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
