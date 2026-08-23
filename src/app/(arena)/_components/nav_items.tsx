/**
 * The sidebar's contents, in the order the Angular app's NAV_ITEMS lists them.
 *
 * Three entries from that list are not here. Angular routes /lobby and
 * /live-game as standalone screens; in this app both are phases of
 * /game/[game] on one socket, so there is no static URL to point at. The
 * "Play now" button goes to /rooms instead. Results is the third: it is the
 * end of a match, not a destination, so it is not routed at all — the design
 * lives in game/[game]/_deferred/results.tsx.
 *
 * Every entry now carries a drawn icon rather than a typed character. A glyph
 * is whatever the user's font decides it is; see _components/icons.tsx.
 */
import type { ReactNode } from 'react';
import {
  BarChartIcon,
  CalendarIcon,
  GearIcon,
  HouseIcon,
  PlusCircleIcon,
  StarIcon,
  UserCircleIcon,
  UserPlusIcon,
  UsersIcon,
} from './icons';

export interface NavItem {
  href: string;
  /** i18n key — the sidebar resolves it through useT */
  labelKey: string;
  /**
   * A typed character for most entries, or a real icon component.
   *
   * ReactNode rather than string so the two can coexist: converting all ten
   * glyphs at once is a design pass, not a side effect of adding one icon, and
   * the sidebar renders either without caring which it got.
   */
  icon: ReactNode;
}

/*
 * Nine entries, nine icons.
 *
 * "Pronađi sobu" is deliberately NOT among them any more. Browse, create and
 * join are one screen now (rooms/_panels/rooms_shell.tsx) and Find is its
 * default tab, so a fourth nav row pointing at the same page would be the
 * third shortcut into it. Create and Join keep theirs because they are
 * distinct actions worth one click; Find is where the hub already opens.
 */
export const navItems: NavItem[] = [
  { href: '/home', labelKey: 'arena.nav.home', icon: <HouseIcon /> },
  {
    href: '/rooms/create',
    labelKey: 'arena.nav.create',
    icon: <PlusCircleIcon />,
  },
  { href: '/rooms/join', labelKey: 'arena.nav.join', icon: <UserPlusIcon /> },
  {
    href: '/leaderboards',
    labelKey: 'arena.nav.leaderboards',
    icon: <BarChartIcon />,
  },
  { href: '/friends', labelKey: 'arena.nav.friends', icon: <UsersIcon /> },
  { href: '/history', labelKey: 'arena.nav.history', icon: <CalendarIcon /> },
  {
    href: '/achievements',
    labelKey: 'arena.nav.achievements',
    icon: <StarIcon />,
  },
  { href: '/profile', labelKey: 'arena.nav.profile', icon: <UserCircleIcon /> },
  { href: '/settings', labelKey: 'arena.nav.settings', icon: <GearIcon /> },
];
