/**
 * MOCK DATA — see ./README.md. Replace with the wallet and achievements the
 * game server already hydrates. Feeds /home, /profile and /achievements.
 */

/** the home screen's top stat row */
export interface HomeStat {
  label: string;
  value: string;
  accent: boolean;
  suffix?: string;
}

export const homeStats: HomeStat[] = [
  { label: 'WINNING STREAK', value: '7', accent: true, suffix: '🔥' },
  { label: 'TOTAL WINS', value: '143', accent: false },
  { label: 'GAMES PLAYED', value: '201', accent: false },
  { label: 'BALANCE', value: '$8,340', accent: true },
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
  desc: string;
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
    desc: 'Win your first game',
    unlocked: true,
    date: 'Mar 15, 2024',
  },
  {
    icon: '🔥',
    title: 'On Fire',
    desc: 'Achieve a 5-win streak',
    unlocked: true,
    date: 'Apr 2, 2024',
  },
  {
    icon: '⚡',
    title: 'Lightning Reflex',
    desc: 'Answer a question in under 2 seconds',
    unlocked: true,
    date: 'Apr 18, 2024',
  },
  {
    icon: '◆',
    title: 'Centurion',
    desc: 'Win 100 games',
    unlocked: true,
    date: 'Jun 30, 2024',
  },
  {
    icon: '⚔',
    title: 'Duel Master',
    desc: 'Win 10 duels',
    unlocked: false,
    progress: 8,
    max: 10,
  },
  {
    icon: '▲',
    title: 'Unstoppable',
    desc: 'Achieve a 10-win streak',
    unlocked: false,
    progress: 7,
    max: 10,
  },
  {
    icon: '◎',
    title: 'The Gambler',
    desc: 'Win 50 bets in a row',
    unlocked: false,
    progress: 12,
    max: 50,
  },
  {
    icon: '◈',
    title: "Oracle's Eye",
    desc: 'Predict 20 correct outcomes',
    unlocked: false,
    progress: 14,
    max: 20,
  },
  {
    icon: '❋',
    title: 'Apex Predator',
    desc: 'Reach rank #1 on the global leaderboard',
    unlocked: false,
    progress: 0,
    max: 1,
  },
  {
    icon: '◇',
    title: 'Speed Demon',
    desc: 'Win a duel in under 1 second',
    unlocked: false,
    progress: 0,
    max: 1,
  },
  {
    icon: '✦',
    title: 'Scholar',
    desc: 'Answer 500 questions correctly',
    unlocked: false,
    progress: 143,
    max: 500,
  },
  {
    icon: '◉',
    title: 'Champion',
    desc: 'Win 500 games',
    unlocked: false,
    progress: 143,
    max: 500,
  },
];

/** the compact achievement teasers on /home and /profile */
export const homeAchievementTease = [
  {
    icon: '★',
    title: 'First Blood',
    desc: 'Win your first game',
    unlocked: true,
  },
  { icon: '🔥', title: 'On Fire', desc: '5 win streak', unlocked: true },
  {
    icon: '⚡',
    title: 'Lightning',
    desc: 'Answer in under 2s',
    unlocked: true,
  },
  { icon: '⚔', title: 'Duel Master', desc: 'Win 10 duels', unlocked: false },
];

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
