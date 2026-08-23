'use client';

import { fetchAuthSession } from 'aws-amplify/auth';

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
       * The federated account's picture, mapped from Google's `picture` claim
       * by the pool's Google IdP. Absent for password accounts, and absent for
       * anyone who last signed in before that mapping existed — they get it on
       * their next sign-in and nothing has to migrate.
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
