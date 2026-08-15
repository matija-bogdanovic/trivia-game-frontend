'use client';

import Link from 'next/link';
import { useT } from '@/app/lib/i18n';
import Avatar from '@/app/(arena)/_components/avatar';
import { achievements } from '@/app/(arena)/_mock/progress';
import { useWallet } from '@/app/(arena)/_data/use_wallet';

/** Player profile. Static in the export and static here. */
export default function Page() {
  const { t } = useT();
  const { identity, wallet, loading, signedIn } = useWallet();
  const badges = achievements.slice(0, 6);

  const name = identity?.displayName ?? identity?.username ?? '';
  const initial = (name || '?').charAt(0).toUpperCase();

  /**
   * Everything the wallet actually tracks. Duels and bets are not among its
   * counters, so those tiles are simply not rendered rather than shown as a
   * confident zero.
   */
  const stats = wallet
    ? [
        { labelKey: 'arena.stat.totalWins', value: String(wallet.wins) },
        {
          labelKey: 'arena.stat.gamesPlayed',
          value: String(wallet.gamesPlayed),
        },
        {
          labelKey: 'arena.stat.winRate',
          value: wallet.gamesPlayed
            ? `${Math.round((wallet.wins / wallet.gamesPlayed) * 100)}%`
            : '—',
        },
        { labelKey: 'arena.stat.balance', value: `$${wallet.coins}` },
      ]
    : [];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* =========================================================== header */}
      <section className="flex flex-col items-start gap-6 border border-white/[0.07] bg-arena-800 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <Avatar initial={initial} size="xl" accent />

        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.profile.eyebrow')}
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-wide text-white sm:text-4xl">
            {loading ? '…' : name || t('arena.nav.notSignedIn')}
          </h1>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <div className="text-[10px] tracking-widest text-arena-300 uppercase">
                {t('arena.profile.currentStreak')}
              </div>
              <div className="text-2xl font-bold text-gold">
                {t('arena.profile.streakWins', {
                  n: wallet?.currentStreak ?? 0,
                })}
              </div>
            </div>
            <div
              className="hidden h-10 w-px bg-white/10 sm:block"
              aria-hidden="true"
            />
            <div className="text-sm text-arena-200">
              {signedIn && identity?.email ? identity.email : ''}
            </div>
          </div>
        </div>

        <Link
          href="/settings"
          className="border border-white/20 px-5 py-3 text-[11px] tracking-[0.2em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          {t('arena.profile.edit')}
        </Link>
      </section>

      {/* ============================================================ stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.labelKey}
            className="border border-white/[0.07] bg-arena-800 p-4 text-center"
          >
            <div className="mb-1 text-2xl font-bold text-gold tabular-nums">
              {stat.value}
            </div>
            <div className="text-[9px] leading-tight tracking-[0.2em] text-arena-300 uppercase">
              {t(stat.labelKey)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ================================================ category scores */}
        <section className="border border-white/[0.07] bg-arena-800 p-6">
          <h2 className="mb-5 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.profile.categoryPerformance')}
          </h2>
          <p className="text-[11px] text-arena-300">
            {t('arena.profile.noCategories')}
          </p>
          <div className="space-y-4">
            {[].map((category: { name: string; pct: number }) => (
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
                  aria-label={t('arena.profile.accuracy', {
                    name: category.name,
                  })}
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
            {t('arena.profile.recentMatches')}
          </h2>
          <p className="text-[11px] text-arena-300">
            {t('arena.profile.noMatches')}
          </p>
          <div className="space-y-3">
            {[].map(
              (match: {
                opponents: string;
                result: string;
                money: string;
                date: string;
              }) => (
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
              )
            )}
          </div>
        </section>
      </div>

      {/* ===================================================== achievements */}
      <section className="border border-white/[0.07] bg-arena-800 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.profile.achievements')}
          </h2>
          <Link
            href="/achievements"
            className="text-[10px] tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('arena.common.viewAll')}
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
