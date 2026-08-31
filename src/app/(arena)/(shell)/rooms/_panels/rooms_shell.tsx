'use client';

import Link from 'next/link';
import PageHeader from '@/app/(arena)/_components/page_header';
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  UserPlusIcon,
} from '@/app/(arena)/_components/icons';
import { useT } from '@/app/lib/i18n';
import BrowsePanel from './browse_panel';
import CreatePanel from './create_panel';
import JoinPanel from './join_panel';

/**
 * Rooms — browse, create and join, on one screen.
 *
 * These were three routes with three page headers and three back-and-forth
 * trips between them, for what is one task with three ways in: find a room
 * somebody opened, open your own, or type a code you were given.
 *
 * ── WHY THE TABS ARE ROUTES, NOT STATE ─────────────────────────────────────
 * Each tab keeps its own URL — /rooms, /rooms/create, /rooms/join — and all
 * three render this same shell with a different panel. It would have been less
 * code to hold the active tab in useState and put it in a `?tab=` query, and
 * it would have been worse in three ways:
 *
 *   · The sidebar highlights by pathname. Query strings are invisible to it,
 *     so a query-based tab would leave all three nav entries unlit, or the
 *     wrong one lit, and fixing that means threading useSearchParams (and a
 *     Suspense boundary) through the shell layout.
 *   · The old URLs stay real. Nothing is orphaned and nothing needs a
 *     redirect, because /rooms/create still IS the create screen — it just
 *     renders inside the shell now. Every existing link and bookmark works.
 *   · Back does what it should. Switching tabs is a navigation, so the browser
 *     back button returns to the tab you came from.
 *
 * The panels are the former page bodies, unchanged apart from losing their own
 * PageHeader and outer padding, which this shell owns instead.
 */

export type RoomsTab = 'find' | 'create' | 'join';

/*
 * The two icons freed from the sidebar when create and join collapsed into
 * this page follow the actions here: a plus in a circle opens a room, a plus
 * beside a person enters one.
 *
 * All three carry one now: Pronađi waited only until there was a real
 * magnifying glass to give it rather than a shape nobody drew.
 */
const TABS: {
  tab: RoomsTab;
  href: string;
  labelKey: string;
  Icon?: (props: { className?: string }) => React.ReactElement;
}[] = [
  {
    tab: 'create',
    href: '/rooms/create',
    labelKey: 'arena.rooms.tabCreate',
    Icon: PlusCircleIcon,
  },
  {
    tab: 'find',
    href: '/rooms',
    labelKey: 'arena.rooms.tabFind',
    Icon: MagnifyingGlassIcon,
  },
  {
    tab: 'join',
    href: '/rooms/join',
    labelKey: 'arena.rooms.tabJoin',
    Icon: UserPlusIcon,
  },
];

export default function RoomsShell({ tab }: { tab: RoomsTab }) {
  const { t } = useT();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow={t('arena.common.multiplayer')}
        title={t('arena.rooms.hubTitle')}
      />

      {/*
        Links rather than buttons, because each tab is a real address. That
        also means the keyboard and the right-click menu behave the way they
        do everywhere else — open in a new tab, copy link — which a div with
        an onClick quietly takes away.
      */}
      <div
        className="mb-8 flex flex-wrap gap-1"
        role="tablist"
        aria-label={t('arena.rooms.hubTitle')}
      >
        {TABS.map((entry) => {
          const active = entry.tab === tab;
          return (
            <Link
              key={entry.tab}
              href={entry.href}
              role="tab"
              aria-selected={active}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-sm border px-5 py-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:px-6 ${
                active
                  ? 'border-gold bg-gold text-arena-950'
                  : 'border-white/10 text-arena-200 hover:border-arena-300 hover:text-white'
              }`}
            >
              {entry.Icon && <entry.Icon className="h-4 w-4" />}
              {t(entry.labelKey)}
            </Link>
          );
        })}
      </div>

      {tab === 'create' && <CreatePanel />}
      {tab === 'find' && <BrowsePanel />}
      {tab === 'join' && <JoinPanel />}
    </div>
  );
}
