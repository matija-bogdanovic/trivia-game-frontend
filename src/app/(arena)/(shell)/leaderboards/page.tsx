'use client';

import { useEffect, useMemo, useState } from 'react';
import Avatar from '@/app/(arena)/_components/avatar';
import { useT } from '@/app/lib/i18n';
import PageHeader from '@/app/(arena)/_components/page_header';
import { rankBadges } from '@/app/(arena)/_lib/rank_badges';
import { apiFetch } from '@/app/helpers/api';
import { getPort } from '@/app/helpers/port';
import { useWallet } from '@/app/(arena)/_data/use_wallet';

type Tab = 'global' | 'weekly' | 'monthly' | 'friends';
const TABS: Tab[] = ['global', 'weekly', 'monthly', 'friends'];

/** Podium tile sizes, keyed by finishing place rather than array position. */
const PODIUM_AVATAR: Record<number, 'lg' | 'md' | 'sm'> = {
  1: 'lg',
  2: 'md',
  3: 'sm',
};
const PODIUM_BADGE: Record<number, string> = {
  1: 'text-4xl',
  2: 'text-3xl',
  3: 'text-2xl',
};

const badgeFor = (rank: number) => rankBadges[rank] ?? String(rank);

/** What GET /leaderboard returns for each player. */
interface LeaderboardApiRow {
  username: string;
  displayName: string;
  wins: number;
  gamesPlayed: number;
  /**
   * The shop balance — 25 a game plus 100 a win. NOT money won at the table,
   * which nothing on this endpoint reports. It used to be printed under a
   * "Money Won" heading, which made every figure in that column wrong.
   */
  coins: number;
  /** what the standings are actually ordered by */
  points: number;
  currentStreak: number;
  bestStreak: number;
}

/** A row of POST /friends/list — no gamesPlayed, so no win rate. */
interface FriendApiRow {
  username: string;
  displayName: string;
  online: boolean;
  points: number;
  currentStreak: number;
  wins: number;
}

interface Row {
  rank: number;
  username: string;
  name: string;
  initial: string;
  streak: number;
  wins: number;
  points: number;
  rate: string;
  isYou: boolean;
}

/**
 * The order the standings are in: points, then wins.
 *
 * The same two keys the server sorts by, applied again here because the server
 * leaves players who match on both in DynamoDB scan order — which is not
 * stable between calls, so a table of tied players visibly reshuffled on every
 * load. The username breaks the last tie and settles it.
 */
const byStanding = (a: LeaderboardApiRow, b: LeaderboardApiRow) =>
  b.points - a.points ||
  b.wins - a.wins ||
  a.username.localeCompare(b.username);

/** Two players are level when both sort keys match — the username is only a
 *  tiebreak for display order and must not separate their ranks. */
const level = (a: LeaderboardApiRow, b: LeaderboardApiRow) =>
  a.points === b.points && a.wins === b.wins;

/**
 * Rank and format the standings.
 *
 * Standard competition ranking: players who are level share a place and the
 * next one skips it — 1, 2, 2, 4. Numbering by array position, as this did
 * before, handed three players tied on 25 points the places 2, 3 and 4 and
 * made an arbitrary scan order look like a result.
 */
const toRows = (api: LeaderboardApiRow[], me: string | null): Row[] => {
  const sorted = [...api].sort(byStanding);
  let rank = 0;
  return sorted.map((r, i) => {
    if (i === 0 || !level(r, sorted[i - 1])) rank = i + 1;
    return {
      rank,
      username: r.username,
      name: r.displayName || r.username,
      initial: (r.displayName || r.username).charAt(0).toUpperCase(),
      streak: r.currentStreak,
      wins: r.wins,
      points: r.points,
      rate: r.gamesPlayed
        ? `${Math.round((r.wins / r.gamesPlayed) * 100)}%`
        : '—',
      isYou: me !== null && r.username === me,
    };
  });
};

/**
 * Standings, translated from the Angular app's leaderboards screen.
 *
 * Two fixes it carries over the export: the tab strip set state nothing read,
 * so all four tabs showed the identical global table; and the "your position"
 * callout was the hardcoded string "Rank #7 · 54 wins from top 3" — wrong even
 * for the fixture it shipped with. Both are derived here.
 */
export default function Page() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>('global');
  const [api, setApi] = useState<LeaderboardApiRow[]>([]);
  const [friends, setFriends] = useState<FriendApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  /** the standings could not be fetched — not the same as nobody having played */
  const [failed, setFailed] = useState(false);

  /*
   * The signed-in player's own record. The standings themselves are public and
   * need no session — this is here to mark YOU in the table, and to put you in
   * your own friends standings even when you are nowhere near the global top.
   */
  const { identity, wallet } = useWallet();
  const me = identity?.username ?? null;

  useEffect(() => {
    fetch(`${getPort()}/leaderboard`)
      .then((res) => {
        if (!res.ok) throw new Error(`leaderboard ${res.status}`);
        return res.json();
      })
      .then((d) => setApi(d.leaderboard ?? []))
      .catch((err) => {
        console.error('Loading the leaderboard failed:', err);
        setApi([]);
        setFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/friends/list');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setFriends((data.friends ?? []) as FriendApiRow[]);
      } catch {
        // the friends tab just stays empty
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me]);

  /**
   * The friends tab, from the friends themselves.
   *
   * It used to filter the global top 20 down to friends, so a friend who was
   * not in that 20 — most of them — simply did not exist on this screen, and
   * the stats already fetched from /friends/list went unused. The friend list
   * is the source now; the global row is merged in where there is one, because
   * only it carries gamesPlayed and therefore the win rate.
   */
  const friendStandings = useMemo(() => {
    const global = new Map(api.map((r) => [r.username, r]));
    const rows = new Map<string, LeaderboardApiRow>();
    for (const f of friends) {
      rows.set(
        f.username,
        global.get(f.username) ?? {
          username: f.username,
          displayName: f.displayName,
          wins: f.wins,
          gamesPlayed: 0,
          coins: 0,
          points: f.points,
          currentStreak: f.currentStreak,
          bestStreak: 0,
        }
      );
    }
    /*
     * And you, whose own standing is not in either list unless you happen to
     * be in the global top 20. The wallet is the same record /leaderboard
     * scans, so a row built from it carries the same numbers that endpoint
     * would have reported — including gamesPlayed, so your win rate is a
     * figure and not a dash.
     */
    if (me) {
      const mine =
        global.get(me) ??
        (wallet && {
          username: me,
          displayName: identity?.displayName || me,
          wins: wallet.wins,
          gamesPlayed: wallet.gamesPlayed,
          coins: wallet.coins,
          points: wallet.points,
          currentStreak: wallet.currentStreak,
          bestStreak: wallet.bestStreak,
        });
      if (mine) rows.set(me, mine);
    }
    return [...rows.values()];
  }, [api, friends, me, wallet, identity]);

  const rows = useMemo(() => {
    // the backend keeps one all-time table; weekly and monthly have no
    // endpoint yet and say so rather than showing the global rows twice
    if (tab === 'weekly' || tab === 'monthly') return [];
    // ranked within the friends set, so the places read 1..n and not the
    // holes left by everyone else in the global table
    if (tab === 'friends') return toRows(friendStandings, me);
    return toRows(api, me);
  }, [tab, api, me, friendStandings]);

  /**
   * Second, first, third — the order a podium is read in.
   *
   * By rank rather than by row, so a tie for first puts both players on a
   * first-place tile instead of demoting one of them to second.
   */
  const podium = useMemo(() => {
    const [first, second, third] = rows;
    return [
      { row: second, place: second?.rank ?? 2 },
      { row: first, place: first?.rank ?? 1 },
      { row: third, place: third?.rank ?? 3 },
    ].filter((slot) => !!slot.row && slot.place <= 3);
  }, [rows]);

  const you = rows.find((r) => r.isYou) ?? null;
  /**
   * How far off the podium you are, in the currency the table is ranked in.
   *
   * This subtracted *wins* while the standings run on points, so someone fifth
   * with more wins than the player in third got "0", which the callout then
   * read as "on the podium". The gap is measured against the last player
   * actually holding a top-three place, which with a tie is not row three.
   */
  const podiumLast = [...rows].reverse().find((r) => r.rank <= 3) ?? null;
  const onPodium = !!you && you.rank <= 3;
  const pointsFromPodium =
    !you || !podiumLast || onPodium
      ? 0
      : Math.max(0, podiumLast.points - you.points);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow={t('arena.lb.eyebrow')} title={t('arena.lb.title')} />

      {/* ============================================================= tabs */}
      <div
        className="mb-8 flex flex-wrap gap-1"
        role="tablist"
        aria-label={t('arena.lb.period')}
      >
        {TABS.map((tabName) => (
          <button
            key={tabName}
            type="button"
            role="tab"
            aria-selected={tab === tabName}
            onClick={() => setTab(tabName)}
            className={`cursor-pointer border px-5 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:px-6 ${
              tab === tabName
                ? 'border-gold bg-gold text-arena-950'
                : 'border-white/10 text-arena-200 hover:border-arena-300 hover:text-white'
            }`}
          >
            {t(`arena.lb.${tabName}`)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-16 text-center text-[11px] tracking-wider text-arena-300 uppercase">
          {t('arena.common.loading')}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="py-16 text-center text-arena-300">
          <div className="mb-4 text-4xl" aria-hidden="true">
            ◎
          </div>
          <div className="text-sm tracking-wider uppercase">
            {tab === 'weekly' || tab === 'monthly'
              ? t('arena.lb.unavailable')
              : failed
                ? t('arena.lb.failed')
                : t('arena.lb.empty')}
          </div>
        </div>
      )}

      {/* =========================================================== podium */}
      {rows.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {podium.map((slot) => (
            <div
              key={slot.row.username}
              className={`border bg-arena-800 p-6 text-center ${
                slot.place === 1 ? 'border-gold/40' : 'border-white/[0.07]'
              }`}
            >
              <div className="mb-3 flex justify-center">
                <Avatar
                  initial={slot.row.initial}
                  username={slot.row.username}
                  alt={slot.row.name}
                  size={PODIUM_AVATAR[slot.place] ?? 'sm'}
                  accent={slot.place === 1}
                />
              </div>
              <div
                className={`mb-1 font-bold ${slot.place === 1 ? 'text-lg text-gold' : 'text-white'}`}
              >
                {slot.row.name}
              </div>
              <div
                className={`mb-2 font-bold ${PODIUM_BADGE[slot.place] ?? 'text-2xl'} ${
                  slot.place === 1 ? 'text-gold' : 'text-arena-300'
                }`}
                aria-hidden="true"
              >
                {badgeFor(slot.place)}
              </div>
              {/* points first: it is what put them on this tile */}
              <div className="font-bold text-white tabular-nums">
                {t('arena.lb.pointsCount', { n: slot.row.points })}
              </div>
              <div className="mt-1 text-[10px] text-arena-200">
                {t('arena.lb.winsCount', { n: slot.row.wins })} · 🔥{' '}
                {t('arena.lb.streakCount', { n: slot.row.streak })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto border border-white/[0.07] bg-arena-800">
          <div className="min-w-[42rem]">
            <div className="grid grid-cols-[40px_1fr_80px_60px_60px_100px] gap-4 border-b border-white/[0.07] px-5 py-3 text-[10px] tracking-[0.2em] text-arena-300 uppercase">
              <span>#</span>
              <span>{t('arena.lb.player')}</span>
              <span>{t('arena.lb.streak')}</span>
              <span>{t('arena.lb.wins')}</span>
              <span>{t('arena.lb.rate')}</span>
              <span className="text-right">{t('arena.lb.points')}</span>
            </div>

            {rows.map((row) => (
              <div
                key={row.username}
                className={`grid grid-cols-[40px_1fr_80px_60px_60px_100px] items-center gap-4 border-b border-white/[0.05] px-5 py-4 transition-colors ${
                  row.isYou
                    ? 'border-l-2 border-l-gold bg-gold/10'
                    : 'hover:bg-arena-750'
                }`}
              >
                <div
                  className={`font-bold ${row.rank <= 3 ? 'text-gold' : 'text-arena-400'}`}
                >
                  {badgeFor(row.rank)}
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    initial={row.initial}
                    username={row.username}
                    alt={row.name}
                    size="xs"
                    accent={row.rank === 1}
                  />
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-bold text-white">
                      {row.name}
                    </span>
                    {row.isYou && (
                      <span className="shrink-0 border border-arena-400 px-1.5 text-[9px] tracking-widest text-arena-300">
                        {t('arena.common.you')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm font-bold text-gold">
                  🔥 {row.streak}
                </div>
                <div className="text-sm font-bold text-white tabular-nums">
                  {row.wins}
                </div>
                <div className="text-sm text-arena-200">{row.rate}</div>
                <div className="text-right text-sm font-bold text-gold tabular-nums">
                  {row.points.toLocaleString('en-US')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== your position */}
      {you && (
        <div
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border border-gold/20 bg-gold/10 px-5 py-3"
          aria-live="polite"
        >
          <div className="text-[10px] tracking-widest text-gold uppercase">
            {t('arena.lb.yourPosition')}
          </div>
          <div className="font-bold text-white">
            {t('arena.lb.rank', { n: you.rank })}
          </div>
          <div className="text-[11px] text-arena-200">
            {onPodium
              ? t('arena.lb.onPodium')
              : t('arena.lb.fromPodium', { n: pointsFromPodium })}
          </div>
        </div>
      )}
    </div>
  );
}
