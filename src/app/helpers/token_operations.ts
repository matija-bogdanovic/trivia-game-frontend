'use client';

import { fetchAuthSession } from 'aws-amplify/auth';

export interface Identity {
  /** unique account id (Cognito username) — the identity key everywhere */
  username: string;
  /** what other players see */
  displayName: string;
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
      return {
        username,
        displayName:
          typeof name === 'string' && name.length > 0 ? name : username,
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
