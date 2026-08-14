import Link from 'next/link';
import { medals, rankings, yourPerformance } from '@/app/(arena)/_mock/results';

export default function Page() {
  const winner = rankings[0];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Winner hero */}
      <div className="bg-g800 border border-gold/20 p-10 text-center mb-8 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <div className="text-[300px] font-bold text-gold leading-none">★</div>
        </div>
        <div className="relative">
          <div className="text-gold text-[11px] tracking-[0.4em] uppercase mb-4">
            Victory
          </div>
          <div className="w-20 h-20 bg-gold text-g950 flex items-center justify-center font-bold text-4xl mx-auto mb-4">
            {winner.initial}
          </div>
          <div className="text-white text-4xl font-bold tracking-widest mb-2">
            {winner.name}
          </div>
          <div className="text-gold text-[11px] tracking-[0.3em] uppercase mb-4">
            WINNER
          </div>
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="text-g300 text-[10px] tracking-widest uppercase mb-1">
                Final Balance
              </div>
              <div className="text-gold text-3xl font-bold">
                ${winner.money.toLocaleString()}
              </div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-g300 text-[10px] tracking-widest uppercase mb-1">
                New Streak
              </div>
              <div className="text-white text-3xl font-bold">
                🔥 {winner.streak}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="mb-8">
        <div className="text-g200 text-[10px] tracking-[0.25em] uppercase mb-3">
          Final Rankings
        </div>
        <div className="space-y-2">
          {rankings.map((player, i) => (
            <div
              key={player.name}
              className={`flex items-center gap-4 p-4 border ${
                player.isYou
                  ? 'bg-gold/10 border-gold/30'
                  : 'bg-g800 border-white/[0.07]'
              }`}
            >
              <div
                className={`text-xl font-bold w-8 text-center ${i === 0 ? 'text-gold' : 'text-g400'}`}
              >
                {medals[i]}
              </div>
              <div
                className={`w-10 h-10 flex items-center justify-center font-bold ${
                  i === 0 ? 'bg-gold text-g950' : 'bg-g600 text-white'
                }`}
              >
                {player.initial}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{player.name}</span>
                  {player.isYou && (
                    <span className="text-[9px] tracking-widest text-g300 border border-g400 px-1.5">
                      YOU
                    </span>
                  )}
                </div>
                <div className="text-g200 text-[10px] mt-0.5">
                  {player.correct} correct · {player.wrong} wrong ·{' '}
                  {player.duelsWon} duels won
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">
                  ${player.money.toLocaleString()}
                </div>
                <div
                  className={`text-[11px] font-bold ${player.change.startsWith('+') ? 'text-gold' : 'text-g300'}`}
                >
                  {player.change}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your stats */}
      <div className="bg-g800 border border-white/[0.07] p-6 mb-8">
        <div className="text-g200 text-[10px] tracking-[0.25em] uppercase mb-5">
          Your Performance
        </div>
        <div className="grid grid-cols-4 gap-4">
          {yourPerformance.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-gold mb-1">
                {stat.value}
              </div>
              <div className="text-g300 text-[10px] tracking-wider uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex gap-4">
        <Link
          href="/rooms"
          className="bg-gold text-g950 font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-4 hover:bg-gold-light transition-colors"
        >
          PLAY AGAIN
        </Link>
        <Link
          href="/home"
          className="border border-white/20 text-white font-bold text-[11px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-g700 transition-colors"
        >
          RETURN TO HOME
        </Link>
        <Link
          href="/rooms/create"
          className="border border-white/20 text-white font-bold text-[11px] tracking-[0.15em] uppercase px-6 py-4 hover:bg-g700 transition-colors"
        >
          CREATE NEW ROOM
        </Link>
      </div>
    </div>
  );
}
