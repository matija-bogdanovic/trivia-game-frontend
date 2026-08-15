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
 * It checks that Amplify's SSR session cookie is *present*, and deliberately
 * does not validate the signature. That is not the security boundary — the API
 * verifies every token against the pool's JWKS and answers 401 otherwise,
 * which is proven: a forged bearer gets 401 from /wallet today. This is the UX
 * layer, and keeping it to a cookie read means no crypto and no network call in
 * middleware.
 *
 * Presence, specifically, rather than expiry: an expired access token with a
 * live refresh token still means "signed in", and Amplify refreshes it on the
 * client. Rejecting on `exp` here would bounce people who are genuinely logged
 * in.
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
  '/results',
  '/leaderboards',
  '/game',
];

/** Signed in, these bounce to /home — a logged-in user has no use for them. */
const AUTH_ROUTES = ['/login', '/signup', '/confirm', '/reset-password'];

const startsWithSegment = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * Amplify writes `CognitoIdentityServiceProvider.<clientId>.LastAuthUser` plus
 * `...<username>.accessToken` for the signed-in user. A long token can be split
 * across `.accessToken.0`, `.accessToken.1`, … so the token cookie is matched
 * by prefix rather than exact name.
 */
function hasSession(request: NextRequest): boolean {
  const prefix = `CognitoIdentityServiceProvider.${CLIENT_ID}`;
  const lastUser = request.cookies.get(`${prefix}.LastAuthUser`)?.value;
  if (!lastUser) return false;

  const tokenPrefix = `${prefix}.${lastUser}.accessToken`;
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith(tokenPrefix) && c.value.length > 0);
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

  const signedIn = hasSession(request);

  if (isProtected && !signedIn) {
    const login = new URL('/login', request.url);
    // so login can send them back where they were headed
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (isAuthRoute && signedIn) {
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
