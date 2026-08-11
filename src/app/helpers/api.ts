'use client';

import { fetchAuthSession } from 'aws-amplify/auth';

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

  return fetch(
    `https://7pqkxtdnod.execute-api.eu-west-3.amazonaws.com/deployedStage/${path}`,
    {
      method: options.method ?? 'POST',
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    }
  );
}
