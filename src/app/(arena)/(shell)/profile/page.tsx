'use client';

import Link from 'next/link';
import { useT } from '@/app/lib/i18n';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import Avatar from '@/app/(arena)/_components/avatar';
import GoogleBadge from '@/app/(arena)/_components/google_mark';
import { FlameIcon, SnowflakeIcon } from '@/app/(arena)/_components/icons';
import AchievementGrid from '@/app/(arena)/_components/achievement_grid';
import { buildAchievements } from '@/app/(arena)/_lib/achievements';
import { useWallet } from '@/app/(arena)/_data/use_wallet';
import { money } from '@/app/(arena)/_lib/money';
import { playedAtLabel } from '@/app/(arena)/_lib/match_time';
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonRegion,
} from '@/app/(arena)/_components/skeleton';

/** how many of the wallet's matches the profile card shows before /history */
const RECENT_COUNT = 3;

/** Player profile — the wallet's numbers, and its last few matches. */
export default function Page() {
  const { t, lang } = useT();
  const { identity, wallet, loading, signedIn } = useWallet();
  const badges = buildAchievements(
    wallet?.achievementCatalog,
    wallet?.achievements
  );

  /*
   * The same source /history reads, cut to the card's size. matchHistory is
   * already newest-first from the server, so this is a slice and nothing more
   * — no sorting that could disagree with the history screen's order.
   */
  const recent = (wallet?.matchHistory ?? []).slice(0, RECENT_COUNT);

  const stored = useSelector((s: RootState) => s.profile.displayName);
  const name = stored ?? identity?.displayName ?? identity?.username ?? '';
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
        /*
          The two "longest ever" figures, added together so the grid never
          shows one without the other. The header carries what is happening
          NOW; these are the records behind it, and the tile row was already
          six wide with four in it.
        */
        {
          labelKey: 'arena.stat.bestStreak',
          value: String(wallet.bestStreak ?? 0),
        },
        {
          labelKey: 'arena.stat.longestLosingStreak',
          value: String(wallet.longestLosingStreak ?? 0),
        },
      ]
    : [];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* =========================================================== header */}
      <section className="flex flex-col items-start gap-6 border border-white/[0.07] bg-arena-800 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        {/*
          username and avatar are both required for a picture to resolve:
          useAvatarSource needs the username to build the URL and the wallet's
          avatar string for the version. Without them this renders initials
          even for a player who has uploaded a photo.
        */}
        {loading ? (
          <SkeletonAvatar size="xl" />
        ) : (
          <Avatar
            initial={initial}
            username={identity?.username}
            avatar={wallet?.avatar}
            alt={name}
            size="xl"
            accent
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.profile.eyebrow')}
          </div>
          <div className="mb-2 flex items-center gap-3">
            {loading ? (
              <Skeleton className="h-9 w-52 sm:h-10" />
            ) : (
              <h1 className="min-w-0 text-3xl font-bold tracking-wide text-white sm:text-4xl">
                {name || t('arena.nav.notSignedIn')}
              </h1>
            )}
            {/* only federated accounts are marked; password accounts get nothing */}
            {identity?.provider === 'google' && (
              <GoogleBadge label={t('arena.auth.googleAccount')} />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/*
              Hot and cold, side by side and built the same way. Neither is
              gold: gold is this app's "this matters" accent, already spent on
              money and every podium number, and a losing run wearing it would
              read as an award. --color-flame and --color-frost exist for this
              pair and nothing else.
            */}
            <div>
              <div className="text-[10px] tracking-widest text-arena-300 uppercase">
                {t('arena.profile.currentStreak')}
              </div>
              <div className="flex items-center gap-2 text-2xl font-bold text-flame">
                <FlameIcon className="h-6 w-6" />
                {t('arena.profile.streakWins', {
                  n: wallet?.currentStreak ?? 0,
                })}
              </div>
            </div>

            {/*
              The losing streak sits immediately beside the winning one,
              because the pair is the point — a run of either kind is the same
              fact about how the last few matches went, and reading one without
              the other tells half of it.

              Deliberately NOT gold. Gold is this app's "good news" colour and
              is doing that job a centimetre to the left; a losing run rendered
              in it would read as an achievement. arena-200 states it without
              celebrating or scolding.
            */}
            <div
              className="hidden h-10 w-px bg-white/10 sm:block"
              aria-hidden="true"
            />
            <div>
              <div className="text-[10px] tracking-widest text-arena-300 uppercase">
                {t('arena.profile.losingStreak')}
              </div>
              <div className="flex items-center gap-2 text-2xl font-bold text-frost">
                <SnowflakeIcon className="h-6 w-6" />
                {t('arena.profile.streakLosses', {
                  n: wallet?.currentLosingStreak ?? 0,
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
      {loading && (
        <SkeletonRegion className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col items-center border border-white/[0.07] bg-arena-800 p-4"
            >
              <Skeleton className="mb-2 h-7 w-14" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          ))}
        </SkeletonRegion>
      )}

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
        {/*
          ============================================== category performance

          Not wired, and not wire-able from here: nothing in the app records
          which category a question belonged to, let alone who got it right.
          The Questions table carries a `category` attribute on the ~50
          OpenTDB-imported rows, but parseQuestion() in the backend's
          questions.ts drops it, so a served question has no category; the
          room's chosen categories are sent by /rooms/create and ignored by
          the server; and neither the wallet nor a Matches record keeps a
          per-question log. Per-category counters are a backend feature, not
          a frontend derivation, so this says so rather than showing a bar.

          WHEN IT IS WIRED: a category's percentage must not be shown until
          that category has at least MIN_CATEGORY_GAMES (10) games behind it.
          Three questions answered is not a 67% success rate, and a bar that
          confident is worse than no bar. Below the threshold the row shows
          the count it has ("nedovoljno odigranih partija — 3/10"), not a
          percentage. The threshold is per category, because the statistic is
          per category: 40 games of Geography say nothing about the four
          History questions sitting next to them.
        */}
        <section className="border border-white/[0.07] bg-arena-800 p-6">
          <h2 className="mb-5 text-[10px] tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.profile.categoryPerformance')}
          </h2>
          <p className="text-[11px] text-arena-300">
            {t('arena.profile.noCategories')}
          </p>
        </section>

        {/* ================================================ recent matches */}
        <section className="border border-white/[0.07] bg-arena-800 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[10px] tracking-[0.25em] text-arena-200 uppercase">
              {t('arena.profile.recentMatches')}
            </h2>
            {/* the wallet only keeps the last few; the rest live on /history */}
            {recent.length > 0 && (
              <Link
                href="/history"
                className="text-xs tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              >
                {t('arena.common.viewAll')}
              </Link>
            )}
          </div>

          {/*
            No session and no matches are different sentences, and neither is
            an empty list. A never-played account gets the second, not three
            blank rows where matches would go.
          */}
          {/* the same three-row card that is about to be here, in outline */}
          {loading && (
            <SkeletonRegion className="space-y-3">
              {Array.from({ length: RECENT_COUNT }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 border-b border-white/[0.05] py-3"
                >
                  <Skeleton className="h-8 w-2 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-24" />
                  </div>
                  <Skeleton className="h-3.5 w-14" />
                </div>
              ))}
            </SkeletonRegion>
          )}
          {!loading && !signedIn && (
            <p className="text-[11px] text-arena-300">
              {t('arena.common.signInPrompt')}
            </p>
          )}
          {!loading && signedIn && recent.length === 0 && (
            <p className="text-[11px] text-arena-300">
              {t('arena.profile.noMatches')}
            </p>
          )}

          <div className="space-y-3">
            {recent.map((match) => (
              <div
                key={match.matchId}
                className="flex items-center gap-3 border-b border-white/[0.05] py-3"
              >
                <span
                  className={`h-8 w-2 shrink-0 ${match.won ? 'bg-gold' : 'bg-arena-400'}`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-white">
                    {match.roomName}
                  </span>
                  <span className="block text-[10px] text-arena-300">
                    {playedAtLabel(match.playedAt, lang)} ·{' '}
                    {t('arena.history.place', { n: match.placement })}
                  </span>
                </span>
                <span
                  className={`text-sm font-bold tabular-nums ${match.won ? 'text-gold' : 'text-arena-300'}`}
                >
                  {money(match.money)}
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
            {t('arena.profile.achievements')}
          </h2>
          <Link
            href="/achievements"
            className="text-xs tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('arena.common.viewAll')}
          </Link>
        </div>
        <AchievementGrid items={badges} limit={8} loading={loading} />
      </section>
    </div>
  );
}
