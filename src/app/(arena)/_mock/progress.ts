/**
 * MOCK DATA — see ./README.md. Replace with the wallet and achievements the
 * game server already hydrates. Feeds /home, /profile and /achievements.
 */

/** the signed-in player's fixture data — real identity comes from Cognito */
export const ME = {
  name: 'AlphaWolf',
  initial: 'A',
  email: 'alphawolf@example.com',
  streak: 7,
  wins: 143,
  gamesPlayed: 201,
  balance: 8340,
  memberSince: 'March 2024',
};

/**
 * The home screen's top stat row. Labels are sentence case and uppercased in
 * CSS rather than shouted in the data, which is what a screen reader gets to
 * read out.
 */
export interface StatTile {
  /** i18n key — screens resolve it through useT */
  labelKey: string;
  value: string;
  accent?: boolean;
  suffix?: string;
}

export const homeStats: StatTile[] = [
  {
    labelKey: 'arena.stat.winningStreak',
    value: '7',
    accent: true,
    suffix: '🔥',
  },
  { labelKey: 'arena.stat.totalWins', value: '143' },
  { labelKey: 'arena.stat.gamesPlayed', value: '201' },
  { labelKey: 'arena.stat.balance', value: '$8,340', accent: true },
];

/** the profile screen's six-up stat grid */
export const profileStats: StatTile[] = [
  { labelKey: 'arena.stat.totalWins', value: '143' },
  { labelKey: 'arena.stat.gamesPlayed', value: '201' },
  { labelKey: 'arena.stat.winRate', value: '71%' },
  { labelKey: 'arena.stat.duelsWon', value: '38' },
  { labelKey: 'arena.stat.betsWon', value: '312' },
  { labelKey: 'arena.stat.moneyWon', value: '$8,340' },
];

export const categoryScores = [
  { name: 'Science', pct: 84 },
  { name: 'Mathematics', pct: 72 },
  { name: 'History', pct: 65 },
  { name: 'Geography', pct: 58 },
];

export const difficultyOptions = ['Easy', 'Medium', 'Hard', 'Mixed'];
