'use client';

import { useEffect, useState } from 'react';

/**
 * Where the game backend lives. Set NEXT_PUBLIC_API_URL (e.g. on Vercel) to
 * point a deployment at its own backend — preview builds, a staging server, a
 * self-hosted box. NEXT_PUBLIC_* is inlined at build time, so this resolves in
 * the browser too.
 *
 * Without it we fall back to the historical behaviour: localhost in dev, the
 * Render deployment otherwise.
 */
const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim();
const FALLBACK_LOCAL = 'http://localhost:3001';
const FALLBACK_REMOTE = 'https://whoisfaster.onrender.com';

/** no trailing slash — callers append paths like `${getPort()}/wallet` */
function normalize(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveApiUrl(): string {
  if (CONFIGURED_API_URL) return normalize(CONFIGURED_API_URL);

  // Server-side: no window to inspect, so go by the build environment
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'production'
      ? FALLBACK_REMOTE
      : FALLBACK_LOCAL;
  }

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  if (isLocalhost) return FALLBACK_LOCAL;
  // keep the page's scheme so an https page never makes an insecure call
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  return `${protocol}://${FALLBACK_REMOTE.replace(/^https?:\/\//, '')}`;
}

export function getPort(): string {
  return resolveApiUrl();
}

export function getWebSocketPort(): string {
  return resolveApiUrl().startsWith('https') ? 'wss' : 'ws';
}

export function getWebSocketUrl(path: string): string {
  return resolveApiUrl().replace(/^http/, 'ws') + path;
}

/** hook form, for components that only want the URL after mount */
export function usePort(): string | null {
  const [port, setPort] = useState<string | null>(null);

  useEffect(() => {
    setPort(resolveApiUrl());
  }, []);

  return port;
}
