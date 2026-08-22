/**
 * MOCK DATA — see ./README.md. Feeds the home screen's "friends online" rail.
 *
 * The fixture standings that used to live here are gone: /leaderboards reads
 * GET /leaderboard and POST /friends/list, and /friends reads the same friends
 * endpoint, so nothing rendered them any more.
 */

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
