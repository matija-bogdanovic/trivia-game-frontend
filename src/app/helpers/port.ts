'use client';

/**
 * Where the game backend lives. Set NEXT_PUBLIC_API_URL (e.g. on Vercel) to
 * point a deployment at its own backend — preview builds, a staging server, a
 * self-hosted box. NEXT_PUBLIC_* is inlined at build time, so this resolves in
 * the browser too.
 *
 * The WebSocket URL is derived from it rather than configured separately:
 * http:// → ws://, https:// → wss://, as .env.example documents.
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
  return isLocalhost ? FALLBACK_LOCAL : FALLBACK_REMOTE;
}

/** REST base for the game server, no trailing slash */
export function getPort(): string {
  return resolveApiUrl();
}

/**
 * Socket URL for a game path. `https://host` → `wss://host<path>`,
 * `http://host` → `ws://host<path>`.
 */
export function getWebSocketUrl(path: string): string {
  return resolveApiUrl().replace(/^http/, 'ws') + path;
}
