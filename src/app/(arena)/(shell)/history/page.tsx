'use client';

import { useState } from 'react';
import { historyMatches } from '@/app/(arena)/_mock/matches';

export default function Page() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'wins' | 'losses'>('all');

  const filtered = historyMatches.filter((m) => {
    if (filter === 'wins') return m.result === 'WIN';
    if (filter === 'losses') return m.result === 'LOSS';
    return true;
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-arena-200 text-[10px] tracking-[0.25em] uppercase mb-1">
          History
        </div>
        <h1 className="text-3xl font-bold tracking-wide">MATCH HISTORY</h1>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 mb-6">
        {(['all', 'wins', 'losses'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 border font-bold transition-colors ${
              filter === f
                ? 'bg-gold text-arena-950 border-gold'
                : 'border-white/10 text-arena-200 hover:border-arena-300 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All Matches' : f === 'wins' ? 'Wins' : 'Losses'}
          </button>
        ))}
        <div className="ml-auto text-arena-300 text-[11px] tracking-wider">
          {filtered.length} matches
        </div>
      </div>

      {/* Match list */}
      <div className="space-y-2">
        {filtered.map((match) => (
          <div
            key={match.id}
            className="bg-arena-800 border border-white/[0.07]"
          >
            <button
              onClick={() =>
                setExpanded(expanded === match.id ? null : match.id)
              }
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-arena-750 transition-colors"
            >
              <div
                className={`w-2 h-12 flex-shrink-0 ${match.result === 'WIN' ? 'bg-gold' : 'bg-arena-400'}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-white font-bold">
                    {match.players.join(' · ')}
                  </span>
                  <span className="text-[9px] tracking-widest text-arena-300 border border-arena-500 px-1.5 py-0.5">
                    {match.mode}
                  </span>
                </div>
                <div className="text-arena-200 text-[10px] tracking-wider">
                  {match.category} · {match.difficulty} · {match.date}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div
                  className={`font-bold ${match.result === 'WIN' ? 'text-gold' : 'text-arena-300'}`}
                >
                  {match.money}
                </div>
                <div className="text-arena-300 text-[10px] mt-0.5">
                  #{match.placement} Place
                </div>
              </div>
              <div
                className={`text-[11px] tracking-widest font-bold uppercase px-3 py-1 border ml-2 ${
                  match.result === 'WIN'
                    ? 'border-gold/40 text-gold'
                    : 'border-arena-400 text-arena-300'
                }`}
              >
                {match.result}
              </div>
              <div
                className={`text-arena-300 text-[10px] ml-2 transition-transform ${expanded === match.id ? 'rotate-180' : ''}`}
              >
                ▼
              </div>
            </button>

            {expanded === match.id && (
              <div className="border-t border-white/[0.07] px-5 py-4 grid grid-cols-4 gap-4">
                <StatCell
                  label="Correct Answers"
                  value={String(match.correct)}
                />
                <StatCell label="Wrong Answers" value={String(match.wrong)} />
                <StatCell label="Duels" value={String(match.duels)} />
                <StatCell label="Category" value={match.category} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-arena-300 text-[10px] tracking-widest uppercase mb-1">
        {label}
      </div>
      <div className="text-white font-bold">{value}</div>
    </div>
  );
}
