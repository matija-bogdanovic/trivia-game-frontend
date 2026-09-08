import { Amplify } from 'aws-amplify';
import { signInWithRedirect } from 'aws-amplify/auth';
import { amplifyResourceConfig } from './amplify_config';

/**
 * ── WHY signInWithRedirect IS IMPORTED HERE AND NEVER CALLED ───────────────
 * It is not for calling. It is for its SIDE EFFECT.
 *
 * Amplify v6 registers the listener that finishes an OAuth round trip inside
 * `utils/oauth/enableOAuthListener.mjs`, and exactly one module in the whole
 * library imports that file:
 *
 *     providers/cognito/apis/signInWithRedirect.mjs:3
 *         import '../utils/oauth/enableOAuthListener.mjs';
 *
 * So the listener exists only on pages whose bundle pulled in
 * signInWithRedirect. `Amplify.configure()` then walks a list of OAuth
 * listeners that is EMPTY, finds nothing to run, and returns happily.
 *
 * The Google flow starts on /login, which imports it — so leaving is fine.
 * Cognito sends the browser back to `/`, a different route with a different
 * chunk graph, where nothing has any reason to import it. Landing there, the
 * `?code=` in the URL is never exchanged: no listener, no attempt, no error.
 * fetchAuthSession keeps answering "no tokens", the callback screen keeps
 * polling, and it sits on "Prijavljivanje u toku…" until its own deadline
 * gives up. Exactly the reported symptom, and the reason it never surfaced an
 * error — nothing failed, nothing was ever asked to run.
 *
 * Importing it beside configure() ties the two together: every page that
 * configures Amplify now also has the listener that makes configuration
 * finish a sign-in. The reference below is what stops a bundler treating this
 * as an unused import and dropping the side effect with it.
 */
const OAUTH_LISTENER_SIDE_EFFECT = signInWithRedirect;
void OAUTH_LISTENER_SIDE_EFFECT;

/** set NEXT_PUBLIC_GOOGLE_AUTH=1 once the Google identity provider is
 *  configured in the Cognito user pool to show the Google button */
export const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH === '1';

/**
 * Configure Amplify in the browser.
 *
 * ssr: true is what puts the tokens in cookies rather than localStorage, which
 * is what lets middleware read the session server-side. Changing it would
 * silently disable the auth gate.
 */
export const amplifyConfigure = () => {
  Amplify.configure(amplifyResourceConfig, { ssr: true });
};
