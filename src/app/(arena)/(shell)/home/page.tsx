'use client';

import Link from 'next/link';
import PressButton from '@/app/(arena)/_components/press_button';
import { useT } from '@/app/lib/i18n';
import { homeRecentMatches } from '@/app/(arena)/_mock/matches';
import Avatar from '@/app/(arena)/_components/avatar';
import PlayerPreview, {
  type PlayerCard,
} from '@/app/(arena)/_components/player_preview';
import {
  fetchFriends,
  presenceOf,
  type FriendSummary,
  type PresenceStatus,
} from '@/app/helpers/friends';
import AchievementGrid from '@/app/(arena)/_components/achievement_grid';
import { buildAchievements } from '@/app/(arena)/_lib/achievements';
import { useWallet } from '@/app/(arena)/_data/use_wallet';
import { EyeIcon, FlameIcon } from '@/app/(arena)/_components/icons';
import { useEffect, useState } from 'react';

/**
 * Dashboard, translated from the Angular app's home.html. Static there and
 * static here — data in, markup out.
 */
/**
 * The presence vocabulary, identical to the friends list.
 *
 * It is the same fact on both screens, so it has to be the same colour on
 * both. The rail used to paint "In Game" gold and everything else grey, which
 * put a busy friend in the app's achievement colour and an ONLINE one in the
 * colour of nothing at all.
 */
const PRESENCE: Record<
  PresenceStatus,
  { dot: string; text: string; key: string }
> = {
  playing: {
    dot: 'bg-live',
    text: 'text-live',
    key: 'arena.friends.statusPlaying',
  },
  spectating: {
    dot: 'bg-frost',
    text: 'text-frost',
    key: 'arena.friends.statusSpectating',
  },
  online: {
    dot: 'bg-ready',
    text: 'text-ready',
    key: 'arena.friends.statusOnline',
  },
  offline: {
    dot: 'bg-arena-500',
    text: 'text-arena-400',
    key: 'arena.friends.statusOffline',
  },
};

export default function Page() {
  const { t } = useT();
  const { wallet, loading } = useWallet();

  /*
   * The rail ran on _mock/players — three invented names, a square initials
   * box and a gold dot — so it showed the same strangers to everybody and
   * disagreed with /friends about what a presence colour means. It reads the
   * real endpoint now, and only the friends who are actually about.
   */
  const [friends, setFriends] = useState<FriendSummary[] | null>(null);
  const [preview, setPreview] = useState<PlayerCard | null>(null);

  useEffect(() => {
    let live = true;
    fetchFriends().then((snapshot) => {
      if (live) setFriends(snapshot?.friends ?? []);
    });
    return () => {
      live = false;
    };
  }, []);

  const onlineFriends = (friends ?? [])
    .filter((f) => presenceOf(f) !== 'offline')
    .slice(0, 4);

  /** the four numbers this screen leads with, from the player's own record */
  const homeStats = [
    {
      labelKey: 'arena.stat.winningStreak',
      value: String(wallet?.currentStreak ?? 0),
      tone: 'text-flame',
      Icon: FlameIcon,
    },
    {
      labelKey: 'arena.stat.totalWins',
      value: String(wallet?.wins ?? 0),
      tone: 'text-white',
      Icon: null,
    },
    {
      labelKey: 'arena.stat.gamesPlayed',
      value: String(wallet?.gamesPlayed ?? 0),
      tone: 'text-white',
      Icon: null,
    },
    {
      labelKey: 'arena.stat.balance',
      value: `$${wallet?.coins ?? 0}`,
      tone: 'text-gold',
      Icon: null,
    },
  ];
  /** The teaser row links through to the full achievements screen. */
  const teasers = buildAchievements(
    wallet?.achievementCatalog,
    wallet?.achievements
  );

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* ============================================================ stats */}
      {/*
        The player's OWN numbers. This row rendered homeStats from
        _mock/progress — a fixture — so every visitor was shown the same
        invented 7 / 143 / 201 / $8,340, with the streak's fire as a text
        suffix on the value. It reads the wallet now, and the streak carries
        the drawn flame in the streak colour like everywhere else.
      */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {homeStats.map((stat) => (
          <div
            key={stat.labelKey}
            className="border border-white/[0.07] bg-arena-800 p-5"
          >
            <div className="mb-2 text-[10px] tracking-[0.2em] text-arena-200 uppercase">
              {t(stat.labelKey)}
            </div>
            <div
              className={`flex items-center gap-2 text-2xl font-bold sm:text-3xl ${stat.tone}`}
            >
              {stat.Icon && <stat.Icon className="h-6 w-6 shrink-0" />}
              {stat.value}
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
          {/*
            The hero's watermark, black rather than gold.

            At 5% over #0c1c0d a gold glyph does not read as gold — it reads as
            a warm olive smudge in the corner, which looks like a rendering
            fault rather than a mark. Black at the same opacity darkens instead
            of tinting, so the green stays green and the "?" is a shadow in it.

            The background gradient is untouched.
          */}
          <div className="text-[200px] leading-none font-bold text-black">
            ?
          </div>
        </div>
        <div className="relative">
          <div className="mb-3 text-xs tracking-[0.3em] text-arena-200 uppercase">
            {t('arena.home.readyToCompete')}
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-wide text-white sm:text-5xl">
            {t('arena.home.title')}
          </h1>
          <p className="mb-8 max-w-md text-sm leading-relaxed text-arena-200">
            {t('arena.home.tagline')}
          </p>
          {/*
            gap-y is larger than gap-x because these buttons stand on a 6px
            ledge — on a wrapped row the ledge would otherwise sit almost on
            the next button's face.
          */}
          <div className="flex flex-wrap gap-x-3 gap-y-5 sm:gap-x-4">
            <PressButton href="/rooms" className="px-8 py-4 sm:px-10">
              {t('arena.nav.playNow')}
            </PressButton>
            <PressButton
              href="/rooms/create"
              variant="secondary"
              className="px-6 py-4 sm:px-8"
            >
              {t('arena.home.createRoom')}
            </PressButton>
            <Link
              href="/rooms/join"
              className="border border-white/20 px-6 py-4 text-sm font-bold tracking-[0.15em] text-white uppercase transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:px-8"
            >
              {t('arena.home.joinRoom')}
            </Link>
          </div>
        </div>
      </section>

      {/*
        The page runs on space-y-8 between sections, and these two columns sat
        at gap-6 with space-y-3 inside — visibly tighter than everything above
        them, which is what made the lower half read as a different screen.

        The SECTION rhythm is unified to 8: the grid gap matches the page, and
        each column's header sits mb-3 off its list. The rhythm INSIDE a list
        is deliberately not 8 — space-y-4 rather than space-y-3, so the rows
        breathe without drifting so far apart that a list of matches reads as
        four separate sections. Consistency here means the sections line up,
        not that every gap on the page is the same number.
      */}
      <div className="grid gap-8 lg:grid-cols-5">
        <section className="space-y-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] tracking-[0.25em] text-arena-200 uppercase">
              {t('arena.home.recentMatches')}
            </h2>
            <Link
              href="/history"
              className="text-xs tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              {t('arena.common.viewAll')}
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

        <section className="space-y-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] tracking-[0.25em] text-arena-200 uppercase">
              {t('arena.home.friendsOnline')}
            </h2>
            <Link
              href="/friends"
              className="text-xs tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              {t('arena.home.allFriends')}
            </Link>
          </div>

          {friends !== null && onlineFriends.length === 0 && (
            <div className="border border-white/[0.07] bg-arena-800 p-4 text-center text-[11px] text-arena-300">
              {t('arena.home.noFriendsOnline')}
            </div>
          )}

          {onlineFriends.map((friend) => {
            const presence = presenceOf(friend);
            const look = PRESENCE[presence];
            const name = friend.displayName || friend.username;
            return (
              <div
                key={friend.username}
                className="flex items-center gap-3 border border-white/[0.07] bg-arena-800 p-3"
              >
                {/*
                  Avatar and name are one target, as on the friends list, and
                  the click opens the overlay rather than leaving the page.
                */}
                <button
                  type="button"
                  onClick={() =>
                    setPreview({
                      username: friend.username,
                      displayName: friend.displayName,
                      presence,
                      points: friend.points,
                      wins: friend.wins,
                      currentStreak: friend.currentStreak,
                    })
                  }
                  aria-label={t('arena.player.viewProfile', { name })}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
                  <span className="relative shrink-0">
                    <Avatar username={friend.username} name={name} size="sm" />
                    <span
                      className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-arena-800 ${look.dot}`}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-white">
                      {name}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[10px] tracking-wider uppercase ${look.text}`}
                    >
                      {presence === 'spectating' && (
                        <EyeIcon className="h-3 w-3 shrink-0" />
                      )}
                      {t(look.key)}
                    </span>
                  </span>
                </button>
                {friend.currentStreak > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-flame">
                    <FlameIcon className="h-3 w-3 shrink-0" />
                    {friend.currentStreak}
                  </span>
                )}
                <button
                  type="button"
                  className="cursor-pointer border border-arena-400 px-2 py-1 text-[10px] tracking-wider text-arena-200 uppercase transition-colors hover:border-arena-300 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                  aria-label={t('arena.home.inviteName', { name })}
                >
                  {t('arena.home.invite')}
                </button>
              </div>
            );
          })}
        </section>
      </div>

      {/* ===================================================== achievements */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] tracking-[0.25em] text-arena-200 uppercase">
            {t('arena.home.recentAchievements')}
          </h2>
          <Link
            href="/achievements"
            className="text-xs tracking-wider text-gold uppercase hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            {t('arena.common.viewAll')}
          </Link>
        </div>
        <AchievementGrid items={teasers} limit={4} loading={loading} />
      </section>

      <PlayerPreview player={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
