'use client';

import { useMemo, useState } from 'react';
import Avatar from '@/app/(arena)/_components/avatar';
import PageHeader from '@/app/(arena)/_components/page_header';
import { money } from '@/app/(arena)/_lib/money';
import {
  friendNames,
  leaderboard,
  monthlyLeaderboard,
  rankBadges,
  weeklyLeaderboard,
  type LeaderboardEntry,
} from '@/app/(arena)/_mock/players';

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
/** Ranks follow position in the current table rather than the fixture. */
const ranked = (rows: LeaderboardEntry[]) =>
  rows.map((row, i) => ({ ...row, rank: i + 1 }));

/**
 * Standings, translated from the Angular app's leaderboards screen.
 *
 * Two fixes it carries over the export: the tab strip set state nothing read,
 * so all four tabs showed the identical global table; and the "your position"
 * callout was the hardcoded string "Rank #7 · 54 wins from top 3" — wrong even
 * for the fixture it shipped with. Both are derived here.
 */
export default function Page() {
  const [tab, setTab] = useState<Tab>('global');

  const rows = useMemo(() => {
    switch (tab) {
      case 'weekly':
        return ranked(weeklyLeaderboard);
      case 'monthly':
        return ranked(monthlyLeaderboard);
      case 'friends':
        return ranked(
          leaderboard.filter((r) => r.isYou || friendNames.has(r.name))
        );
      default:
        return ranked(leaderboard);
    }
  }, [tab]);

  /** Second, first, third — the order a podium is read in. */
  const podium = useMemo(() => {
    const [first, second, third] = rows;
    return [
      { row: second, place: 2 },
      { row: first, place: 1 },
      { row: third, place: 3 },
    ].filter((slot) => !!slot.row);
  }, [rows]);

  const you = rows.find((r) => r.isYou) ?? null;
  const third = rows[2];
  const winsFromPodium =
    !you || !third || you.rank <= 3 ? 0 : Math.max(0, third.wins - you.wins);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="Competition" title="LEADERBOARDS" />

      {/* ============================================================= tabs */}
      <div
        className="mb-8 flex flex-wrap gap-1"
        role="tablist"
        aria-label="Leaderboard period"
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`cursor-pointer border px-5 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:px-6 ${
              tab === t
                ? 'border-gold bg-gold text-arena-950'
                : 'border-white/10 text-arena-200 hover:border-arena-300 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* =========================================================== podium */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {podium.map((slot) => (
          <div
            key={slot.row.name}
            className={`border bg-arena-800 p-6 text-center ${
              slot.place === 1 ? 'border-gold/40' : 'border-white/[0.07]'
            }`}
          >
            <div className="mb-3 flex justify-center">
              <Avatar
                initial={slot.row.initial}
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
            <div className="font-bold text-white tabular-nums">
              {slot.row.wins} wins
            </div>
            <div className="mt-1 text-[10px] text-arena-200">
              🔥 {slot.row.streak} streak
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================ table */}
      <div className="overflow-x-auto border border-white/[0.07] bg-arena-800">
        <div className="min-w-[42rem]">
          <div className="grid grid-cols-[40px_1fr_80px_60px_60px_100px] gap-4 border-b border-white/[0.07] px-5 py-3 text-[10px] tracking-[0.2em] text-arena-300 uppercase">
            <span>#</span>
            <span>Player</span>
            <span>Streak</span>
            <span>Wins</span>
            <span>Rate</span>
            <span className="text-right">Money Won</span>
          </div>

          {rows.map((row) => (
            <div
              key={row.name}
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
                  size="xs"
                  accent={row.rank === 1}
                />
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-bold text-white">
                    {row.name}
                  </span>
                  {row.isYou && (
                    <span className="shrink-0 border border-arena-400 px-1.5 text-[9px] tracking-widest text-arena-300">
                      YOU
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm font-bold text-gold">🔥 {row.streak}</div>
              <div className="text-sm font-bold text-white tabular-nums">
                {row.wins}
              </div>
              <div className="text-sm text-arena-200">{row.rate}</div>
              <div className="text-right text-sm font-bold text-gold tabular-nums">
                {money(row.money)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================== your position */}
      {you && (
        <div
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border border-gold/20 bg-gold/10 px-5 py-3"
          aria-live="polite"
        >
          <div className="text-[10px] tracking-widest text-gold uppercase">
            Your Position
          </div>
          <div className="font-bold text-white">Rank #{you.rank}</div>
          <div className="text-[11px] text-arena-200">
            {winsFromPodium > 0
              ? `· ${winsFromPodium} wins from top 3`
              : '· on the podium'}
          </div>
        </div>
      )}
    </div>
  );
}
