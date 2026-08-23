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
  DoorIcon,
  GearIcon,
  HouseIcon,
  StarIcon,
  UserCircleIcon,
  UsersIcon,
} from './icons';

export interface NavItem {
  href: string;
  /** i18n key — the sidebar resolves it through useT */
  labelKey: string;
  /**
   * A drawn icon component. ReactNode is the remnant of a migration in which
   * typed characters and real icons had to coexist; every entry is an icon
   * now, and nothing here should go back to a glyph.
   */
  icon: ReactNode;
}

/*
 * Eight entries.
 *
 * Browse, create and join are ONE screen now — rooms/_panels/rooms_shell.tsx
 * — so they are one nav row: Sobe, wearing the door. Three rows pointing at
 * three tabs of the same page would have been the nav re-implementing a tab
 * strip that is already on the page.
 *
 * The circle-plus and add-person icons that used to sit here are not
 * discarded; they moved onto the Napravi and Uđi tabs inside that page, which
 * is where those two actions now live.
 */
export const navItems: NavItem[] = [
  { href: '/home', labelKey: 'arena.nav.home', icon: <HouseIcon /> },
  { href: '/rooms', labelKey: 'arena.nav.rooms', icon: <DoorIcon /> },
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
