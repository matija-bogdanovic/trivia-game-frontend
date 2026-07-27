'use client';

import { fetchAuthSession } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';

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
    // not signed in via Amplify — fall through to the cookie
  }
  const legacy = decodeJwt(getCookie('token'));
  if (legacy?.username) {
    return { username: legacy.username, displayName: legacy.username };
  }
  return null;
}

export async function getUsername(): Promise<string | null> {
  return (await getIdentity())?.username ?? null;
}

export function decodeJwt(token: string | null) {
  if (!token) {
    return null;
  }

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) {
      return null;
    }

    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    );
    const jsonPayload = atob(padded);
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Invalid JWT token', e);
    return null;
  }
}

export function getCookie(name: string): string | null {
  // ✅ Check if we're in the browser environment
  if (typeof document === 'undefined') {
    console.warn(`getCookie called on server-side for: ${name}`);
    return null;
  }

  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const tokenPart = parts.pop();
      if (tokenPart) {
        return tokenPart.split(';').shift() || null;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error getting cookie ${name}:`, error);
    return null;
  }
}

// Alternative: Use a hook for client-side only cookie access
export function useCookie(name: string): string | null {
  const [cookie, setCookie] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client-side
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const tokenPart = parts.pop();
      if (tokenPart) {
        setCookie(tokenPart.split(';').shift() || null);
        return;
      }
    }
    setCookie(null);
  }, [name]);

  return cookie;
}

// You'll need to import useState and useEffect if using the hook:
// import { useState, useEffect } from 'react';
