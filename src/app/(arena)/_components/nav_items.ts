/**
 * The sidebar's contents, in the order the Angular app's NAV_ITEMS lists them.
 *
 * Two entries from that list are not here. Angular routes /lobby and
 * /live-game as standalone screens; in this app both are phases of
 * /game/[game] on one socket, so there is no static URL to point at. The
 * "Play now" button goes to /rooms instead.
 */
export interface NavItem {
  href: string;
  /** i18n key — the sidebar resolves it through useT */
  labelKey: string;
  icon: string;
}

export const navItems: NavItem[] = [
  { href: '/home', labelKey: 'arena.nav.home', icon: 'H' },
  { href: '/rooms', labelKey: 'arena.nav.rooms', icon: 'F' },
  { href: '/rooms/create', labelKey: 'arena.nav.create', icon: '+' },
  { href: '/rooms/join', labelKey: 'arena.nav.join', icon: '→' },
  { href: '/leaderboards', labelKey: 'arena.nav.leaderboards', icon: '▲' },
  { href: '/friends', labelKey: 'arena.nav.friends', icon: '◆' },
  { href: '/history', labelKey: 'arena.nav.history', icon: '◷' },
  { href: '/achievements', labelKey: 'arena.nav.achievements', icon: '★' },
  { href: '/profile', labelKey: 'arena.nav.profile', icon: '◎' },
  { href: '/settings', labelKey: 'arena.nav.settings', icon: '⚙' },
  { href: '/results', labelKey: 'arena.nav.results', icon: '◑' },
];
