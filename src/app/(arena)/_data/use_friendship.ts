'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchFriends, friendAction } from '@/app/helpers/friends';

/**
 * Who you already know, and who you have already asked.
 *
 * Every screen that lists other players wants the same three answers — are we
 * friends, have I asked, and let me ask — and the lobby had grown its own copy
 * of all three. This is that copy, moved somewhere both it and the match
 * history can read, so the two cannot drift on what "already sent" means.
 *
 * ── FAILURE IS DELIBERATELY PERMISSIVE ─────────────────────────────────────
 * A failed fetch leaves both sets empty, which shows the button to everyone.
 * The server refuses a duplicate request anyway, so the worst case is one
 * wasted click — where hiding the button on a failed read would silently
 * remove a feature and look like the feature does not exist.
 *
 * ── OPTIMISTIC, WITH A REAL ROLLBACK ───────────────────────────────────────
 * The label flips on click and flips back if the server refuses, so a denial
 * never leaves a false "sent" standing. That matters more than it sounds:
 * "sent" is the one state the reader cannot check for themselves.
 */
export function useFriendship() {
  const [friends, setFriends] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    fetchFriends().then((snap) => {
      if (!live) return;
      if (snap) {
        setFriends(new Set(snap.friends.map((f) => f.username)));
        // somebody you have already asked is not somebody to ask again
        setRequested(new Set((snap.outgoing ?? []).map((o) => o.username)));
      }
      setLoaded(true);
    });
    return () => {
      live = false;
    };
  }, []);

  const addFriend = useCallback(async (target: string) => {
    setRequested((current) => new Set(current).add(target));
    const result = await friendAction(target, 'request');
    if (!result.ok) {
      /*
       * One refusal is NOT a rollback: "already sent" means the request is
       * genuinely outstanding, the server just knew before this screen did.
       * Putting the button back there would invite a second click that gets
       * the same answer.
       */
      if (result.reason === 'already-sent') return result;
      if (result.reason === 'already-friends') {
        setFriends((current) => new Set(current).add(target));
        return result;
      }
      setRequested((current) => {
        const next = new Set(current);
        next.delete(target);
        return next;
      });
    }
    return result;
  }, []);

  return {
    /** already an accepted friendship */
    isFriend: useCallback((u: string) => friends.has(u), [friends]),
    /** asked, and not yet answered */
    isRequested: useCallback((u: string) => requested.has(u), [requested]),
    addFriend,
    /** false until the first read settles, either way */
    loaded,
  };
}
