'use client';

import { useEffect, useMemo, useState } from 'react';
import Avatar from '@/app/(arena)/_components/avatar';
import { useT } from '@/app/lib/i18n';
import PageHeader from '@/app/(arena)/_components/page_header';
import PlayerPreview, {
  type PlayerCard,
} from '@/app/(arena)/_components/player_preview';
import {
  FlameIcon,
  HashIcon,
  SmileyIcon,
  ClockIcon,
  VeteranIcon,
  UserCircleIcon,
} from '@/app/(arena)/_components/icons';
import { apiFetch } from '@/app/helpers/api';
import { getPort } from '@/app/helpers/port';
import { useWallet } from '@/app/(arena)/_data/use_wallet';
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonRegion,
} from '@/app/(arena)/_components/skeleton';

type Tab = 'global' | 'weekly' | 'monthly' | 'friends';
const TABS: Tab[] = ['global', 'weekly', 'monthly', 'friends'];

/** Podium tile sizes, keyed by finishing place rather than array position. */
const PODIUM_AVATAR: Record<number, 'lg' | 'md' | 'sm'> = {
  1: 'lg',
  2: 'md',
  3: 'sm',
};
/**
 * The medal grows with the place it marks.
 *
 * It was a trophy; the medal reads better at these sizes — a trophy's cup and
 * stem collapse into a blob by the time third place is down to 32px, where a
 * medallion is a disc and stays legible. Same vendored component the Veteran
 * achievement uses, imported rather than copied: one piece of art, one place
 * to change it.
 */
const PODIUM_MEDAL: Record<number, string> = {
  1: 'h-11 w-11',
  2: 'h-9 w-9',
  3: 'h-8 w-8',
};

/**
 * Gold, silver, bronze — and everyone else in the muted rank colour.
 *
 * All three used to be `text-gold`, so the podium was one colour and the only
 * thing separating first from third was position.
 */
const RANK_COLOR: Record<number, string> = {
  1: 'text-gold',
  2: 'text-silver',
  3: 'text-bronze',
};

const rankColor = (rank: number) => RANK_COLOR[rank] ?? 'text-arena-400';

/** the podium tile's edge, matching the place it holds */
const PODIUM_BORDER: Record<number, string> = {
  1: 'border-gold/40',
  2: 'border-silver/40',
  3: 'border-bronze/40',
};

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

/**
 * A table row as the overlay wants it.
 *
 * gamesPlayed and bestStreak are passed ONLY when they are real. The friends
 * tab fills both with 0 for anyone outside the global top 20, and "0 partija"
 * is a different claim from "the endpoint never told us" — PlayerCard omits
 * what it is not given, so leaving them off is how the card stays honest.
 */
const cardForRow = (row: Row): PlayerCard => ({
  username: row.username,
  displayName: row.name,
  points: row.points,
  wins: row.wins,
  currentStreak: row.streak,
  ...(row.gamesPlayed > 0 ? { gamesPlayed: row.gamesPlayed } : {}),
  ...(row.bestStreak > 0 ? { bestStreak: row.bestStreak } : {}),
});

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
  /*
   * Carried for the player card rather than for the table, which shows the
   * rate but not the count it came from, and no best streak at all. The
   * endpoint already sends both; dropping them here only meant the overlay
   * would have had to go without.
   */
  gamesPlayed: number;
  bestStreak: number;
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

/**
 * Rank and format the standings.
 *
 * ── ONE PLACE PER PLAYER ───────────────────────────────────────────────────
 * Position in the sorted list, so the column counts 1, 2, 3, 4 with no
 * repeats and no holes.
 *
 * This replaces standard competition ranking (1, 2, 2, 4), which was correct
 * by the book and wrong on the screen: the live table has two players on 25
 * points with one win each and two more on nothing at all, so it printed two
 * thirds and two fifths while fourth and sixth simply never appeared. A
 * reader does not see "these two are level", they see a table that lost count.
 *
 * What makes positional numbering safe here is that byStanding is TOTAL —
 * points, then wins, then username. Level players are still ordered the same
 * way on every load, so the row that shows 3rd today shows 3rd tomorrow. The
 * original objection to numbering by position was that it dressed up
 * DynamoDB's scan order as a result; with the username breaking the last tie,
 * there is no arbitrary order left to dress up.
 *
 * The cost, stated plainly: two players who are genuinely level now get
 * different numbers, and only the points and wins columns beside them reveal
 * that the gap between those numbers is nothing.
 */
const toRows = (api: LeaderboardApiRow[], me: string | null): Row[] => {
  const sorted = [...api].sort(byStanding);
  return sorted.map((r, i) => {
    return {
      rank: i + 1,
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
      gamesPlayed: r.gamesPlayed,
      bestStreak: r.bestStreak ?? 0,
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
  /** the player whose card is open; null is closed */
  const [preview, setPreview] = useState<PlayerCard | null>(null);
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
   * Second, first, third — the order a podium is read in, with the winner
   * raised in the middle.
   *
   * A row's rank IS its position now, so a tile's place is simply the rank of
   * the row on it; the reordering here is presentation, not arithmetic.
   */
  const podium = useMemo(() => {
    const [first, second, third] = rows;
    /*
     * Three slots, ALWAYS — the filter that used to drop the unfilled ones is
     * gone. A friends board with two people on it collapsed to two tiles in a
     * three-column grid, so second place sat under the heading and first place
     * wandered to the middle of a row with a hole beside it. A podium with a
     * gap in it reads as a layout that broke, not as a place nobody has taken.
     *
     * `row` is null for a slot nobody holds and the tile renders a placeholder.
     */
    return [
      { row: second ?? null, place: 2 },
      { row: first ?? null, place: 1 },
      { row: third ?? null, place: 3 },
    ];
  }, [rows]);

  const you = rows.find((r) => r.isYou) ?? null;
  /**
   * How far off the podium you are, in the currency the table is ranked in.
   *
   * This subtracted *wins* while the standings run on points, so someone fifth
   * with more wins than the player in third got "0", which the callout then
   * read as "on the podium". The gap is measured in points, against whoever
   * holds the last podium place.
   */
  const podiumLast = rows[2] ?? rows[rows.length - 1] ?? null;
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
            className={`cursor-pointer rounded-lg border px-5 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:px-6 ${
              tab === tabName
                ? 'border-gold bg-gold text-arena-950'
                : 'border-white/10 text-arena-200 hover:border-arena-300 hover:text-white'
            }`}
          >
            {t(`arena.lb.${tabName}`)}
          </button>
        ))}
      </div>

      {/*
        The standings, in outline: three podium tiles over a run of rows on the
        same six-column grid the real table uses. Sized to what is coming, so
        the page does not jump a screen's height when it arrives.
      */}
      {loading && (
        <SkeletonRegion>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[2, 1, 3].map((place) => (
              <div
                key={place}
                className="flex flex-col items-center rounded-lg border border-white/[0.07] bg-arena-800 p-6"
              >
                <SkeletonAvatar
                  size={place === 1 ? 'lg' : place === 2 ? 'md' : 'sm'}
                  className="mb-3"
                />
                <Skeleton className="mb-2 h-3.5 w-24" />
                <Skeleton className="mb-2 h-7 w-7" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/[0.07] bg-arena-800">
            <div className="min-w-[42rem]">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[40px_1fr_80px_60px_60px_100px] items-center gap-4 border-b border-white/[0.05] px-5 py-4"
                >
                  <Skeleton className="h-4 w-5" />
                  <div className="flex items-center gap-3">
                    <SkeletonAvatar size="xs" />
                    <Skeleton className="h-3.5 w-28" />
                  </div>
                  <Skeleton className="h-3.5 w-10" />
                  <Skeleton className="h-3.5 w-8" />
                  <Skeleton className="h-3.5 w-9" />
                  <Skeleton className="h-3.5 w-14 justify-self-end" />
                </div>
              ))}
            </div>
          </div>
        </SkeletonRegion>
      )}

      {!loading && rows.length === 0 && (
        <div className="py-16 text-center text-arena-300">
          {/*
            Two different nothings, and only one of them is a shortfall.

            An empty leaderboard is fine — nobody has played yet — so it keeps
            the neutral smiley. A weekly or monthly board is not empty, it is
            NOT BUILT: there is no endpoint behind either tab. A frown made
            that read as bad news about the standings; a clock says the right
            thing, which is "not yet".
          */}
          <div className="mb-4 flex justify-center" aria-hidden="true">
            {tab === 'weekly' || tab === 'monthly' ? (
              <ClockIcon className="h-10 w-10 text-arena-500" />
            ) : (
              <SmileyIcon className="h-10 w-10 text-arena-500" />
            )}
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
          {podium.map((slot) =>
            slot.row === null ? (
              /*
                An unclaimed place.
                
                Dashed and muted so it reads as an outline waiting to be filled
                rather than a player whose details failed to load — a solid
                tile in the medal colour with a dash in it would look like the
                third-place player's name had gone missing.
                
                It keeps the medal-sized trophy and the place number, because
                those belong to the SLOT rather than to whoever is standing in
                it, and dropping them would make the three tiles indistinguish-
                able from each other.
                
                The screen reader gets a full sentence — "still nobody in third
                place" — where the eye gets a dash. A lone "—" announced aloud
                is not information.
              */
              <div
                key={`empty-${slot.place}`}
                className="rounded-lg border border-dashed border-arena-500 p-6 text-center"
              >
                <div className="mb-3 flex justify-center">
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-full border border-dashed border-arena-500 text-arena-500 ${
                      slot.place === 1 ? 'h-12 w-12' : 'h-10 w-10'
                    }`}
                    aria-hidden="true"
                  >
                    <UserCircleIcon
                      className={slot.place === 1 ? 'h-7 w-7' : 'h-6 w-6'}
                    />
                  </span>
                </div>
                <div
                  className={`mb-1 font-bold text-arena-400 ${slot.place === 1 ? 'text-lg' : ''}`}
                >
                  {t('arena.lb.openSpot')}
                </div>
                <div className="mb-2 flex justify-center text-arena-500">
                  <VeteranIcon
                    className={PODIUM_MEDAL[slot.place] ?? 'h-7 w-7'}
                  />
                </div>
                <div className="font-bold text-arena-500">—</div>
                <span className="sr-only">
                  {t('arena.lb.openSpotSr', { n: slot.place })}
                </span>
              </div>
            ) : (
              <div
                key={slot.row.username}
                className={`rounded-lg border bg-arena-800 p-6 text-center ${
                  PODIUM_BORDER[slot.place] ?? 'border-white/[0.07]'
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
                  className={`mb-1 font-bold ${
                    slot.place === 1 ? 'text-lg' : ''
                  } ${slot.place <= 3 ? rankColor(slot.place) : 'text-white'}`}
                >
                  {slot.row.name}
                </div>
                {/*
                The place as a figure, in its medal colour. It was ★ ◆ ▲, all
                three in gold — so the tiles were told apart by size alone and
                second and third were the same colour as first.

                NOT aria-hidden any more: a number is the information, where a
                decorative symbol was not, and the tile has nothing else that
                says which place it is.
              */}
                <div
                  className={`mb-2 flex justify-center font-bold ${rankColor(slot.place)}`}
                >
                  <VeteranIcon
                    className={PODIUM_MEDAL[slot.place] ?? 'h-7 w-7'}
                  />
                  <span className="sr-only">
                    {t('arena.lb.rank', { n: slot.place })}
                  </span>
                </div>
                {/* points first: it is what put them on this tile */}
                <div className="font-bold text-white tabular-nums">
                  {t('arena.lb.pointsCount', { n: slot.row.points })}
                </div>
                {/*
                A streak of nought is not a streak, and "niz 0" was printing on
                every tile whose player simply has not won twice in a row —
                a flame, in the streak colour, next to the number saying there
                is nothing burning.

                The separator goes with it. It only exists to divide two facts,
                so leaving it behind would hang a stray dot after the wins.
              */}
                <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] text-arena-200">
                  <span>{t('arena.lb.winsCount', { n: slot.row.wins })}</span>
                  {slot.row.streak > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <FlameIcon className="h-3 w-3 shrink-0 text-flame" />
                      <span className="text-flame">
                        {t('arena.lb.streakCount', { n: slot.row.streak })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ============================================================ table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-white/[0.07] bg-arena-800">
          <div className="min-w-[42rem]">
            <div className="grid grid-cols-[40px_1fr_80px_60px_60px_100px] gap-4 border-b border-white/[0.07] px-5 py-3 text-[10px] tracking-[0.2em] text-arena-300 uppercase">
              <span className="flex items-center" title="#">
                <HashIcon className="h-3.5 w-3.5" />
                <span className="sr-only">#</span>
              </span>
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
                {/*
                  The number, always — a table is a place to count, and a
                  trophy in the first cell of a row broke the run of figures
                  that the eye follows down the column.

                  The medal colour stays on the top three: it marks them
                  without costing the reader the number, which the trophy did.
                  The trophy keeps its job on the podium tiles above, where
                  there is one per showcase rather than one per row.
                */}
                <div
                  className={`font-bold tabular-nums ${rankColor(row.rank)}`}
                >
                  {row.rank}
                </div>
                {/*
                  Avatar and name are one button. Opening a player is a look,
                  not a departure — a reader comparing four people down the
                  table should not lose the table to read one of them.
                */}
                <button
                  type="button"
                  onClick={() => setPreview(cardForRow(row))}
                  aria-label={t('arena.player.viewProfile', { name: row.name })}
                  className="flex min-w-0 cursor-pointer items-center gap-3 text-left focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
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
                      <span className="shrink-0 rounded-lg border border-arena-400 px-1.5 text-[9px] tracking-widest text-arena-300">
                        {t('arena.common.you')}
                      </span>
                    )}
                  </div>
                </button>
                {/*
                  A drawn flame in the streak colour, matching the profile.
                  It was a gold emoji, which put it in the same colour as the
                  points column and left its size to whatever font rendered
                  it.

                  Nought gets a dash rather than a lit flame beside a 0. Unlike
                  the podium tile this cell CANNOT simply vanish — it sits in a
                  grid under a "niz" heading, and an empty cell in a column of
                  numbers reads as data that failed to load rather than as a
                  player with no run going. The dash is a typographic
                  placeholder holding the column's shape, muted so a table of
                  mostly-streakless players is not a wall of flames.
                */}
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  {row.streak > 0 ? (
                    <>
                      <FlameIcon className="h-4 w-4 shrink-0 text-flame" />
                      <span className="tabular-nums text-flame">
                        {row.streak}
                      </span>
                    </>
                  ) : (
                    <span className="text-arena-400" aria-label="0">
                      —
                    </span>
                  )}
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
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-gold/20 bg-gold/10 px-5 py-3"
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

      <PlayerPreview player={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
