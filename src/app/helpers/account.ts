'use client';

import { apiFetch } from './api';

/**
 * Deleting your own account.
 *
 * ── CONFIRMED CONTRACT ─────────────────────────────────────────────────────
 *   PATH    POST /account/delete
 *   AUTH    Authorization: Bearer <Cognito ACCESS token>, attached by apiFetch
 *   BODY    ignored by the server; {} is sent. Identity comes from the
 *           verified token and never from the body
 *   200     { deleted: true, ... } — gone, sign out
 *   200     { cognito: "failed", message } — the DATA is gone but the Cognito
 *           login survived. Rare, and the reason this is not simply
 *           "any 2xx is success": signing someone out here would tell them the
 *           account is deleted while their sign-in still works. The server's
 *           own message is shown instead and the session is left alone
 *   401     { message: "Unauthorized" } — missing or garbage token
 *
 * Everything about the call still lives here, so a change of path, verb or
 * body is a change to this file and to nothing else.
 */
const DELETE_ACCOUNT_PATH = '/account/delete';

export type DeleteAccountOutcome =
  /** account and login both gone — sign out and leave */
  | { outcome: 'deleted' }
  /** data gone, login survives — stay put and say so */
  | { outcome: 'partial'; message?: string }
  /** nothing was deleted */
  | { outcome: 'failed'; message?: string };

export async function deleteAccount(): Promise<DeleteAccountOutcome> {
  try {
    const res = await apiFetch(DELETE_ACCOUNT_PATH, { body: {} });
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data?.message === 'string' ? data.message : undefined;

    if (!res.ok) return { outcome: 'failed', message };

    // a 2xx that admits the login is still there is not a completed deletion
    if (data?.cognito === 'failed') return { outcome: 'partial', message };

    return { outcome: 'deleted' };
  } catch {
    // unreachable server, DNS, offline — the caller localises this
    return { outcome: 'failed' };
  }
}
