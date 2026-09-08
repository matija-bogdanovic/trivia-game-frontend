'use client';

import { apiFetch } from './api';

/**
 * Is a chosen display name still free?
 *
 * ── WHERE UNIQUENESS ACTUALLY LIVES TODAY ──────────────────────────────────
 * Two different names are called "username" in this app, and only one of them
 * is enforced anywhere:
 *
 *   · the Cognito username — immutable, case-insensitive by pool config, and
 *     unique. It is claimed once at signup, where a duplicate comes back as
 *     UsernameExistsException and is mapped by authErrorKey() to
 *     `authError.usernameTaken`. Settings cannot change it.
 *   · the display name — what /settings edits, sent as POST /wallet
 *     { displayName } and stored on the player row. The server truncates it
 *     to 50 characters and otherwise takes whatever it is given: today it
 *     never rejects a duplicate.
 *
 * So there is no availability endpoint to reuse yet. This module is the one
 * place that knows the contract, so wiring the server side is a change here
 * and nowhere else.
 *
 * ── CONTRACT ───────────────────────────────────────────────────────────────
 *   PATH    POST /username/available
 *   AUTH    Authorization: Bearer <Cognito ACCESS token>, attached by apiFetch
 *   BODY    { displayName: "<trimmed candidate>" }
 *   200     { available: true | false }
 *   409     the name is taken (accepted as an alternative to 200/false)
 *   404/405/501  route not deployed — treated as "cannot tell", never as a
 *                block, so the screen keeps working against a server that
 *                does not have the route yet
 *
 * Anything unexpected — a 500, an offline client, a body that is not the
 * agreed shape — is also "cannot tell". A check that cannot reach the server
 * must not be what stops someone renaming themselves; the authoritative word
 * is the save itself, which is why walletRejectedName() exists below.
 */
const AVAILABILITY_PATH = '/username/available';

export type UsernameAvailability =
  /** the server says nobody else has it */
  | 'free'
  /** the server says it is taken */
  | 'taken'
  /** the route is not deployed — do not block on this */
  | 'unsupported'
  /** server error, offline, or an unrecognised body — do not block on this */
  | 'unknown';

export async function checkUsernameAvailability(
  displayName: string
): Promise<UsernameAvailability> {
  const name = displayName.trim();
  if (!name) return 'unknown';

  try {
    const res = await apiFetch(AVAILABILITY_PATH, {
      body: { displayName: name },
    });

    if (res.status === 409) return 'taken';
    if (res.status === 404 || res.status === 405 || res.status === 501) {
      return 'unsupported';
    }
    if (!res.ok) return 'unknown';

    const data = await res.json().catch(() => null);
    if (typeof data?.available !== 'boolean') return 'unknown';
    return data.available ? 'free' : 'taken';
  } catch {
    // unreachable server, DNS, offline
    return 'unknown';
  }
}

/**
 * Did a failed POST /wallet fail *because* the name is taken?
 *
 * The save is the authoritative check — the availability call above races
 * anyone typing the same name at the same moment. A conflict is a 409, or any
 * error body that says so in the message, so a server that reports it as a
 * 400 with `{ message: "displayName taken" }` still lands on the field
 * instead of on the generic "could not save".
 */
export function walletRejectedName(
  res: Response,
  data: { message?: unknown } | null
): boolean {
  if (res.status === 409) return true;
  const message = typeof data?.message === 'string' ? data.message : '';
  return /taken|already exists|in use|conflict|duplicate/i.test(message);
}
