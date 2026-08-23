/**
 * The sidebar's contents, in the order the Angular app's NAV_ITEMS lists them.
 *
 * Three entries from that list are not here. Angular routes /lobby and
 * /live-game as standalone screens; in this app both are phases of
 * /game/[game] on one socket, so there is no static URL to point at. The
 * "Play now" button goes to /rooms instead. Results is the third: it is the
 * end of a match, not a destination, so it is not routed at all — the design
 * lives in game/[game]/_deferred/results.tsx.
 */
import type { ReactNode } from 'react';
import { BarChartIcon, PlusCircleIcon, UserPlusIcon, UsersIcon } from './icons';

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

export const navItems: NavItem[] = [
  { href: '/home', labelKey: 'arena.nav.home', icon: 'H' },
  { href: '/rooms', labelKey: 'arena.nav.rooms', icon: 'F' },
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
  { href: '/history', labelKey: 'arena.nav.history', icon: '◷' },
  { href: '/achievements', labelKey: 'arena.nav.achievements', icon: '★' },
  { href: '/profile', labelKey: 'arena.nav.profile', icon: '◎' },
  { href: '/settings', labelKey: 'arena.nav.settings', icon: '⚙' },
];
