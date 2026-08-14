/**
 * The sidebar's contents, in the order the design lists them. Kept apart from
 * the sidebar component so route stubs can name their own entry without
 * pulling a client component in.
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
