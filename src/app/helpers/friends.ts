'use client';

import { apiFetch } from './api';

/**
 * The friends API, in one place.
 *
 * ── WHERE FRIENDSHIPS ACTUALLY LIVE ────────────────────────────────────────
 * Not Firestore, and not a table of their own. A friendship is two string
 * arrays on the player's own DynamoDB record (the `Wallets` item, PK
 * `username`), written by two deployed Lambdas behind API Gateway —
 * `lambda/friendsList.mjs` and `lambda/friendsAction.mjs`:
 *
 *   wallet.friends: string[]         usernames, on BOTH players once accepted
 *   wallet.friendRequests: string[]  INCOMING requests, on the RECIPIENT only
 *
 * ── THE STATUS MODEL, AND WHAT IT CANNOT SAY ───────────────────────────────
 * There is no status field. State is implied by which array a username sits
 * in, and that encoding is missing two of the three states outright:
 *
 *   accepted  each username is in the other's `friends` — fully represented
 *   pending   the sender's username is in the recipient's `friendRequests`.
 *             Represented ONLY on the recipient's side: the sender's own
 *             record is not touched, so a sender has nothing to read back and
 *             cannot see, or cancel, a request they sent.
 *   denied    NOT REPRESENTED AT ALL. `decline` deletes the entry, so a denied
 *             request is indistinguishable from one that was never sent and
 *             the sender may immediately send it again.
 *
 * So this module is written against the contract the backend NEEDS, and
 * degrades to the one it HAS. `outgoing` is read when the server sends it and
 * reported as unsupported when it does not, which is what lets the pending
 * panel exist without pretending: it renders only where there is data behind
 * it. See FriendsSnapshot.outgoingSupported.
 *
 * ── THE CONTRACT ───────────────────────────────────────────────────────────
 *   POST /friends/list      no body
 *     200 { friends:  [{ username, displayName, online, points,
 *                        currentStreak, wins }],
 *           requests: [username] | [{ username, displayName, status,
 *                                     createdAt }],     ← incoming
 *           outgoing: [{ username, displayName, status, createdAt,
 *                        updatedAt }] }                 ← NEEDED, not yet sent
 *
 *   POST /friends/action    { target, action }
 *     action:  "request" | "accept" | "decline" | "remove" | "cancel"
 *              ("cancel" is NEEDED, not yet implemented)
 *     200 { status: "sent"|"pending" | "accepted" | "declined"|"denied"
 *                 | "removed" | "cancelled" }
 *     400 { message: "<English reason>" }  — mapped to FriendActionError below
 *   Auth: apiFetch attaches the Cognito ACCESS token; the server takes the
 *         acting username from it and never from the body.
 */

export type FriendshipStatus = 'pending' | 'accepted' | 'denied';

/** every action the endpoint takes; `cancel` awaits the backend piece */
export type FriendAction =
  'request' | 'accept' | 'decline' | 'remove' | 'cancel';

/** a row of `friends` — an accepted friendship, from their wallet */
export interface FriendSummary {
  username: string;
  displayName: string;
  /**
   * Always false from the Lambda. It answers this from the live socket room
   * map on the Express server, and a Lambda cannot see that memory — so a
   * friend who is playing right now still reads as offline.
   */
  online: boolean;
  points: number;
  currentStreak: number;
  wins: number;
}

/** a friendship that is not (yet) accepted, in either direction */
export interface FriendRequestEntry {
  username: string;
  /** falls back to the username, which is all the current endpoint sends */
  displayName: string;
  status: FriendshipStatus;
  /** epoch ms, when the server keeps one */
  createdAt: number | null;
}

export interface FriendsSnapshot {
  friends: FriendSummary[];
  /** requests sent TO me, awaiting my accept or deny */
  incoming: FriendRequestEntry[];
  /** requests I sent — empty until the backend reports them */
  outgoing: FriendRequestEntry[];
  /**
   * Did the server actually answer with an `outgoing` array?
   *
   * The distinction matters: "no outgoing requests" and "this server cannot
   * tell you about outgoing requests" are different facts, and a UI that
   * conflates them shows an empty panel that looks like an answer.
   */
  outgoingSupported: boolean;
}

/**
 * Why an action was refused, as a value rather than a sentence.
 *
 * The endpoint answers 400 with English prose ("Already friends"), which is
 * server-internal wording and no use to a screen that is Serbian by default.
 * Matching it happens once, here, so a change of wording is one edit and not
 * a hunt through components.
 */
export type FriendActionError =
  | 'self'
  | 'not-found'
  | 'already-friends'
  | 'already-sent'
  | 'no-such-request'
  | 'unauthenticated'
  | 'failed'
  | 'unreachable';

export type FriendActionResult =
  | { ok: true; status: FriendshipStatus | 'removed' | 'cancelled' }
  | { ok: false; reason: FriendActionError };

function toEntry(raw: unknown, fallbackStatus: FriendshipStatus) {
  // the current endpoint sends bare usernames; the object form is what the
  // status model needs, and both are read so neither release breaks the other
  if (typeof raw === 'string') {
    return raw
      ? {
          username: raw,
          displayName: raw,
          status: fallbackStatus,
          createdAt: null,
        }
      : null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const username = typeof r.username === 'string' ? r.username : '';
  if (!username) return null;
  const status = normalizeStatus(r.status) ?? fallbackStatus;
  return {
    username,
    displayName:
      typeof r.displayName === 'string' && r.displayName
        ? r.displayName
        : username,
    status,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : null,
  };
}

/** `sent` and `declined` are the verbs the endpoint answers in; these are the states */
function normalizeStatus(raw: unknown): FriendshipStatus | null {
  if (raw === 'pending' || raw === 'sent') return 'pending';
  if (raw === 'accepted') return 'accepted';
  if (raw === 'denied' || raw === 'declined') return 'denied';
  return null;
}

function errorFor(status: number, message: string): FriendActionError {
  if (status === 401) return 'unauthenticated';
  if (message === "That's you") return 'self';
  if (message === 'User not found') return 'not-found';
  if (message === 'Already friends') return 'already-friends';
  if (message === 'Request already sent') return 'already-sent';
  if (message === 'No such request') return 'no-such-request';
  return 'failed';
}

/** The whole social graph as this player can see it. null = could not load. */
export async function fetchFriends(): Promise<FriendsSnapshot | null> {
  try {
    const res = await apiFetch('/friends/list');
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data) return null;

    const rawOutgoing = data.outgoing;
    return {
      friends: Array.isArray(data.friends)
        ? (data.friends as FriendSummary[])
        : [],
      incoming: (Array.isArray(data.requests) ? data.requests : [])
        .map((r: unknown) => toEntry(r, 'pending'))
        .filter(Boolean) as FriendRequestEntry[],
      outgoing: (Array.isArray(rawOutgoing) ? rawOutgoing : [])
        .map((r: unknown) => toEntry(r, 'pending'))
        .filter(Boolean) as FriendRequestEntry[],
      outgoingSupported: Array.isArray(rawOutgoing),
    };
  } catch {
    return null;
  }
}

/**
 * Send, accept, deny, cancel or remove — the one write this API has.
 *
 * `request` can legitimately answer `accepted`: if the target had already
 * asked you, the server takes your request as taking them up on it, which is
 * how the both-sent-at-once case resolves without either side being told to
 * try again. Callers have to handle that, so it is a status and not an error.
 */
export async function friendAction(
  target: string,
  action: FriendAction
): Promise<FriendActionResult> {
  const name = target.trim();
  if (!name) return { ok: false, reason: 'failed' };

  try {
    const res = await apiFetch('/friends/action', {
      body: { target: name, action },
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = typeof data?.message === 'string' ? data.message : '';
      return { ok: false, reason: errorFor(res.status, message) };
    }

    const raw = data?.status;
    if (raw === 'removed') return { ok: true, status: 'removed' };
    if (raw === 'cancelled' || raw === 'canceled') {
      return { ok: true, status: 'cancelled' };
    }
    const status = normalizeStatus(raw);
    // an ok response with an unreadable status still succeeded; report the
    // state the action asked for rather than inventing a failure
    if (status) return { ok: true, status };
    return {
      ok: true,
      status: action === 'accept' ? 'accepted' : 'pending',
    };
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}
