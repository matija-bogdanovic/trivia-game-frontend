/**
 * Recovering a Cognito redirect that Amplify will never finish.
 *
 * ── THE SECOND SILENT GATE ─────────────────────────────────────────────────
 * attemptCompleteOAuthFlow begins with this, and it is the whole problem:
 *
 *     if (!(await oAuthStore.loadOAuthInFlight())) {
 *         return;                       // no error, no log, nothing
 *     }
 *
 * `inflightOAuth` is a flag Amplify writes when signInWithRedirect leaves, and
 * BOTH the success path and handleFailure clear it on the way back. So once an
 * attempt has been consumed — or interrupted, or made before the completion
 * listener existed — every later return with a perfectly good `?code=&state=`
 * finds no flag, returns immediately, and exchanges nothing.
 *
 * That state is sticky. It survives retries, reloads and restarts of the dev
 * server, because it lives in the browser: the OAuth store is hard-wired to
 * `defaultStorage` (localStorage) and is NOT the cookie store that ssr:true
 * installs for tokens. Only clearing those keys, or a fresh signInWithRedirect
 * that writes the flag again, gets out of it.
 *
 * ── WHY THIS FILE KNOWS THE KEY NAMES ──────────────────────────────────────
 * Amplify exposes no way to ask "is an exchange actually going to happen?" and
 * no way to clear a half-finished one. The names are stable and simple —
 * `CognitoIdentityServiceProvider.<clientId>.<key>`, built by
 * getAuthStorageKeys over OAuthStorageKeys — so reading them directly is the
 * available answer. If a future Amplify renames them, the worst case is that
 * this reports "not in flight" and the caller restarts the flow, which is what
 * it would have done anyway.
 */

const PREFIX = 'CognitoIdentityServiceProvider';

/** the four keys Amplify keeps an in-progress redirect in */
const OAUTH_KEYS = [
  'inflightOAuth',
  'oauthPKCE',
  'oauthState',
  'oauthSignIn',
] as const;

const clientId = () =>
  process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '3j69q67dfk60kl92gukqhdlr91';

const keyFor = (name: string) => `${PREFIX}.${clientId()}.${name}`;

/**
 * Is Amplify actually going to exchange the code in this URL?
 *
 * True only when the inflight flag is set. False means the callback will be
 * ignored no matter how long anybody waits — which is worth knowing at once
 * rather than after a twenty-second spinner.
 */
export function oauthExchangeIsPending(): boolean {
  try {
    return window.localStorage.getItem(keyFor('inflightOAuth')) === 'true';
  } catch {
    // storage disabled: assume the optimistic answer and let the poll decide
    return true;
  }
}

/**
 * Forget a redirect that cannot be completed.
 *
 * Called before starting a fresh one, so the new flow writes its own PKCE
 * verifier and state over a clean slate instead of inheriting a half-cleared
 * set from the attempt that got stuck.
 */
export function clearStaleOAuthState(): void {
  try {
    for (const key of OAUTH_KEYS) {
      window.localStorage.removeItem(keyFor(key));
    }
  } catch {
    // nothing to clear if there is no storage to clear it from
  }
}

/**
 * One retry per tab, ever.
 *
 * Restarting the flow is the right move once — the reader pressed a sign-in
 * button and is owed one — and catastrophic on a loop. sessionStorage scopes
 * the guard to this tab, so a genuinely broken configuration ends at the error
 * screen instead of bouncing between Google and the callback forever.
 */
const RETRY_KEY = 'oauth-restart-attempted';

export function mayRestartOAuth(): boolean {
  try {
    if (window.sessionStorage.getItem(RETRY_KEY) === '1') return false;
    window.sessionStorage.setItem(RETRY_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

/** a completed sign-in clears the guard, so a later session may retry again */
export function forgetOAuthRestart(): void {
  try {
    window.sessionStorage.removeItem(RETRY_KEY);
  } catch {
    // no storage, no guard to forget
  }
}
