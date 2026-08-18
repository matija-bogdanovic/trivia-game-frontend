'use client';

import { apiFetch } from './api';

/**
 * Deleting your own account.
 *
 * ── PROVISIONAL CONTRACT ───────────────────────────────────────────────────
 * The endpoint is not confirmed yet, so everything about the call lives in
 * this one function and nowhere else. Swapping in the real path is editing
 * DELETE_ACCOUNT_PATH; changing the request shape is editing the body below.
 * No caller knows either.
 *
 * What is assumed, to be reconciled against the backend:
 *
 *   PATH    POST /account/delete
 *   AUTH    the caller's Cognito ACCESS token, which apiFetch attaches as
 *           `Authorization: Bearer …` — the same way every other authenticated
 *           route in this app is called
 *   BODY    none. The identity comes from the verified token and never from
 *           the body, which is how friendsAction and wallet already work; a
 *           username in the body would be a username a client could change
 *   OK      any 2xx. The response body is not read, because there is nothing
 *           the client needs from it — the account is gone
 *   FAIL    any non-2xx, with an optional { message } used for the notice
 *
 * If the real endpoint wants a confirmation field, a password, or a DELETE
 * verb instead, this is the only file that changes.
 */
const DELETE_ACCOUNT_PATH = '/account/delete';

export interface DeleteAccountResult {
  ok: boolean;
  /** the server's reason, when it gave one */
  message?: string;
}

export async function deleteAccount(): Promise<DeleteAccountResult> {
  try {
    const res = await apiFetch(DELETE_ACCOUNT_PATH, { body: {} });
    if (res.ok) return { ok: true };

    const data = await res.json().catch(() => ({}));
    return {
      ok: false,
      message: typeof data?.message === 'string' ? data.message : undefined,
    };
  } catch {
    // unreachable server, DNS, offline — the caller localises this
    return { ok: false };
  }
}
