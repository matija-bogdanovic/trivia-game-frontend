'use client';

import { fetchAuthSession } from 'aws-amplify/auth';
import { getPort } from './port';

/**
 * The legacy REST host. Kept as the default so deployments that never set
 * NEXT_PUBLIC_API_URL keep hitting exactly what they hit before.
 */
const LEGACY_API_GATEWAY =
  'https://7pqkxtdnod.execute-api.eu-west-3.amazonaws.com/deployedStage';

/**
 * Where REST calls go. .env.example promises NEXT_PUBLIC_API_URL is the one
 * host for both REST and the WebSocket, and getPort() already resolves it —
 * so honour it when it is set. Without it, nothing changes: local dev and
 * production both fall back to the gateway above.
 *
 * This matters for running against a local game server: the socket derives
 * from NEXT_PUBLIC_API_URL, so a hardcoded REST host would send /createRoom
 * to one backend and the socket to another.
 */
function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim()
    ? getPort()
    : LEGACY_API_GATEWAY;
}

/**
 * The caller's Cognito access token. Amplify refreshes it behind
 * fetchAuthSession(), so this is always current as long as the session is.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
}

/**
 * Calls the backend with the signed-in user's token attached. The server
 * derives who you are from that token — request bodies no longer carry a
 * username, because a client-supplied one was never trustworthy.
 *
 * Returns the raw Response so callers keep handling their own status codes;
 * a 401 here means the session expired or was never established.
 */
export async function apiFetch(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${apiBase()}/${path.replace(/^\/+/, '')}`, {
    method: options.method ?? 'POST',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}
