'use client';

/**
 * The app talks to two different backends, and they are deliberately not the
 * same host any more.
 *
 * REST went serverless (Lambda behind API Gateway). The real-time game did
 * not — it is still the always-on `ws` server, because an API Gateway REST
 * endpoint cannot serve a WebSocket at all: a socket pointed at it would
 * simply fail to connect. So the two resolve independently:
 *
 *   NEXT_PUBLIC_API_URL  REST — wallet, rooms, lobbies, avatars
 *   NEXT_PUBLIC_WS_URL   the game socket
 *
 * Both are NEXT_PUBLIC_*, so they are inlined at build time and resolve in the
 * browser. When NEXT_PUBLIC_WS_URL is unset the socket falls back to exactly
 * where the game ran before this split — localhost in dev, the Render
 * deployment otherwise — so nothing changes for anyone who has not set it.
 */
const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim();
const CONFIGURED_WS_URL = process.env.NEXT_PUBLIC_WS_URL?.trim();

/** where the always-on game server runs */
const GAME_LOCAL = 'http://localhost:3001';
const GAME_REMOTE = 'https://whoisfaster.onrender.com';

/** no trailing slash — callers append paths like `${getPort()}/wallet` */
function normalize(url: string): string {
  return url.replace(/\/+$/, '');
}

/** localhost in dev, the deployed game host otherwise */
function gameHostFallback(): string {
  // server-side: no window to inspect, so go by the build environment
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'production' ? GAME_REMOTE : GAME_LOCAL;
  }
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  return isLocalhost ? GAME_LOCAL : GAME_REMOTE;
}

function resolveApiUrl(): string {
  if (CONFIGURED_API_URL) return normalize(CONFIGURED_API_URL);
  // no REST host configured — the game server also serves REST, so it is the
  // sensible fallback and preserves the pre-split behaviour
  return gameHostFallback();
}

function resolveGameUrl(): string {
  if (CONFIGURED_WS_URL) return normalize(CONFIGURED_WS_URL);
  return gameHostFallback();
}

/** REST base — API Gateway once NEXT_PUBLIC_API_URL is set. No trailing slash. */
export function getPort(): string {
  return resolveApiUrl();
}

/** The game host the socket connects to, as configured. No trailing slash. */
export function getGameHost(): string {
  return resolveGameUrl();
}

/** the game host as a ws:// or wss:// origin, whichever scheme it was given in */
function toSocketScheme(host: string): string {
  if (/^wss?:\/\//i.test(host)) return host;
  return host.replace(/^http/i, 'ws');
}

/**
 * The socket endpoint — the bare host, with no path.
 *
 * An API Gateway WebSocket API does not route on the URL path: everything
 * after the stage is dropped before the handler sees it, so a lobby id in the
 * path would simply vanish. The lobby id travels in the `join` message body
 * instead. Built from the game host and never from the REST base.
 */
export function getSocketUrl(): string {
  return toSocketScheme(resolveGameUrl());
}

/**
 * Socket URL for a game path.
 *
 * @deprecated API Gateway drops the path. Use getSocketUrl() and put the lobby
 * id in the join message. Kept for the always-on `ws` server, which does route
 * on the path.
 */
export function getWebSocketUrl(path: string): string {
  return toSocketScheme(resolveGameUrl()) + path;
}
