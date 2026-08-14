import Link from 'next/link';
import Avatar from '@/app/(arena)/_components/avatar';
import { profileRecentMatches } from '@/app/(arena)/_mock/matches';
import {
  ME,
  achievements,
  categoryScores,
  profileStats,
} from '@/app/(arena)/_mock/progress';

/** Player profile. Static in the export and static here. */
export default function Page() {
  const badges = achievements.slice(0, 6);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* =========================================================== header */}
      <section className="flex flex-col items-start gap-6 border border-white/[0.07] bg-arena-800 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <Avatar initial={ME.initial} size="xl" accent />

        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            Player Profile
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-wide text-white sm:text-4xl">
            {ME.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <div className="text-[10px] tracking-widest text-arena-300 uppercase">
                Current Streak
              </div>
              <div className="text-2xl font-bold text-gold">
                🔥 {ME.streak} WINS
              </div>
            </div>
            <div
              className="hidden h-10 w-px bg-white/10 sm:block"
              aria-hidden="true"
            />
            <div className="text-sm text-arena-200">
              Member since {ME.memberSince}
            </div>
          </div>
        </div>

        <Link
          href="/settings"
          className="border border-white/20 px-5 py-3 text-[11px] tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          Edit profile
        </Link>
      </section>

      {/* ============================================================ stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {profileStats.map((stat) => (
          <div
            key={stat.label}
            className="border border-white/[0.07] bg-arena-800 p-4 text-center"
          >
            <div className="mb-1 text-2xl font-bold text-gold tabular-nums">
              {stat.value}
            </div>
            <div className="text-[9px] leading-tight tracking-[0.2em] text-arena-300 uppercase">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ================================================ category scores */}
        <section className="border border-white/[0.07] bg-arena-800 p-6">
          <h2 className="mb-5 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            Category Performance
          </h2>
          <div className="space-y-4">
            {categoryScores.map((category) => (
              <div key={category.name}>
                <div className="mb-1.5 flex justify-between text-[11px]">
                  <span className="text-white">{category.name}</span>
                  <span className="font-bold text-gold tabular-nums">
                    {category.pct}%
                  </span>
                </div>
                <div
                  className="h-1.5 bg-arena-700"
                  role="meter"
                  aria-valuenow={category.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${category.name} accuracy`}
                >
                  <div
                    className="h-full bg-gold"
                    style={{ width: `${category.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================ recent matches */}
        <section className="border border-white/[0.07] bg-arena-800 p-6">
          <h2 className="mb-5 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            Recent Matches
          </h2>
          <div className="space-y-3">
            {profileRecentMatches.map((match) => (
              <div
                key={match.opponents}
                className="flex items-center gap-3 border-b border-white/[0.05] py-3"
              >
                <span
                  className={`h-8 w-2 shrink-0 ${match.result === 'WIN' ? 'bg-gold' : 'bg-arena-400'}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-white">
                    {match.opponents}
                  </span>
                  <span className="block text-[10px] text-arena-300">
                    {match.date}
                  </span>
                </span>
                <span
                  className={`text-sm font-bold ${match.result === 'WIN' ? 'text-gold' : 'text-arena-300'}`}
                >
                  {match.money}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ===================================================== achievements */}
      <section className="border border-white/[0.07] bg-arena-800 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            Achievements
          </h2>
          <Link
            href="/achievements"
            className="text-[10px] tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className={`flex flex-col items-center gap-2 border p-4 text-center ${
                badge.unlocked
                  ? 'border-gold/20 bg-gold/5'
                  : 'border-white/[0.04] opacity-40'
              }`}
            >
              <div className="text-2xl" aria-hidden="true">
                {badge.icon}
              </div>
              <div
                className={`text-[10px] tracking-wider ${badge.unlocked ? 'text-gold' : 'text-arena-300'}`}
              >
                {badge.title}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
