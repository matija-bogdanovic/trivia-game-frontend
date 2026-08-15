/**
 * MOCK DATA — see ./README.md. Replace with the match history endpoint.
 * Feeds /home.
 *
 * /history now reads the real thing: `wallet.matchHistory` for the rows and
 * POST /matches/detail for an opened row. The same two sources are what /home
 * and /profile should draw from — the shapes below are what the design wanted,
 * not what the backend has.
 */

/** the home screen's recent-match rail */
export interface HomeMatch {
  id: number;
  players: string[];
  result: 'WIN' | 'LOSS';
  placement: number;
  money: string;
  date: string;
  category: string;
}

export const homeRecentMatches: HomeMatch[] = [
  {
    id: 1,
    players: ['AlphaWolf', 'NovaMind', 'Riptide'],
    result: 'WIN',
    placement: 1,
    money: '+$620',
    date: 'Today, 14:32',
    category: 'Science',
  },
  {
    id: 2,
    players: ['AlphaWolf', 'Specter', 'Kira9'],
    result: 'WIN',
    placement: 1,
    money: '+$390',
    date: 'Yesterday, 21:15',
    category: 'History',
  },
  {
    id: 3,
    players: ['AlphaWolf', 'ZenMaster', 'Bolt88', 'Rogue'],
    result: 'LOSS',
    placement: 3,
    money: '-$120',
    date: 'Yesterday, 19:08',
    category: 'Mixed',
  },
  {
    id: 4,
    players: ['AlphaWolf', 'Cipher', 'Nox'],
    result: 'WIN',
    placement: 1,
    money: '+$510',
    date: '2 days ago',
    category: 'Mathematics',
  },
];

/** the profile screen's condensed recent-match list */
export interface ProfileMatch {
  result: 'WIN' | 'LOSS';
  opponents: string;
  money: string;
  date: string;
}

export const profileRecentMatches: ProfileMatch[] = [
  {
    result: 'WIN',
    opponents: 'ZenMaster · NovaMind · Specter',
    money: '+$620',
    date: 'Today',
  },
  {
    result: 'WIN',
    opponents: 'Specter · Kira9',
    money: '+$390',
    date: 'Yesterday',
  },
  {
    result: 'LOSS',
    opponents: 'ZenMaster · Bolt88 · Rogue',
    money: '-$120',
    date: '2 days ago',
  },
];
