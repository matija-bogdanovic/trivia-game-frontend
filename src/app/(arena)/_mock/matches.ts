/**
 * MOCK DATA — see ./README.md. Replace with the match history endpoint.
 * Feeds /home, /history and /profile.
 *
 * Three shapes rather than one because the design's three screens each show a
 * different slice. A real endpoint would return one row type and let the
 * screens pick fields; worth collapsing when this is wired up.
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

/** the full history screen's rows, with the expandable per-match breakdown */
export interface HistoryMatch {
  id: number;
  date: string;
  players: string[];
  result: 'WIN' | 'LOSS';
  placement: number;
  money: string;
  category: string;
  difficulty: string;
  correct: number;
  wrong: number;
  duels: number;
  mode: string;
}

export const historyMatches: HistoryMatch[] = [
  {
    id: 1,
    date: 'Aug 11, 2026 · 14:32',
    players: ['AlphaWolf', 'ZenMaster', 'NovaMind', 'Specter'],
    result: 'WIN',
    placement: 1,
    money: '+$620',
    category: 'Science',
    difficulty: 'Hard',
    correct: 8,
    wrong: 2,
    duels: 2,
    mode: 'Deathmatch',
  },
  {
    id: 2,
    date: 'Aug 10, 2026 · 21:15',
    players: ['AlphaWolf', 'Specter', 'Kira9'],
    result: 'WIN',
    placement: 1,
    money: '+$390',
    category: 'History',
    difficulty: 'Medium',
    correct: 6,
    wrong: 1,
    duels: 1,
    mode: 'Deathmatch',
  },
  {
    id: 3,
    date: 'Aug 10, 2026 · 19:08',
    players: ['AlphaWolf', 'ZenMaster', 'Bolt88', 'Rogue'],
    result: 'LOSS',
    placement: 3,
    money: '-$120',
    category: 'Mixed',
    difficulty: 'Medium',
    correct: 4,
    wrong: 4,
    duels: 0,
    mode: 'Deathmatch',
  },
  {
    id: 4,
    date: 'Aug 9, 2026 · 22:44',
    players: ['AlphaWolf', 'Cipher', 'Nox'],
    result: 'WIN',
    placement: 1,
    money: '+$510',
    category: 'Mathematics',
    difficulty: 'Hard',
    correct: 7,
    wrong: 1,
    duels: 2,
    mode: 'Deathmatch',
  },
  {
    id: 5,
    date: 'Aug 9, 2026 · 18:20',
    players: ['AlphaWolf', 'NovaMind'],
    result: 'WIN',
    placement: 1,
    money: '+$240',
    category: 'Science',
    difficulty: 'Medium',
    correct: 5,
    wrong: 2,
    duels: 3,
    mode: '1v1',
  },
  {
    id: 6,
    date: 'Aug 8, 2026 · 20:10',
    players: ['AlphaWolf', 'Bolt88', 'Riptide', 'Kira9', 'Echo'],
    result: 'LOSS',
    placement: 4,
    money: '-$200',
    category: 'Geography',
    difficulty: 'Easy',
    correct: 3,
    wrong: 5,
    duels: 0,
    mode: 'Deathmatch',
  },
];

/** the profile screen's condensed recent-match list */
export interface ProfileMatch {
  result: 'WIN' | 'LOSS';
  opponent: string;
  money: string;
  date: string;
}

export const profileRecentMatches: ProfileMatch[] = [
  {
    result: 'WIN',
    opponent: 'ZenMaster · NovaMind · Specter',
    money: '+$620',
    date: 'Today',
  },
  {
    result: 'WIN',
    opponent: 'Specter · Kira9',
    money: '+$390',
    date: 'Yesterday',
  },
  {
    result: 'LOSS',
    opponent: 'ZenMaster · Bolt88 · Rogue',
    money: '-$120',
    date: '2 days ago',
  },
];
