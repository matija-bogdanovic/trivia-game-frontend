/**
 * MOCK DATA — see ./README.md. Replace with the leaderboard and friends
 * endpoints. Feeds /leaderboards and /friends.
 */

export interface LeaderboardEntry {
  rank: number;
  name: string;
  initial: string;
  streak: number;
  wins: number;
  rate: string;
  money: number;
  /** the signed-in player; today this is hardcoded to the mock identity */
  isYou: boolean;
}

export const leaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'ZenMaster',
    initial: 'Z',
    streak: 14,
    wins: 412,
    rate: '78%',
    money: 41200,
    isYou: false,
  },
  {
    rank: 2,
    name: 'Cipher',
    initial: 'C',
    streak: 11,
    wins: 388,
    rate: '74%',
    money: 38800,
    isYou: false,
  },
  {
    rank: 3,
    name: 'NovaMind',
    initial: 'N',
    streak: 8,
    wins: 301,
    rate: '70%',
    money: 30100,
    isYou: false,
  },
  {
    rank: 4,
    name: 'Bolt88',
    initial: 'B',
    streak: 5,
    wins: 280,
    rate: '67%',
    money: 28000,
    isYou: false,
  },
  {
    rank: 5,
    name: 'Riptide',
    initial: 'R',
    streak: 3,
    wins: 255,
    rate: '65%',
    money: 25500,
    isYou: false,
  },
  {
    rank: 6,
    name: 'Kira9',
    initial: 'K',
    streak: 1,
    wins: 230,
    rate: '62%',
    money: 23000,
    isYou: false,
  },
  {
    rank: 7,
    name: 'AlphaWolf',
    initial: 'A',
    streak: 7,
    wins: 201,
    rate: '71%',
    money: 20100,
    isYou: true,
  },
  {
    rank: 8,
    name: 'Specter',
    initial: 'S',
    streak: 2,
    wins: 175,
    rate: '58%',
    money: 17500,
    isYou: false,
  },
  {
    rank: 9,
    name: 'Rogue',
    initial: 'R',
    streak: 0,
    wins: 150,
    rate: '54%',
    money: 15000,
    isYou: false,
  },
  {
    rank: 10,
    name: 'Echo',
    initial: 'E',
    streak: 4,
    wins: 140,
    rate: '52%',
    money: 14000,
    isYou: false,
  },
];

export const rankBadges: Record<number, string> = { 1: '★', 2: '◆', 3: '▲' };

export interface Friend {
  name: string;
  initial: string;
  streak: number;
  wins: number;
  online: boolean;
  status: string;
}

export const friends: Friend[] = [
  {
    name: 'ZenMaster',
    initial: 'Z',
    streak: 9,
    wins: 412,
    online: true,
    status: 'In Game',
  },
  {
    name: 'NovaMind',
    initial: 'N',
    streak: 4,
    wins: 88,
    online: true,
    status: 'In Lobby',
  },
  {
    name: 'Specter',
    initial: 'S',
    streak: 2,
    wins: 175,
    online: true,
    status: 'Online',
  },
  {
    name: 'Kira9',
    initial: 'K',
    streak: 0,
    wins: 230,
    online: false,
    status: 'Last seen 2h ago',
  },
  {
    name: 'Bolt88',
    initial: 'B',
    streak: 1,
    wins: 280,
    online: false,
    status: 'Last seen yesterday',
  },
  {
    name: 'Cipher',
    initial: 'C',
    streak: 6,
    wins: 388,
    online: false,
    status: 'Last seen 3 days ago',
  },
];

export interface FriendRequest {
  name: string;
  initial: string;
  wins: number;
}

export const friendRequests: FriendRequest[] = [
  { name: 'Rogue', initial: 'R', wins: 50 },
  { name: 'Echo', initial: 'E', wins: 140 },
];

/** the home screen's "friends online" rail — a narrower shape than Friend */
export interface OnlineFriend {
  name: string;
  streak: number;
  status: string;
}

export const onlineFriends: OnlineFriend[] = [
  { name: 'NovaMind', streak: 4, status: 'In Lobby' },
  { name: 'Specter', streak: 2, status: 'Online' },
  { name: 'Kira9', streak: 0, status: 'Online' },
  { name: 'ZenMaster', streak: 9, status: 'In Game' },
  { name: 'Bolt88', streak: 1, status: 'Online' },
];
