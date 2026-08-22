'use client';

import { useMemo, useState } from 'react';
import PageHeader from '@/app/(arena)/_components/page_header';
import Avatar from '@/app/(arena)/_components/avatar';
import { useT } from '@/app/lib/i18n';
import { money } from '@/app/(arena)/_lib/money';
import { playedAtLabel } from '@/app/(arena)/_lib/match_time';
import { useWallet } from '@/app/(arena)/_data/use_wallet';
import {
  useMatchDetail,
  type MatchRecord,
} from '@/app/(arena)/_data/use_match_detail';
import { Skeleton, SkeletonRegion } from '@/app/(arena)/_components/skeleton';

type HistoryFilter = 'all' | 'wins' | 'losses';

const FILTERS: { value: HistoryFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'arena.history.all' },
  { value: 'wins', labelKey: 'arena.history.wins' },
  { value: 'losses', labelKey: 'arena.history.losses' },
];

/** `12m 40s` — matches run in minutes, so the hour is never worth a slot. */
function durationLabel(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, '0')}s`;
}

/**
 * Match history, from the wallet.
 *
 * The row itself is drawn entirely from `wallet.matchHistory` — the trimmed
 * per-player copy the server writes when a game ends. It carries the result,
 * the placement, the money and the room, but nothing about the other players.
 * Those come from POST /matches/detail, fetched only when a row is opened, so
 * a history of twenty matches is still one request on arrival.
 *
 * The design's category, difficulty and per-question counters are not tracked
 * by the backend at all; the expanded row shows what a match record does hold
 * — how long it ran, how many rounds, and the final standings.
 */
export default function Page() {
  const { t, lang } = useT();
  const { identity, wallet, loading, signedIn } = useWallet();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { state: detail, retry } = useMatchDetail(expandedId);

  const history = useMemo(() => wallet?.matchHistory ?? [], [wallet]);

  const matches = useMemo(
    () =>
      history.filter((m) => {
        if (filter === 'wins') return m.won;
        if (filter === 'losses') return !m.won;
        return true;
      }),
    [history, filter]
  );

  const changeFilter = (next: HistoryFilter) => {
    setFilter(next);
    // a row expanded under the old filter may not be on screen any more
    setExpandedId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow={t('arena.history.eyebrow')}
        title={t('arena.history.title')}
      />

      {/* =========================================================== filter */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div
          className="flex flex-wrap gap-3"
          role="group"
          aria-label={t('arena.history.filter')}
        >
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeFilter(option.value)}
              aria-pressed={filter === option.value}
              className={`cursor-pointer border px-5 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                filter === option.value
                  ? 'border-gold bg-gold text-arena-950'
                  : 'border-white/10 text-arena-200 hover:border-arena-300 hover:text-white'
              }`}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
        <div
          className="ml-auto text-[11px] tracking-wider text-arena-300 tabular-nums"
          aria-live="polite"
        >
          {t('arena.history.count', { n: matches.length })}
        </div>
      </div>

      {/* collapsed match rows, at the height the real ones open at */}
      {loading && (
        <SkeletonRegion className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-3 border border-white/[0.07] bg-arena-800 p-4 sm:flex-nowrap sm:gap-4 sm:p-5"
            >
              <Skeleton className="h-12 w-2 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-28" />
              </div>
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-12" />
            </div>
          ))}
        </SkeletonRegion>
      )}

      {/*
        Four different nothings, and they are not interchangeable: no session,
        a wallet that would not load, no matches ever, and none under this
        filter. A fresh account hits the third — it gets the empty state, never
        an empty list frame, and never "no matches" for a failed request.
      */}
      {!loading && !signedIn && (
        <div className="py-16 text-center text-arena-300">
          <div className="mb-4 text-4xl" aria-hidden="true">
            ◎
          </div>
          <div className="text-sm tracking-wider uppercase">
            {t('arena.common.signInPrompt')}
          </div>
        </div>
      )}

      {!loading && signedIn && !wallet && (
        <div className="py-16 text-center text-[11px] tracking-wider text-arena-300 uppercase">
          {t('arena.history.failed')}
        </div>
      )}

      {!loading && signedIn && wallet && history.length === 0 && (
        <div className="py-16 text-center text-arena-300">
          <div className="mb-4 text-4xl" aria-hidden="true">
            ◎
          </div>
          <div className="text-sm tracking-wider uppercase">
            {t('arena.history.empty')}
          </div>
          <p className="mt-2 text-[11px] text-arena-300">
            {t('arena.history.emptyHint')}
          </p>
        </div>
      )}

      {!loading && signedIn && history.length > 0 && matches.length === 0 && (
        <div className="py-16 text-center text-[11px] tracking-wider text-arena-300 uppercase">
          {t('arena.history.noneForFilter')}
        </div>
      )}

      {/* ========================================================== matches */}
      <div className="space-y-2">
        {matches.map((match) => {
          const expanded = expandedId === match.matchId;
          return (
            <div
              key={match.matchId}
              className="border border-white/[0.07] bg-arena-800"
            >
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : match.matchId)}
                aria-expanded={expanded}
                aria-controls={`match-detail-${match.matchId}`}
                className="flex w-full cursor-pointer flex-wrap items-center gap-3 p-4 text-left transition-colors hover:bg-arena-750 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:flex-nowrap sm:gap-4 sm:p-5"
              >
                <span
                  className={`h-12 w-2 shrink-0 ${match.won ? 'bg-gold' : 'bg-arena-400'}`}
                  aria-hidden="true"
                />

                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-bold text-white">
                      {match.roomName}
                    </span>
                    <span className="border border-arena-500 px-1.5 py-0.5 text-[9px] tracking-widest text-arena-300">
                      {t('arena.history.players', { n: match.playerCount })}
                    </span>
                  </span>
                  <span className="block text-[10px] tracking-wider text-arena-200">
                    {playedAtLabel(match.playedAt, lang)} ·{' '}
                    {t('arena.history.roundsPlayed', { n: match.roundsPlayed })}
                  </span>
                </span>

                <span className="shrink-0 text-right">
                  <span
                    className={`block font-bold ${match.won ? 'text-gold' : 'text-arena-300'}`}
                  >
                    {money(match.money)}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-arena-300">
                    {t('arena.history.place', { n: match.placement })}
                  </span>
                </span>

                <span
                  className={`ml-2 border px-3 py-1 text-[11px] font-bold tracking-widest uppercase ${
                    match.won
                      ? 'border-gold/40 text-gold'
                      : 'border-arena-400 text-arena-300'
                  }`}
                >
                  {match.won ? t('arena.history.win') : t('arena.history.loss')}
                </span>

                <span
                  className={`ml-2 text-[10px] text-arena-300 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                >
                  ▼
                </span>
              </button>

              {expanded && (
                <div
                  id={`match-detail-${match.matchId}`}
                  className="border-t border-white/[0.07] px-5 py-4"
                >
                  {/* the fact row and the standings list the body will fill */}
                  {detail.status === 'loading' && (
                    <SkeletonRegion className="space-y-4 py-2">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {Array.from({ length: 4 }, (_, i) => (
                          <div key={i} className="space-y-1.5">
                            <Skeleton className="h-2.5 w-14" />
                            <Skeleton className="h-3.5 w-16" />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {Array.from({ length: 3 }, (_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-3.5 w-6" />
                            <Skeleton className="h-3.5 w-32" />
                            <Skeleton className="ml-auto h-3.5 w-16" />
                          </div>
                        ))}
                      </div>
                    </SkeletonRegion>
                  )}

                  {detail.status === 'error' && (
                    <div className="flex flex-wrap items-center justify-center gap-3 py-4">
                      <span className="text-[11px] text-arena-200">
                        {t('arena.history.detailFailed')}
                      </span>
                      <button
                        type="button"
                        onClick={retry}
                        className="cursor-pointer border border-white/20 px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                      >
                        {t('arena.history.retry')}
                      </button>
                    </div>
                  )}

                  {detail.status === 'ok' && (
                    <MatchDetailBody
                      match={detail.match}
                      me={identity?.username ?? null}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The expanded row: what the match record holds, and who finished where. */
function MatchDetailBody({
  match,
  me,
}: {
  match: MatchRecord;
  me: string | null;
}) {
  const { t } = useT();
  const standings = [...match.standings].sort(
    (a, b) => a.placement - b.placement
  );

  const facts = [
    { key: 'arena.history.rounds', value: String(match.rounds) },
    { key: 'arena.history.duration', value: durationLabel(match.durationMs) },
    {
      key: 'arena.history.winner',
      value: match.winnerName || match.winner || '—',
    },
    { key: 'arena.history.margin', value: money(match.margin) },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.key}>
            <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
              {t(fact.key)}
            </div>
            <div className="truncate font-bold text-white tabular-nums">
              {fact.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 mb-2 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
        {t('arena.history.standings')}
      </div>
      <ul className="space-y-1">
        {standings.map((row) => {
          const name = row.displayName || row.username;
          const isYou = me !== null && row.username === me;
          return (
            <li
              key={row.username}
              className={`flex items-center gap-3 border-l-2 py-2 pl-3 ${
                row.placement === 1 ? 'border-gold' : 'border-white/[0.07]'
              }`}
            >
              <span
                className={`w-6 shrink-0 text-center text-xs font-bold tabular-nums ${
                  row.placement === 1 ? 'text-gold' : 'text-arena-300'
                }`}
              >
                {row.placement}
              </span>
              <Avatar
                initial={name.charAt(0).toUpperCase()}
                username={row.username}
                avatar={row.avatar}
                alt={name}
                size="xs"
                accent={row.placement === 1}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-white">
                  {name}
                  {isYou && (
                    <span className="ml-2 text-[9px] tracking-widest text-gold">
                      {t('arena.common.you')}
                    </span>
                  )}
                </span>
                <span className="block text-[10px] text-arena-300">
                  {t('arena.history.roundsPlayed', { n: row.roundsPlayed })}
                  {!row.survived && ` · ${t('arena.history.out')}`}
                </span>
              </span>
              <span
                className={`shrink-0 text-sm font-bold tabular-nums ${
                  row.placement === 1 ? 'text-gold' : 'text-arena-300'
                }`}
              >
                {money(row.money)}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}
