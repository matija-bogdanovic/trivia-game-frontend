'use client';

import Link from 'next/link';
import { useT } from '@/app/lib/i18n';
import Avatar from '@/app/(arena)/_components/avatar';
import { money } from '@/app/(arena)/_lib/money';
import { FlameIcon, StarIcon } from '@/app/(arena)/_components/icons';

/**
 * The end-of-match screen. Not a route — it is what a finished game looks
 * like, rendered inside the game at phase === 'gameover'.
 *
 * This is the arena Results design, kept intact. It used to be browsable at
 * /results with mock standings, which meant anyone could open a victory screen
 * for a match that never happened. It is not a place you can go; it is what a
 * finished game looks like.
 *
 * It takes its data as props, which is what let the mock fixtures be deleted
 * outright: the caller maps the final game_state roster onto ResultRow through
 * rankPlayers, so there is no fake data anywhere in the path.
 */

export interface ResultRow {
  name: string;
  initial: string;
  money: number;
  /** signed, pre-formatted delta, e.g. "+$740" */
  change: string;
  correct: number;
  wrong: number;
  betsWon: number;
  streak: number;
  isYou: boolean;
}

export interface PerformanceStat {
  /** i18n key, resolved here */
  labelKey: string;
  value: string;
}

const gained = (change: string) => change.startsWith('+');

export default function ArenaResults({
  /** finishing order, winner first */
  rankings,
  /** the "your performance" grid */
  yourPerformance,
}: {
  rankings: ResultRow[];
  yourPerformance: PerformanceStat[];
}) {
  const { t } = useT();
  const winner = rankings[0];
  if (!winner) return null;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      {/* =========================================================== winner */}
      <section className="relative mb-8 overflow-hidden rounded-lg border border-gold/20 bg-arena-800 p-6 text-center sm:p-10">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5"
          aria-hidden="true"
        >
          <StarIcon className="h-[300px] w-[300px] text-gold" />
        </div>
        <div className="relative">
          <div className="mb-4 text-[11px] tracking-[0.4em] text-gold uppercase">
            {t('arena.results.victory')}
          </div>
          <div className="mb-4 flex justify-center">
            <Avatar initial={winner.initial} size="xl" accent />
          </div>
          <div className="mb-2 text-2xl font-bold tracking-widest text-white sm:text-4xl">
            {winner.name}
          </div>
          <div className="mb-4 text-[11px] tracking-[0.3em] text-gold uppercase">
            {t('arena.results.winner')}
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 sm:gap-8">
            <div className="text-center">
              <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
                {t('arena.results.finalBalance')}
              </div>
              <div className="text-2xl font-bold text-gold tabular-nums sm:text-3xl">
                {money(winner.money)}
              </div>
            </div>
            <div className="h-12 w-px bg-white/10" aria-hidden="true" />
            <div className="text-center">
              <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
                {t('arena.results.newStreak')}
              </div>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-flame sm:text-3xl">
                <FlameIcon className="h-6 w-6 shrink-0" />
                {winner.streak}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= rankings */}
      <section className="mb-8">
        <h2 className="mb-3 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
          {t('arena.results.finalRankings')}
        </h2>
        <ol className="space-y-2">
          {rankings.map((row, i) => (
            <li
              key={row.name}
              className={`flex items-center gap-3 rounded-lg border p-4 sm:gap-4 ${
                row.isYou
                  ? 'border-gold/30 bg-gold/10'
                  : 'border-white/[0.07] bg-arena-800'
              }`}
            >
              {/*
                The place as a plain figure, matching the leaderboard podium.

                It was ① ② ③ ④ — enclosed numerals, and only four of them, so
                a room of five to eight (createRoom allows eight) rendered
                nothing at all for fifth place downward: MARKS[i] was simply
                undefined. A numeral has no such ceiling.

                NOT aria-hidden: the number is the information here, where a
                decorative symbol was not, and the row has nothing else that
                says which place it is.
              */}
              <span
                className={`w-8 text-center text-xl font-bold tabular-nums ${i === 0 ? 'text-gold' : 'text-arena-400'}`}
              >
                {i + 1}
              </span>
              <Avatar initial={row.initial} size="md" accent={i === 0} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-bold text-white">
                    {row.name}
                  </span>
                  {row.isYou && (
                    <span className="rounded-lg border border-arena-400 px-1.5 text-[9px] tracking-widest text-arena-300">
                      {t('arena.common.you')}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[10px] text-arena-200">
                  {t('arena.results.breakdown', {
                    correct: row.correct,
                    wrong: row.wrong,
                    bets: row.betsWon,
                  })}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-bold text-white tabular-nums">
                  {money(row.money)}
                </span>
                <span
                  className={`block text-[11px] font-bold ${gained(row.change) ? 'text-gold' : 'text-arena-300'}`}
                >
                  {row.change}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ==================================================== your numbers */}
      <section className="mb-8 rounded-lg border border-white/[0.07] bg-arena-800 p-6">
        <h2 className="mb-5 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
          {t('arena.results.yourPerformance')}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {yourPerformance.map((stat) => (
            <div key={stat.labelKey} className="text-center">
              <div className="mb-1 text-2xl font-bold text-gold tabular-nums">
                {stat.value}
              </div>
              <div className="text-[10px] tracking-wider text-arena-300 uppercase">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================= CTAs */}
      <div className="flex flex-wrap gap-3 sm:gap-4">
        <Link
          href="/rooms"
          className="bg-gold px-8 py-4 text-[11px] font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          {t('arena.results.playAgain')}
        </Link>
        <Link
          href="/home"
          className="rounded-lg border border-white/20 px-6 py-4 text-[11px] font-bold tracking-[0.15em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          {t('arena.results.returnHome')}
        </Link>
        <Link
          href="/rooms/create"
          className="rounded-lg border border-white/20 px-6 py-4 text-[11px] font-bold tracking-[0.15em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          {t('arena.results.createNew')}
        </Link>
      </div>
    </div>
  );
}
