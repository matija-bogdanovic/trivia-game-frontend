/**
 * MOCK DATA — see ./README.md. Replace with game_slice's standings once the
 * game reaches phase === 'gameover'. Feeds /results.
 */

export interface ResultRow {
  name: string;
  initial: string;
  money: number;
  change: string;
  correct: number;
  wrong: number;
  duelsWon: number;
  betsWon: number;
  streak: number;
  isYou: boolean;
}

export const rankings: ResultRow[] = [
  {
    name: 'AlphaWolf',
    initial: 'A',
    money: 1240,
    change: '+$740',
    correct: 8,
    wrong: 2,
    duelsWon: 2,
    betsWon: 5,
    streak: 8,
    isYou: true,
  },
  {
    name: 'ZenMaster',
    initial: 'Z',
    money: 830,
    change: '+$330',
    correct: 6,
    wrong: 3,
    duelsWon: 1,
    betsWon: 3,
    streak: 9,
    isYou: false,
  },
  {
    name: 'NovaMind',
    initial: 'N',
    money: 420,
    change: '-$80',
    correct: 4,
    wrong: 5,
    duelsWon: 0,
    betsWon: 2,
    streak: 4,
    isYou: false,
  },
  {
    name: 'Specter',
    initial: 'S',
    money: 110,
    change: '-$390',
    correct: 3,
    wrong: 7,
    duelsWon: 0,
    betsWon: 1,
    streak: 2,
    isYou: false,
  },
];

export const medals = ['①', '②', '③', '④'];

/** the "your performance" grid — duplicated from rankings[0] in the design */
export const yourPerformance = [
  { label: 'Correct', value: '8' },
  { label: 'Wrong', value: '2' },
  { label: 'Bets Won', value: '5' },
  { label: 'Duels Won', value: '2' },
];
