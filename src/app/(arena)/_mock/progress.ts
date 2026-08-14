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
  label: string;
  value: string;
  accent?: boolean;
  suffix?: string;
}

export const homeStats: StatTile[] = [
  { label: 'Winning Streak', value: '7', accent: true, suffix: '🔥' },
  { label: 'Total Wins', value: '143' },
  { label: 'Games Played', value: '201' },
  { label: 'Balance', value: '$8,340', accent: true },
];

/** the profile screen's six-up stat grid */
export const profileStats = [
  { label: 'TOTAL WINS', value: '143' },
  { label: 'GAMES PLAYED', value: '201' },
  { label: 'WIN RATE', value: '71%' },
  { label: 'DUELS WON', value: '38' },
  { label: 'BETS WON', value: '312' },
  { label: 'MONEY WON', value: '$8,340' },
];

export const favoriteCategories = [
  { name: 'Science', pct: 84 },
  { name: 'Mathematics', pct: 72 },
  { name: 'History', pct: 65 },
  { name: 'Geography', pct: 58 },
];

export interface Achievement {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  /** set when unlocked */
  date?: string;
  /** set when still locked */
  progress?: number;
  max?: number;
}

export const achievements: Achievement[] = [
  {
    icon: '★',
    title: 'First Blood',
    description: 'Win your first game',
    unlocked: true,
    date: 'Mar 15, 2024',
  },
  {
    icon: '🔥',
    title: 'On Fire',
    description: 'Achieve a 5-win streak',
    unlocked: true,
    date: 'Apr 2, 2024',
  },
  {
    icon: '⚡',
    title: 'Lightning Reflex',
    description: 'Answer a question in under 2 seconds',
    unlocked: true,
    date: 'Apr 18, 2024',
  },
  {
    icon: '◆',
    title: 'Centurion',
    description: 'Win 100 games',
    unlocked: true,
    date: 'Jun 30, 2024',
  },
  {
    icon: '⚔',
    title: 'Duel Master',
    description: 'Win 10 duels',
    unlocked: false,
    progress: 8,
    max: 10,
  },
  {
    icon: '▲',
    title: 'Unstoppable',
    description: 'Achieve a 10-win streak',
    unlocked: false,
    progress: 7,
    max: 10,
  },
  {
    icon: '◎',
    title: 'The Gambler',
    description: 'Win 50 bets in a row',
    unlocked: false,
    progress: 12,
    max: 50,
  },
  {
    icon: '◈',
    title: "Oracle's Eye",
    description: 'Predict 20 correct outcomes',
    unlocked: false,
    progress: 14,
    max: 20,
  },
  {
    icon: '❋',
    title: 'Apex Predator',
    description: 'Reach rank #1 on the global leaderboard',
    unlocked: false,
    progress: 0,
    max: 1,
  },
  {
    icon: '◇',
    title: 'Speed Demon',
    description: 'Win a duel in under 1 second',
    unlocked: false,
    progress: 0,
    max: 1,
  },
  {
    icon: '✦',
    title: 'Scholar',
    description: 'Answer 500 questions correctly',
    unlocked: false,
    progress: 143,
    max: 500,
  },
  {
    icon: '◉',
    title: 'Champion',
    description: 'Win 500 games',
    unlocked: false,
    progress: 143,
    max: 500,
  },
];

/** the profile screen's compact teaser row */
export const profileAchievementTease = [
  { icon: '★', label: 'First Blood', unlocked: true },
  { icon: '🔥', label: 'On Fire', unlocked: true },
  { icon: '⚡', label: 'Lightning', unlocked: true },
  { icon: '⚔', label: 'Duel Master', unlocked: false },
  { icon: '◆', label: 'Unstoppable', unlocked: false },
  { icon: '▲', label: 'Apex', unlocked: false },
];

/** the profile header — a fake identity, unlike the sidebar's real one */
export const profileIdentity = {
  name: 'AlphaWolf',
  initial: 'A',
  streak: 7,
  memberSince: 'Member since March 2024',
};
