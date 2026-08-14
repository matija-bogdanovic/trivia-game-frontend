import Link from 'next/link';
import { homeRecentMatches } from '@/app/(arena)/_mock/matches';
import { onlineFriends } from '@/app/(arena)/_mock/players';
import { achievements, homeStats } from '@/app/(arena)/_mock/progress';

/**
 * Dashboard, translated from the Angular app's home.html. Static there and
 * static here — data in, markup out.
 */
export default function Page() {
  /** The teaser row links through to the full achievements screen. */
  const teasers = achievements.slice(0, 4);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* ============================================================ stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {homeStats.map((stat) => (
          <div
            key={stat.label}
            className="border border-white/[0.07] bg-arena-800 p-5"
          >
            <div className="mb-2 text-[10px] tracking-[0.2em] text-arena-200 uppercase">
              {stat.label}
            </div>
            <div
              className={`text-2xl font-bold sm:text-3xl ${stat.accent ? 'text-gold' : 'text-white'}`}
            >
              {stat.value} {stat.suffix}
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================= hero */}
      <section
        className="relative overflow-hidden border border-white/[0.07] p-6 sm:p-10"
        style={{
          background:
            'linear-gradient(135deg, #0c1c0d 0%, #122513 60%, #162a18 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute top-0 right-0 bottom-0 hidden w-64 items-center justify-center opacity-5 sm:flex"
          aria-hidden="true"
        >
          <div className="text-[200px] leading-none font-bold text-gold">?</div>
        </div>
        <div className="relative">
          <div className="mb-3 text-xs tracking-[0.3em] text-arena-200 uppercase">
            Ready to compete?
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-wide text-white sm:text-5xl">
            TRIVIA DEATHMATCH
          </h1>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-arena-200">
            Bet your in-game money on every answer. Outsmart your opponents. Win
            the table.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link
              href="/rooms"
              className="bg-gold px-8 py-4 text-sm font-bold tracking-[0.2em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-800 focus-visible:outline-none sm:px-10"
            >
              ▶ Play now
            </Link>
            <Link
              href="/rooms/create"
              className="border border-white/20 px-6 py-4 text-sm font-bold tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:px-8"
            >
              Create room
            </Link>
            <Link
              href="/rooms/join"
              className="border border-white/20 px-6 py-4 text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:px-8"
            >
              Join room
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================ matches + friends */}
      <div className="grid gap-6 lg:grid-cols-5">
        <section className="space-y-3 lg:col-span-3">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[11px] tracking-[0.25em] text-arena-200 uppercase">
              Recent Matches
            </h2>
            <Link
              href="/history"
              className="text-[10px] tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              View all →
            </Link>
          </div>

          {homeRecentMatches.map((match) => (
            <Link
              key={match.id}
              href="/history"
              className="flex items-center gap-4 border border-white/[0.07] bg-arena-800 p-4 transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              <span
                className={`h-12 w-2 shrink-0 ${match.result === 'WIN' ? 'bg-gold' : 'bg-arena-400'}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="mb-0.5 block truncate text-sm font-bold text-white">
                  {match.players.join(' · ')}
                </span>
                <span className="block text-[10px] tracking-wider text-arena-200 uppercase">
                  {match.category} · {match.date}
                </span>
              </span>
              <span className="text-right">
                <span
                  className={`block text-sm font-bold ${match.result === 'WIN' ? 'text-gold' : 'text-arena-300'}`}
                >
                  {match.money}
                </span>
                <span className="block text-[10px] tracking-wider text-arena-200">
                  #{match.placement}
                </span>
              </span>
            </Link>
          ))}
        </section>

        <section className="space-y-3 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[11px] tracking-[0.25em] text-arena-200 uppercase">
              Friends Online
            </h2>
            <Link
              href="/friends"
              className="text-[10px] tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              All →
            </Link>
          </div>

          {onlineFriends.map((friend) => (
            <div
              key={friend.name}
              className="flex items-center gap-3 border border-white/[0.07] bg-arena-800 p-3"
            >
              <span className="relative">
                <span
                  className="flex h-9 w-9 items-center justify-center bg-arena-600 text-sm font-bold text-white"
                  aria-hidden="true"
                >
                  {friend.name[0]}
                </span>
                <span
                  className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-arena-800 ${friend.status === 'In Game' ? 'bg-gold' : 'bg-arena-300'}`}
                  aria-hidden="true"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-white">
                  {friend.name}
                </span>
                <span className="block text-[10px] text-arena-200">
                  {friend.status}
                </span>
              </span>
              {friend.streak > 0 && (
                <span className="text-[10px] font-bold text-gold">
                  🔥 {friend.streak}
                </span>
              )}
              <button
                type="button"
                className="cursor-pointer border border-arena-400 px-2 py-1 text-[10px] tracking-wider text-arena-200 uppercase transition-colors hover:border-arena-300 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                aria-label={`Invite ${friend.name}`}
              >
                Invite
              </button>
            </div>
          ))}
        </section>
      </div>

      {/* ===================================================== achievements */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] tracking-[0.25em] text-arena-200 uppercase">
            Recent Achievements
          </h2>
          <Link
            href="/achievements"
            className="text-[10px] tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {teasers.map((achievement) => (
            <div
              key={achievement.title}
              className={`border p-4 text-center ${
                achievement.unlocked
                  ? 'border-gold/20 bg-arena-800'
                  : 'border-white/[0.05] bg-arena-750 opacity-50'
              }`}
            >
              <div className="mb-2 text-2xl" aria-hidden="true">
                {achievement.icon}
              </div>
              <div
                className={`mb-1 text-xs font-bold ${achievement.unlocked ? 'text-gold' : 'text-arena-200'}`}
              >
                {achievement.title}
              </div>
              <div className="text-[10px] leading-tight text-arena-200">
                {achievement.description}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
