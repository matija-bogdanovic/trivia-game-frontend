/**
 * MOCK DATA — see ./README.md. Replace with the game server's room list.
 * Feeds /rooms.
 */

export interface Room {
  id: number;
  name: string;
  host: string;
  hostStreak: number;
  players: number;
  maxPlayers: number;
  money: number;
  category: string;
  difficulty: string;
  public: boolean;
}

export const rooms: Room[] = [
  {
    id: 1,
    name: 'KNOWLEDGE ARENA',
    host: 'ZenMaster',
    hostStreak: 9,
    players: 3,
    maxPlayers: 6,
    money: 500,
    category: 'Mixed',
    difficulty: 'Medium',
    public: true,
  },
  {
    id: 2,
    name: 'MATH DEATHMATCH',
    host: 'NovaMind',
    hostStreak: 4,
    players: 1,
    maxPlayers: 4,
    money: 1000,
    category: 'Mathematics',
    difficulty: 'Hard',
    public: true,
  },
  {
    id: 3,
    name: 'HISTORY WARS',
    host: 'Specter',
    hostStreak: 2,
    players: 5,
    maxPlayers: 6,
    money: 500,
    category: 'History',
    difficulty: 'Easy',
    public: true,
  },
  {
    id: 4,
    name: 'SCIENCE CLASH',
    host: 'Bolt88',
    hostStreak: 1,
    players: 2,
    maxPlayers: 4,
    money: 2000,
    category: 'Science',
    difficulty: 'Hard',
    public: true,
  },
  {
    id: 5,
    name: 'GENERAL MAYHEM',
    host: 'Cipher',
    hostStreak: 6,
    players: 4,
    maxPlayers: 6,
    money: 750,
    category: 'General Knowledge',
    difficulty: 'Mixed',
    public: true,
  },
  {
    id: 6,
    name: 'GEO WARRIORS',
    host: 'Kira9',
    hostStreak: 0,
    players: 2,
    maxPlayers: 6,
    money: 500,
    category: 'Geography',
    difficulty: 'Medium',
    public: true,
  },
];

/** filter vocabularies — these should come from the question bank, not a literal */
export const filterCategories = [
  'All',
  'Mathematics',
  'Science',
  'History',
  'Geography',
  'General Knowledge',
  'Mixed',
];

export const filterDifficulties = ['All', 'Easy', 'Medium', 'Hard', 'Mixed'];
