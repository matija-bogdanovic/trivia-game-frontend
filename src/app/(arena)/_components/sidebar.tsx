'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import Avatar from './avatar';
import GoogleBadge from './google_mark';
import NotificationBell from './notification_bell';
import { FlameIcon, SignOutIcon, SnowflakeIcon } from './icons';
import { useWallet } from '@/app/(arena)/_data/use_wallet';
import { useT } from '@/app/lib/i18n';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import LogoPlaceholder from './logo_placeholder';
import { navItems } from './nav_items';

/**
 * A streak has to be worth mentioning before it takes space on the rail.
 *
 * Strictly greater, so 4 is the first run that shows anything. Below it the
 * badge is absent rather than dimmed — a greyed-out flame is still clutter,
 * and "no badge" is the honest rendering of "nothing remarkable happening".
 */
const STREAK_BADGE_MIN = 3;

/**
 * Translated from the Angular app's shell/nav. Two separate trees, as there:
 * a fixed sidebar from lg up, and a top bar with a horizontally scrolling
 * link strip below it — which is what makes the arena usable on a phone.
 *
 * routerLinkActive with {exact: true} becomes an exact pathname compare, so
 * /rooms does not stay lit while you are on /rooms/create.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t } = useT();
  /*
   * The shell mounts once and survives navigation, so this is a single wallet
   * fetch for the whole session — and it seeds the avatar version every other
   * render site reads.
   */
  const { identity, wallet } = useWallet();
  const streak = wallet?.currentStreak ?? 0;
  const losingStreak = wallet?.currentLosingStreak ?? 0;

  // the store wins so a rename in Settings shows here immediately; the token
  // value is the fallback until the store is seeded
  const stored = useSelector((s: RootState) => s.profile.displayName);
  const displayName = stored ?? identity?.displayName ?? null;
  const name = displayName ?? t('arena.nav.notSignedIn');
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '·';

  /**
   * The EN/SR switch used to live in the pre-reskin header, which was the only
   * place in the app that could call setLang — retiring that header without
   * this would have left the app bilingual with no way to change language.
   */
  const langButton = (extra: string) => (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'sr' : 'en')}
      className={`cursor-pointer rounded-lg border border-arena-400 px-2 py-1 text-[10px] font-bold tracking-wider text-arena-200 uppercase transition-colors hover:border-arena-300 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${extra}`}
      aria-label={t('arena.nav.switchLanguage')}
    >
      {lang === 'en' ? 'SR' : 'EN'}
    </button>
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      router.push('/login');
    }
  };

  return (
    <>
      {/* ================================================= desktop sidebar */}
      <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-white/[0.07] bg-arena-950 lg:flex">
        <div className="border-b border-white/[0.07] px-5 py-6">
          <div className="mb-2 text-[10px] tracking-[0.2em] text-arena-300 uppercase">
            {t('arena.common.multiplayer')}
          </div>
          {/* TODO(logo): real artwork goes in <LogoPlaceholder> */}
          <div className="h-8">
            <LogoPlaceholder />
          </div>
        </div>

        <nav
          className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4"
          aria-label={t('arena.nav.main')}
        >
          {navItems.map((item) => {
            /*
             * Exact match, except for the rooms hub: its three tabs are three
             * routes (/rooms, /rooms/create, /rooms/join) behind one nav row,
             * so an exact test would leave Sobe unlit on two of its own tabs.
             * Scoped to this one entry rather than a general startsWith, which
             * would also light /rooms for anything nested under it later.
             */
            const active =
              item.href === '/rooms'
                ? pathname === '/rooms' || pathname.startsWith('/rooms/')
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                /*
                  border-l-2 is on EVERY row, active or not, and the inactive
                  one is transparent.

                  It used to appear only on the active row, which meant the
                  left border went from width 0 to width 2 the instant a row
                  was clicked — and width is not something transition-colors
                  animates, so it snapped. Meanwhile border-COLOR did animate,
                  starting from Tailwind's preflight default: `border: 0 solid`
                  leaves border-color at its initial value, currentColor, which
                  on an inactive row is arena-200. The row's text was heading
                  for white in the same frame, so that 2px strip painted
                  through the pale end of the ramp on its way to gold. That is
                  the flash.

                  Carrying the border at all times fixes both halves: the width
                  never changes, and the colour interpolates transparent → gold
                  without passing through anything. It also stops a 2px jog —
                  the active row's content box used to be two pixels narrower
                  than its neighbours, so the icon and label shifted every time
                  you changed page.
                */
                className={`flex w-full items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  active
                    ? 'border-gold bg-arena-600 text-white'
                    : 'border-transparent text-arena-200 hover:bg-arena-700 hover:text-white'
                }`}
              >
                {/*
                  inline-flex, not text-center: the slot holds a real SVG, and
                  text-center does not centre one. Centring the box does, and
                  shrink-0 keeps a long label from squeezing the icon.

                  The colour lives here rather than on the icon, which is why
                  icons.tsx paints with currentColor — the active state has one
                  owner and everything in the slot follows it.
                */}
                <span
                  className={`inline-flex w-4 shrink-0 items-center justify-center text-xs font-bold ${active ? 'text-gold' : 'text-arena-300'}`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="text-[11px] tracking-wider uppercase">
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-3">
          <Link
            href="/rooms"
            className="block w-full bg-gold py-3 text-center text-[11px] font-bold tracking-[0.15em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-arena-950 focus-visible:outline-none"
          >
            {t('arena.nav.playNow')}
          </Link>
        </div>

        <div className="flex items-center border-t border-white/[0.07]">
          <Link
            href="/profile"
            className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-arena-900 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
          >
            <Avatar
              initial={initial}
              username={identity?.username}
              avatar={wallet?.avatar}
              size="xs"
              accent
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="min-w-0 truncate text-xs font-bold text-white">
                  {name}
                </span>
                {/* only federated accounts are marked; password accounts get nothing */}
                {identity?.provider === 'google' && (
                  <GoogleBadge
                    label={t('arena.auth.googleAccount')}
                    size="sm"
                  />
                )}
              </span>
              {/*
                Badges, not a sentence. This printed "niz 1" next to every
                name — a number that says nothing at 1 and clutters the rail
                for the whole time it is not interesting.

                A streak only earns space once it is worth remarking on, so
                nothing renders at or below STREAK_BADGE_MIN and the row stays
                clean for most players most of the time. Above it, the badge
                is the flame alone and the COUNT IS ON HOVER — the shape says
                "you are on a run", and the number is there for whoever wants
                it without being there for everyone.

                title= rather than a custom tooltip: it is the one hover hint
                that also survives keyboard focus and screen readers, and the
                sr-only text below carries the same fact for anyone who never
                hovers at all.
              */}
              <span className="mt-0.5 flex items-center gap-1.5">
                {streak > STREAK_BADGE_MIN && (
                  <span
                    className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-flame text-arena-950"
                    title={t('arena.nav.streak', { n: streak })}
                  >
                    <FlameIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="sr-only">
                      {t('arena.nav.streak', { n: streak })}
                    </span>
                  </span>
                )}
                {losingStreak > STREAK_BADGE_MIN && (
                  <span
                    className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-frost text-arena-950"
                    title={t('arena.nav.coldStreak', { n: losingStreak })}
                  >
                    <SnowflakeIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="sr-only">
                      {t('arena.nav.coldStreak', { n: losingStreak })}
                    </span>
                  </span>
                )}
              </span>
            </span>
          </Link>

          <NotificationBell />
          {langButton('mr-1')}
          <button
            type="button"
            onClick={handleSignOut}
            className="mr-2 cursor-pointer px-2 py-2 text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            aria-label={t('arena.nav.signOut')}
            title={t('arena.nav.signOut')}
          >
            <SignOutIcon className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ================================================== mobile top bar */}
      <div className="shrink-0 border-b border-white/[0.07] bg-arena-950 lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {/* TODO(logo): real artwork goes in <LogoPlaceholder> */}
          <div className="h-7">
            <LogoPlaceholder />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/rooms"
              className="bg-gold px-4 py-2 text-[10px] font-bold tracking-[0.15em] text-arena-950 uppercase transition-colors hover:bg-gold-light focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              {t('arena.nav.play')}
            </Link>
            <Link
              href="/profile"
              className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              aria-label={t('arena.nav.profileOf', { name })}
            >
              <Avatar
                initial={initial}
                username={identity?.username}
                avatar={wallet?.avatar}
                size="xs"
                accent
              />
            </Link>
            <NotificationBell />
            {langButton('')}
            <button
              type="button"
              onClick={handleSignOut}
              className="cursor-pointer px-1 py-2 text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              aria-label={t('arena.nav.signOut')}
            >
              <SignOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto px-3 pb-2"
          aria-label={t('arena.nav.main')}
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 px-3 py-2 text-[10px] tracking-wider whitespace-nowrap uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  active
                    ? 'bg-arena-600 text-white'
                    : 'text-arena-200 hover:bg-arena-700'
                }`}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
