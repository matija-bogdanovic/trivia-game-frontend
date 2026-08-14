'use client';

import { useState } from 'react';
import { leaderboard, rankBadges } from '@/app/(arena)/_mock/players';

type Tab = 'global' | 'weekly' | 'monthly' | 'friends';

export default function Page() {
  // NOTE: carried over from the design — all four tabs render the same list.
  // See the P3 report.
  const [tab, setTab] = useState<Tab>('global');

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-arena-200 text-[10px] tracking-[0.25em] uppercase mb-1">
          Competition
        </div>
        <h1 className="text-3xl font-bold tracking-wide">LEADERBOARDS</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8">
        {(['global', 'weekly', 'monthly', 'friends'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-[11px] tracking-[0.2em] uppercase font-bold border transition-colors ${
              tab === t
                ? 'bg-gold text-arena-950 border-gold'
                : 'border-white/10 text-arena-200 hover:border-arena-300 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Top 3 podium — laid out 2nd, 1st, 3rd */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {leaderboard.slice(0, 3).map((_, i) => {
          const sizes = ['text-4xl', 'text-3xl', 'text-2xl'];
          const avatarSizes = [
            'w-16 h-16 text-2xl',
            'w-12 h-12 text-xl',
            'w-10 h-10 text-lg',
          ];
          const order = [1, 0, 2];
          const p = leaderboard[order[i]];
          return (
            <div
              key={p.name}
              className={`bg-arena-800 border p-6 text-center ${
                order[i] === 0 ? 'border-gold/40' : 'border-white/[0.07]'
              }`}
            >
              <div
                className={`mx-auto mb-3 flex items-center justify-center font-bold ${avatarSizes[order[i]]} ${
                  order[i] === 0
                    ? 'bg-gold text-arena-950'
                    : 'bg-arena-600 text-white'
                }`}
              >
                {p.initial}
              </div>
              <div
                className={`font-bold mb-1 ${order[i] === 0 ? 'text-gold text-lg' : 'text-white'}`}
              >
                {p.name}
              </div>
              <div
                className={`font-bold mb-2 ${sizes[order[i]]} ${order[i] === 0 ? 'text-gold' : 'text-arena-300'}`}
              >
                {rankBadges[p.rank]}
              </div>
              <div className="text-white font-bold">{p.wins} wins</div>
              <div className="text-arena-200 text-[10px] mt-1">
                🔥 {p.streak} streak
              </div>
            </div>
          );
        })}
      </div>

      {/* Full table */}
      <div className="bg-arena-800 border border-white/[0.07]">
        <div className="grid grid-cols-[40px_1fr_80px_60px_60px_100px] gap-4 px-5 py-3 border-b border-white/[0.07] text-arena-300 text-[10px] tracking-[0.2em] uppercase">
          <span>#</span>
          <span>Player</span>
          <span>Streak</span>
          <span>Wins</span>
          <span>Rate</span>
          <span className="text-right">Money Won</span>
        </div>
        {leaderboard.map((player) => (
          <div
            key={player.name}
            className={`grid grid-cols-[40px_1fr_80px_60px_60px_100px] gap-4 px-5 py-4 border-b border-white/[0.05] items-center transition-colors ${
              player.isYou
                ? 'bg-gold/10 border-l-2 border-l-gold'
                : 'hover:bg-arena-750'
            }`}
          >
            <div
              className={`font-bold ${player.rank <= 3 ? 'text-gold' : 'text-arena-400'}`}
            >
              {rankBadges[player.rank] || player.rank}
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 flex items-center justify-center font-bold text-sm ${
                  player.rank === 1
                    ? 'bg-gold text-arena-950'
                    : 'bg-arena-600 text-white'
                }`}
              >
                {player.initial}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">
                    {player.name}
                  </span>
                  {player.isYou && (
                    <span className="text-[9px] tracking-widest text-arena-300 border border-arena-400 px-1.5">
                      YOU
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-gold font-bold text-sm">
              🔥 {player.streak}
            </div>
            <div className="text-white font-bold text-sm">{player.wins}</div>
            <div className="text-arena-200 text-sm">{player.rate}</div>
            <div className="text-gold font-bold text-sm text-right">
              ${player.money.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Your position callout */}
      <div className="mt-4 bg-gold/10 border border-gold/20 px-5 py-3 flex items-center gap-4">
        <div className="text-gold text-[10px] tracking-widest uppercase">
          Your Position
        </div>
        <div className="text-white font-bold">Rank #7</div>
        <div className="text-arena-200 text-[11px]">· 54 wins from top 3</div>
      </div>
    </div>
  );
}
