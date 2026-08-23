'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'aws-amplify/auth';
import Avatar from './avatar';
import GoogleBadge from './google_mark';
import { useWallet } from '@/app/(arena)/_data/use_wallet';
import { useT } from '@/app/lib/i18n';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/redux/store';
import { ME } from '@/app/(arena)/_mock/progress';
import LogoPlaceholder from './logo_placeholder';
import { navItems } from './nav_items';

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
      className={`cursor-pointer border border-arena-400 px-2 py-1 text-[10px] font-bold tracking-wider text-arena-200 uppercase transition-colors hover:border-arena-300 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${extra}`}
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
                className={`flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                  active
                    ? 'border-l-2 border-gold bg-arena-600 text-white'
                    : 'text-arena-200 hover:bg-arena-700 hover:text-white'
                }`}
              >
                {/*
                  inline-flex, not text-center: the slot holds typed glyphs for
                  most entries and a real SVG for others, and text-center only
                  centres the first kind. Centring the box centres both, and
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
            ▶ {t('arena.nav.playNow')}
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
              <span className="block text-[10px] tracking-wider text-gold">
                🔥 {t('arena.nav.streak', { n: ME.streak })}
              </span>
            </span>
          </Link>

          {langButton('mr-1')}
          <button
            type="button"
            onClick={handleSignOut}
            className="mr-2 cursor-pointer px-2 py-2 text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            aria-label={t('arena.nav.signOut')}
            title={t('arena.nav.signOut')}
          >
            <span className="text-sm" aria-hidden="true">
              ⏻
            </span>
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
              ▶ {t('arena.nav.play')}
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
            {langButton('')}
            <button
              type="button"
              onClick={handleSignOut}
              className="cursor-pointer px-1 py-2 text-arena-300 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
              aria-label={t('arena.nav.signOut')}
            >
              <span className="text-sm" aria-hidden="true">
                ⏻
              </span>
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
