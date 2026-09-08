'use client';

import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

export interface Identity {
  /** unique account id (Cognito username) — the identity key everywhere */
  username: string;
  /** what other players see */
  displayName: string;
  /** from the id token; absent for accounts without a verified email */
  email: string | null;
  /** how this account signs in — federated Google, or a pool password */
  provider: 'google' | 'cognito';
  /** the federated account's picture, or null */
  picture: string | null;
}

/**
 * Which identity provider is behind this token.
 *
 * Cognito records federation two ways and neither is guaranteed: the
 * `identities` claim is the reliable one but is absent on some token versions,
 * and the username of a federated user is prefixed with the provider name
 * (`Google_1234…`). Reading both means the badge does not disappear because of
 * a claim-shape difference.
 */
function providerOf(
  payload: Record<string, unknown> | undefined,
  username: string
): 'google' | 'cognito' {
  const identities = payload?.['identities'];
  const list =
    typeof identities === 'string'
      ? // it arrives JSON-encoded from some endpoints
        (() => {
          try {
            return JSON.parse(identities);
          } catch {
            return null;
          }
        })()
      : identities;
  if (Array.isArray(list)) {
    for (const entry of list) {
      const provider = (entry as { providerName?: unknown })?.providerName;
      if (typeof provider === 'string' && provider.toLowerCase() === 'google') {
        return 'google';
      }
    }
  }
  return username.toLowerCase().startsWith('google_') ? 'google' : 'cognito';
}

/**
 * Resolve the signed-in player's identity. The unique Cognito username is
 * the key (display names like Google profile names can collide); the
 * display name is only ever shown, never compared.
 */
export async function getIdentity(): Promise<Identity | null> {
  try {
    const session = await fetchAuthSession();
    const payload = session.tokens?.idToken?.payload;
    const username = payload?.['cognito:username'];
    if (typeof username === 'string' && username.length > 0) {
      const name = payload?.['name'];
      const email = payload?.['email'];
      /*
       * The picture, IF the ID token happens to carry it.
       *
       * It is a `profile`-scope claim, so it should — but whether a mapped
       * attribute reaches the token depends on the scopes granted and on the
       * app client's readable attributes, and neither is something this
       * function can check. So this is the cheap path, not the reliable one:
       * see resolveProfilePicture below, which asks Cognito directly when the
       * claim is missing.
       */
      const picture = payload?.['picture'];
      return {
        username,
        displayName:
          typeof name === 'string' && name.length > 0 ? name : username,
        email: typeof email === 'string' && email.length > 0 ? email : null,
        picture:
          typeof picture === 'string' && picture.startsWith('https://')
            ? picture
            : null,
        provider: providerOf(payload, username),
      };
    }
  } catch {
    // not signed in
  }
  // NOTE: there used to be a fallback here that read the username out of a
  // legacy `token` cookie. It decoded the JWT without verifying its
  // signature, so anyone could hand-craft a cookie and be treated as any
  // player. The custom-auth flow that issued those cookies is gone and its
  // Players table was always empty, so nothing legitimate depended on it.
  return null;
}

export async function getUsername(): Promise<string | null> {
  return (await getIdentity())?.username ?? null;
}

/**
 * The account's profile picture, asked for properly.
 *
 * ── WHY NOT JUST THE ID-TOKEN CLAIM ────────────────────────────────────────
 * Reading `picture` off the token is one line and works only when Cognito
 * chose to put it there. Whether it does depends on the granted scopes and on
 * the app client's ReadAttributes, and a mapped attribute that is populated on
 * the user can still be absent from the token. Trusting the claim alone means
 * a picture that exists in the pool never reaches the app, silently.
 *
 * fetchUserAttributes() calls Cognito's GetUser and returns what the user
 * record actually holds, which is the thing being asked about.
 *
 * ── WHY THE CLAIM IS STILL TRIED FIRST ─────────────────────────────────────
 * It costs nothing. getIdentity() already has the decoded token in hand, so
 * when the claim is there the network call is skipped entirely; the request
 * only happens for the accounts where it would otherwise have failed.
 *
 * Returns null for a password account, for a federated account whose provider
 * sent no picture, and for anyone who last signed in before the pool mapped
 * the attribute — that last group gets one on their next sign-in, since
 * Cognito writes mapped attributes at federated sign-in and does not backfill.
 */
export async function resolveProfilePicture(
  identity: Identity | null
): Promise<string | null> {
  if (!identity) return null;
  if (identity.picture) return identity.picture;

  try {
    const attributes = await fetchUserAttributes();
    const picture = attributes.picture;
    const usable =
      typeof picture === 'string' && picture.startsWith('https://')
        ? picture
        : null;
    if (process.env.NODE_ENV !== 'production') {
      // the one thing worth seeing while this is being wired up: whether the
      // pool holds a picture at all, as distinct from the app failing to use it
      console.info(
        '[avatar] picture from user attributes:',
        usable ??
          `(none — pool has ${picture === undefined ? 'no attribute' : 'an unusable value'})`
      );
    }
    return usable;
  } catch (err) {
    // not signed in, or the attribute is not readable by this client
    if (process.env.NODE_ENV !== 'production') {
      console.info('[avatar] could not read user attributes:', err);
    }
    return null;
  }
}
