import Link from 'next/link';
import Avatar from '@/app/(arena)/_components/avatar';
import { money } from '@/app/(arena)/_lib/money';
import { rankings, yourPerformance } from '@/app/(arena)/_mock/results';

const MARKS = ['①', '②', '③', '④'];
const gained = (change: string) => change.startsWith('+');

export default function Page() {
  const winner = rankings[0];

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      {/* =========================================================== winner */}
      <section className="relative mb-8 overflow-hidden border border-gold/20 bg-arena-800 p-6 text-center sm:p-10">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5"
          aria-hidden="true"
        >
          <div className="text-[300px] leading-none font-bold text-gold">★</div>
        </div>
        <div className="relative">
          <div className="mb-4 text-[11px] tracking-[0.4em] text-gold uppercase">
            Victory
          </div>
          <div className="mb-4 flex justify-center">
            <Avatar initial={winner.initial} size="xl" accent />
          </div>
          <div className="mb-2 text-2xl font-bold tracking-widest text-white sm:text-4xl">
            {winner.name}
          </div>
          <div className="mb-4 text-[11px] tracking-[0.3em] text-gold uppercase">
            Winner
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 sm:gap-8">
            <div className="text-center">
              <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
                Final Balance
              </div>
              <div className="text-2xl font-bold text-gold tabular-nums sm:text-3xl">
                {money(winner.money)}
              </div>
            </div>
            <div className="h-12 w-px bg-white/10" aria-hidden="true" />
            <div className="text-center">
              <div className="mb-1 text-[10px] tracking-widest text-arena-300 uppercase">
                New Streak
              </div>
              <div className="text-2xl font-bold text-white sm:text-3xl">
                🔥 {winner.streak}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= rankings */}
      <section className="mb-8">
        <h2 className="mb-3 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
          Final Rankings
        </h2>
        <ol className="space-y-2">
          {rankings.map((row, i) => (
            <li
              key={row.name}
              className={`flex items-center gap-3 border p-4 sm:gap-4 ${
                row.isYou
                  ? 'border-gold/30 bg-gold/10'
                  : 'border-white/[0.07] bg-arena-800'
              }`}
            >
              <span
                className={`w-8 text-center text-xl font-bold ${i === 0 ? 'text-gold' : 'text-arena-400'}`}
                aria-hidden="true"
              >
                {MARKS[i]}
              </span>
              <Avatar initial={row.initial} size="md" accent={i === 0} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-bold text-white">
                    {row.name}
                  </span>
                  {row.isYou && (
                    <span className="border border-arena-400 px-1.5 text-[9px] tracking-widest text-arena-300">
                      YOU
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[10px] text-arena-200">
                  {row.correct} correct · {row.wrong} wrong · {row.duelsWon}{' '}
                  duels won
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
      <section className="mb-8 border border-white/[0.07] bg-arena-800 p-6">
        <h2 className="mb-5 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
          Your Performance
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {yourPerformance.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-1 text-2xl font-bold text-gold tabular-nums">
                {stat.value}
              </div>
              <div className="text-[10px] tracking-wider text-arena-300 uppercase">
                {stat.label}
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
          Play again
        </Link>
        <Link
          href="/home"
          className="border border-white/20 px-6 py-4 text-[11px] font-bold tracking-[0.15em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          Return to home
        </Link>
        <Link
          href="/rooms/create"
          className="border border-white/20 px-6 py-4 text-[11px] font-bold tracking-[0.15em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          Create new room
        </Link>
      </div>
    </div>
  );
}
