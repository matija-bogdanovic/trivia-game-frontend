/**
 * MOCK DATA — see ./README.md. Replace with the match history endpoint.
 * Feeds /home.
 *
 * /history and /profile read the real thing: `wallet.matchHistory` for the
 * rows, and POST /matches/detail for a row opened on /history. The same two
 * sources are what /home should draw from — the shape below is what the design
 * wanted, not what the backend has.
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
