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
  label: string;
  icon: string;
}

export const navItems: NavItem[] = [
  { href: '/home', label: 'Home', icon: 'H' },
  { href: '/rooms', label: 'Find a Room', icon: 'F' },
  { href: '/rooms/create', label: 'Create Room', icon: '+' },
  { href: '/rooms/join', label: 'Join Room', icon: '→' },
  { href: '/leaderboards', label: 'Leaderboards', icon: '▲' },
  { href: '/friends', label: 'Friends', icon: '◆' },
  { href: '/history', label: 'Match History', icon: '◷' },
  { href: '/achievements', label: 'Achievements', icon: '★' },
  { href: '/profile', label: 'Profile', icon: '◎' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
  { href: '/results', label: 'Game Results', icon: '◑' },
];
