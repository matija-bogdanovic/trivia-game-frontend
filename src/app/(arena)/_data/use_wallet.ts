'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAvatarVersion } from '@/app/redux/slicers/avatar_slice';
import { setDisplayName } from '@/app/redux/slicers/profile_slice';
import type { AppDispatch } from '@/app/redux/store';
import { apiFetch } from '@/app/helpers/api';
import { getIdentity, type Identity } from '@/app/helpers/token_operations';

/**
 * One finished match as the wallet keeps it: the player's own slice of the
 * full match record, written when the game ends. Newest first, and only the
 * most recent handful — the server caps the list. Anything not here (who else
 * was at the table, how long it ran) comes from POST /matches/detail.
 */
export interface MatchHistoryEntry {
  matchId: string;
  /** epoch ms the match ended */
  playedAt: number;
  roomName: string;
  winner: string | null;
  winnerName: string | null;
  /** did this player win it */
  won: boolean;
  /** 1 = winner */
  placement: number;
  playerCount: number;
  /** how far ahead of the runner-up the winner finished ($) */
  margin: number;
  /** what this player finished with */
  money: number;
  /** rounds this player was in the game for */
  roundsPlayed: number;
}

/**
 * The signed-in player's wallet — the backend's record of who they are and how
 * they have played. POST /wallet derives the user from the bearer token, so
 * there is nothing to pass.
 */
export interface Wallet {
  credits: number;
  coins: number;
  avatar: string | null;
  wins: number;
  gamesPlayed: number;
  roundsPlayed: number;
  points: number;
  currentStreak: number;
  bestStreak: number;
  matchHistory?: MatchHistoryEntry[];
  achievements?: string[];
  nextCreditInMs?: number;
}

export interface WalletState {
  identity: Identity | null;
  wallet: Wallet | null;
  loading: boolean;
  /** false when there is no session — screens show a prompt, not an error */
  signedIn: boolean;
}

/**
 * Loads the identity and the wallet together, because every screen that wants
 * one wants the other: the name comes from Cognito, the numbers from the
 * backend. Failure is not thrown — a screen renders its empty state instead.
 */
export function useWallet(): WalletState {
  const dispatch = useDispatch<AppDispatch>();
  const [state, setState] = useState<WalletState>({
    identity: null,
    wallet: null,
    loading: true,
    signedIn: false,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const identity = await getIdentity();
      if (identity) dispatch(setDisplayName(identity.displayName));
      if (!identity) {
        if (!cancelled)
          setState({
            identity: null,
            wallet: null,
            loading: false,
            signedIn: false,
          });
        return;
      }
      try {
        /*
         * Send the Cognito `name` along. The pool is case-insensitive, so the
         * username Cognito stores is normalised to lower case and cannot be
         * changed — but `name` keeps whatever the player typed at signup. The
         * wallet's displayName defaults to null, and everything server-sourced
         * (leaderboard, friends, lobby players, in-game) falls back to the
         * normalised username when it is null. Syncing it here is what makes
         * those screens show the casing the player actually chose.
         */
        const res = await apiFetch('/wallet', {
          body: { displayName: identity.displayName },
        });
        const wallet = res.ok ? ((await res.json()) as Wallet) : null;
        if (cancelled) return;
        // whoever loads the wallet first seeds the avatar version for everyone
        dispatch(
          setAvatarVersion({
            username: identity.username,
            avatar: wallet?.avatar ?? null,
          })
        );
        setState({ identity, wallet, loading: false, signedIn: true });
      } catch {
        if (!cancelled)
          setState({ identity, wallet: null, loading: false, signedIn: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return state;
}
