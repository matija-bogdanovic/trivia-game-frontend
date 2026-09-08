import type { ResourcesConfig } from 'aws-amplify';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/';

/**
 * Every origin the app is served from. Cognito matches these strings exactly,
 * so each one also has to be listed in the app client's allowed callback and
 * sign-out URLs or the Hosted UI refuses with redirect_mismatch.
 */
const CONFIGURED_REDIRECTS = Array.from(
  new Set([APP_URL, 'http://localhost:3000/'])
);

/**
 * Amplify resolves the redirect by origin, but falls back to the first entry
 * when nothing matches — and a bare fallback would send someone on a preview
 * origin to production. Reordering makes the right target the fallback too.
 *
 * An origin that is not in the list at all — a fresh tunnel hostname, a
 * preview deploy — is prepended, so the app still builds a truthful
 * redirect_uri. Cognito rejects it until that exact URL is whitelisted, which
 * is the honest failure rather than a silent redirect somewhere else. It also
 * means a new tunnel needs no rebuild, only a Cognito entry.
 */
function oauthRedirectUrls(): string[] {
  if (typeof window === 'undefined') return CONFIGURED_REDIRECTS;
  const current = `${window.location.origin}/`;
  const match = CONFIGURED_REDIRECTS.find((url) => url === current);
  return match
    ? [match, ...CONFIGURED_REDIRECTS.filter((url) => url !== current)]
    : [current, ...CONFIGURED_REDIRECTS];
}

/**
 * The one Amplify resource config, shared by the browser and the server.
 *
 * The client configures it via amplify_configure(); middleware feeds the same
 * object to createServerRunner(). They have to agree — the server reads the
 * cookies the client wrote, and a mismatched userPoolClientId would simply not
 * find them.
 */
export const amplifyResourceConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || 'eu-west-3_Uylh5ZFUK',
      userPoolClientId:
        process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ||
        '3j69q67dfk60kl92gukqhdlr91',
      identityPoolId:
        process.env.NEXT_PUBLIC_IDENTITY_POOL_ID ||
        'eu-west-3:ee26e62a-ab48-4755-b656-462f3cca5ece',
      loginWith: {
        email: true,
        oauth: {
          domain:
            process.env.NEXT_PUBLIC_COGNITO_DOMAIN ||
            'eu-west-3uylh5zfuk.auth.eu-west-3.amazoncognito.com',
          scopes: [
            'openid',
            'email',
            'profile',
            // required so federated (Google) users can update their own
            // attributes, e.g. saving a profile picture
            'aws.cognito.signin.user.admin',
          ],
          redirectSignIn: oauthRedirectUrls(),
          redirectSignOut: oauthRedirectUrls(),
          responseType: 'code',
        },
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: { required: true },
        name: { required: false },
      },
      allowGuestAccess: true,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};
