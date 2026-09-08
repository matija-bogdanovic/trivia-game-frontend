'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/app/helpers/api';

/** One player's line in a finished match, as POST /matches/detail returns it. */
export interface MatchStanding {
  username: string;
  displayName: string;
  avatar: string | null;
  /** 1 = winner */
  placement: number;
  /** what they finished with */
  money: number;
  /** still had money when the match ended */
  survived: boolean;
  /** rounds they were still in the game for */
  roundsPlayed: number;
}

/**
 * The full record behind one history entry. The wallet keeps a trimmed copy of
 * this per player (MatchHistoryEntry); everything else — the standings, how
 * long it ran, who else was at the table — only exists here.
 */
export interface MatchRecord {
  match_id: string;
  lobbyId: string | null;
  roomName: string;
  code: number;
  /** epoch ms the match ended */
  playedAt: number;
  durationMs: number;
  /** total rounds the match ran */
  rounds: number;
  winner: string | null;
  winnerName: string | null;
  /** how far ahead of the runner-up the winner finished ($) */
  margin: number;
  standings: MatchStanding[];
  /** usernames, for cheap participation checks */
  participants: string[];
}

export type MatchDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; match: MatchRecord };

/**
 * The detail for whichever match is currently open, fetched on demand.
 *
 * Results are cached by match id for as long as the screen lives, so opening a
 * row you already looked at costs nothing. The server answers 403 for a match
 * you were not in and 404 for one it does not have — both read as "error"
 * here, because neither is something the player can act on differently.
 */
export function useMatchDetail(matchId: string | null): {
  state: MatchDetailState;
  retry: () => void;
} {
  const [cache, setCache] = useState<Record<string, MatchDetailState>>({});
  /** ids already asked for, so an open/collapse/open does not refetch */
  const requested = useRef<Set<string>>(new Set());
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(async (id: string) => {
    requested.current.add(id);
    setCache((c) => ({ ...c, [id]: { status: 'loading' } }));
    try {
      const res = await apiFetch('/matches/detail', { body: { matchId: id } });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { match: MatchRecord };
      if (!alive.current) return;
      setCache((c) => ({ ...c, [id]: { status: 'ok', match: data.match } }));
    } catch {
      if (!alive.current) return;
      // drop the guard so the retry button can ask again
      requested.current.delete(id);
      setCache((c) => ({ ...c, [id]: { status: 'error' } }));
    }
  }, []);

  useEffect(() => {
    if (!matchId || requested.current.has(matchId)) return;
    load(matchId);
  }, [matchId, load]);

  const retry = useCallback(() => {
    if (matchId) load(matchId);
  }, [matchId, load]);

  const state: MatchDetailState = matchId
    ? (cache[matchId] ?? { status: 'loading' })
    : { status: 'idle' };

  return { state, retry };
}
