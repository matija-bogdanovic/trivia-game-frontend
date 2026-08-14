'use client';

import { useState } from 'react';
import PageHeader from '@/app/(arena)/_components/page_header';
import { historyMatches } from '@/app/(arena)/_mock/matches';

type HistoryFilter = 'all' | 'wins' | 'losses';

const FILTERS: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: 'All Matches' },
  { value: 'wins', label: 'Wins' },
  { value: 'losses', label: 'Losses' },
];

/** Match list with its win/loss filter and the expanded row. */
export default function Page() {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const matches = historyMatches.filter((m) => {
    if (filter === 'wins') return m.result === 'WIN';
    if (filter === 'losses') return m.result === 'LOSS';
    return true;
  });

  const changeFilter = (next: HistoryFilter) => {
    setFilter(next);
    // a row expanded under the old filter may not be on screen any more
    setExpandedId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader eyebrow="History" title="MATCH HISTORY" />

      {/* =========================================================== filter */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div
          className="flex flex-wrap gap-3"
          role="group"
          aria-label="Filter matches"
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
              {option.label}
            </button>
          ))}
        </div>
        <div
          className="ml-auto text-[11px] tracking-wider text-arena-300 tabular-nums"
          aria-live="polite"
        >
          {matches.length} matches
        </div>
      </div>

      {/* ========================================================== matches */}
      <div className="space-y-2">
        {matches.map((match) => {
          const expanded = expandedId === match.id;
          return (
            <div
              key={match.id}
              className="border border-white/[0.07] bg-arena-800"
            >
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : match.id)}
                aria-expanded={expanded}
                aria-controls={`match-detail-${match.id}`}
                className="flex w-full cursor-pointer flex-wrap items-center gap-3 p-4 text-left transition-colors hover:bg-arena-750 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:flex-nowrap sm:gap-4 sm:p-5"
              >
                <span
                  className={`h-12 w-2 shrink-0 ${match.result === 'WIN' ? 'bg-gold' : 'bg-arena-400'}`}
                  aria-hidden="true"
                />

                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-bold text-white">
                      {match.players.join(' · ')}
                    </span>
                    <span className="border border-arena-500 px-1.5 py-0.5 text-[9px] tracking-widest text-arena-300">
                      {match.mode}
                    </span>
                  </span>
                  <span className="block text-[10px] tracking-wider text-arena-200">
                    {match.category} · {match.difficulty} · {match.date}
                  </span>
                </span>

                <span className="shrink-0 text-right">
                  <span
                    className={`block font-bold ${match.result === 'WIN' ? 'text-gold' : 'text-arena-300'}`}
                  >
                    {match.money}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-arena-300">
                    #{match.placement} Place
                  </span>
                </span>

                <span
                  className={`ml-2 border px-3 py-1 text-[11px] font-bold tracking-widest uppercase ${
                    match.result === 'WIN'
                      ? 'border-gold/40 text-gold'
                      : 'border-arena-400 text-arena-300'
                  }`}
                >
                  {match.result}
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
                  id={`match-detail-${match.id}`}
                  className="grid grid-cols-2 gap-4 border-t border-white/[0.07] px-5 py-4 sm:grid-cols-4"
                >
                  <div>
                    <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
                      Correct Answers
                    </div>
                    <div className="font-bold text-white tabular-nums">
                      {match.correct}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
                      Wrong Answers
                    </div>
                    <div className="font-bold text-white tabular-nums">
                      {match.wrong}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
                      Duels
                    </div>
                    <div className="font-bold text-white tabular-nums">
                      {match.duels}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
                      Category
                    </div>
                    <div className="font-bold text-white">{match.category}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
