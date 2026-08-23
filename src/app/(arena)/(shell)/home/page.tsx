'use client';

import Link from 'next/link';
import PressButton from '@/app/(arena)/_components/press_button';
import { useT } from '@/app/lib/i18n';
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
import {
  CalendarXIcon,
  EyeIcon,
  FlameIcon,
  UserPlusIcon,
  UsersThreeIcon,
} from '@/app/(arena)/_components/icons';
import { money } from '@/app/(arena)/_lib/money';
import { playedAtLabel } from '@/app/(arena)/_lib/match_time';
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
  const { t, lang } = useT();
  const { wallet, loading, signedIn } = useWallet();

  /*
   * The four most recent matches, from the player's own record.
   *
   * wallet.matchHistory is the capped window the game engine writes when a
   * match ends — newest first, twenty deep — and it is the same array /history
   * draws its rows from, so the two screens cannot disagree about a match.
   * Nothing extra is fetched: the wallet is already loaded for the stat tiles
   * above, so this rail costs no request at all.
   */
  const recentMatches = (wallet?.matchHistory ?? []).slice(0, 4);

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
      {/*
        arena-800 climbing to arena-650, so the hero is the same greens as the
        rest of the app rather than a hole in it, and the gold has something
        warm to sit against.
      */}
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
          {/* Gold, at 5%: a mark in the corner rather than a second heading */}
          <div className="text-[200px] leading-none font-bold text-gold">?</div>
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

          {/*
            The empty panel is where the play CTA belongs, and only there.

            A reader with four matches on this rail already passed "Igraj
            odmah" in the hero a few centimetres above; a third button saying
            the same thing would be the page repeating itself. A reader with
            NOTHING on it is looking at a panel that describes an absence and
            offers no way to end it, which is the one case where the button is
            the answer rather than an echo.

            It goes to /rooms, the same place the hero's primary CTA goes —
            browse what is open, or open one.
          */}
          {!loading && signedIn && recentMatches.length === 0 && (
            <div className="border border-white/[0.07] bg-arena-800 px-4 py-10 text-center">
              <div className="mb-3 flex justify-center" aria-hidden="true">
                <CalendarXIcon className="h-8 w-8 text-arena-500" />
              </div>
              <div className="text-[11px] tracking-wider text-arena-300 uppercase">
                {t('arena.history.empty')}
              </div>
              <p className="mt-1.5 text-[11px] text-arena-300">
                {t('arena.history.emptyHint')}
              </p>
              {/*
                The sidebar's Igraj-odmah treatment, not the hero's pressable
                one: flat gold, small bold uppercase, colour-only hover.

                The tactile button is the HERO's, and it earns the ledge by
                being the one thing that screen is built around. A second
                pressable button inside a panel puts two of them on one page
                competing to be the main action, and the smaller one loses
                anyway. Flat is what a secondary CTA looks like here.

                Inline with px-6 rather than the sidebar's block w-full — same
                treatment, but the rail is 224px wide and this panel is not, so
                a full-width gold bar would be the same button at three times
                the size.
              */}
              <Link
                href="/rooms"
                className="mt-5 inline-block bg-gold px-6 py-3 text-center text-[11px] font-bold tracking-[0.15em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-950 focus-visible:outline-none"
              >
                {t('arena.home.playMatch')}
              </Link>
            </div>
          )}

          {/*
            Built from the same fields, helpers and strings as a /history row —
            money(), playedAtLabel(), arena.history.* — so one match reads the
            same on both screens rather than being described twice.

            The row that stood here listed three opponents by name. The summary
            the server keeps does not carry them: it holds the room, the
            result, the placement, the money and the winner, and everyone
            ELSE at the table is only in POST /matches/detail, one request per
            match. So the name shown is the winner's, which is a real opponent
            whenever the reader was not the one who won.
          */}
          {recentMatches.map((match) => (
            <Link
              key={match.matchId}
              href="/history"
              className="flex items-center gap-4 border border-white/[0.07] bg-arena-800 p-4 transition-colors hover:bg-arena-700 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              <span
                className={`h-12 w-2 shrink-0 ${match.won ? 'bg-gold' : 'bg-arena-400'}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="mb-0.5 flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-white">
                    {match.roomName}
                  </span>
                  <span className="shrink-0 border border-arena-500 px-1.5 py-0.5 text-[9px] tracking-widest text-arena-300">
                    {t('arena.history.players', { n: match.playerCount })}
                  </span>
                </span>
                <span className="block truncate text-[10px] tracking-wider text-arena-200">
                  {playedAtLabel(match.playedAt, lang)}
                  {!match.won && match.winnerName
                    ? ` · ${t('arena.home.wonBy', { name: match.winnerName })}`
                    : ` · ${t('arena.history.roundsPlayed', { n: match.roundsPlayed })}`}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span
                  className={`block text-sm font-bold ${match.won ? 'text-gold' : 'text-arena-300'}`}
                >
                  {money(match.money)}
                </span>
                <span className="block text-[10px] tracking-wider text-arena-200">
                  {t('arena.history.place', { n: match.placement })}
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

          {/*
            Two different nothings, and the difference is the whole point of
            the panel: a player with no friends AT ALL needs somewhere to go,
            and a player whose friends are simply asleep does not. Both get the
            same icon and the same frame; only the sentence changes, and the
            Add button appears for the first.

            The button lands on /friends#add-friend, the id of the input that
            takes a username, so the control that answers the message is the
            one the page scrolls to.
          */}
          {friends !== null && onlineFriends.length === 0 && (
            <div className="border border-white/[0.07] bg-arena-800 px-4 py-8 text-center">
              <div className="mb-3 flex justify-center" aria-hidden="true">
                <UsersThreeIcon className="h-8 w-8 text-arena-500" />
              </div>
              <div className="text-[11px] tracking-wider text-arena-300 uppercase">
                {friends.length === 0
                  ? t('arena.home.noFriendsYet')
                  : t('arena.home.noFriendsOnline')}
              </div>
              {friends.length === 0 && (
                <Link
                  href="/friends#add-friend"
                  className="mt-4 inline-flex items-center gap-2 border border-gold/40 px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-gold uppercase transition-colors hover:bg-gold/10 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
                >
                  <UserPlusIcon className="h-3.5 w-3.5 shrink-0" />
                  {t('arena.home.addFriend')}
                </Link>
              )}
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
            href="/profile"
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
