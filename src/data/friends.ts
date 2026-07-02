export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  color: string;

  // ── Payment-relationship metadata (drives the Friends experience) ──
  /** When you first transacted together, e.g. "Mar 2024". */
  memberSince?: string;
  /** Vaults completed together (all debts settled). */
  completedVaults?: number;
  /** Net outstanding balance in SGD. Positive = they owe you, negative = you owe. */
  outstanding?: number;
  /** Lifetime amount split with this person, SGD. */
  lifetimeSplit?: number;
  /** Baseline shared memories (added to live memories from transactions). */
  baseMemories?: number;
  /** Signals for "Achievements Together". */
  overseasVaults?: number;
  restaurantsVisited?: number;
  successfulSplits?: number;
  /** Fallback last-activity label when no live transaction exists. */
  lastActivity?: string;
}

export const friends: Friend[] = [
  { id: 'kai', name: 'Kai', username: '@kai_sg', avatar: 'K', color: '#C0001F', memberSince: 'Jan 2024', completedVaults: 12, outstanding: 0, lifetimeSplit: 1840, baseMemories: 14, overseasVaults: 5, restaurantsVisited: 34, successfulSplits: 58, lastActivity: 'yesterday' },
  { id: 'manoj', name: 'Manoj', username: '@manoj_rp', avatar: 'M', color: '#0033A0', memberSince: 'Mar 2024', completedVaults: 8, outstanding: 24.5, lifetimeSplit: 1120, baseMemories: 9, overseasVaults: 2, restaurantsVisited: 41, successfulSplits: 47, lastActivity: '3 days ago' },
  { id: 'priya', name: 'Priya', username: '@priya_sg', avatar: 'P', color: '#FF2D87', memberSince: 'Feb 2024', completedVaults: 10, outstanding: 0, lifetimeSplit: 1560, baseMemories: 11, overseasVaults: 6, restaurantsVisited: 28, successfulSplits: 52, lastActivity: '2 days ago' },
  { id: 'wei', name: 'Wei', username: '@wei_sg', avatar: 'W', color: '#F5C800', memberSince: 'Apr 2024', completedVaults: 6, outstanding: -12.0, lifetimeSplit: 870, baseMemories: 7, overseasVaults: 1, restaurantsVisited: 22, successfulSplits: 33, lastActivity: 'last week' },
  { id: 'alex', name: 'Alex', username: '@alex_tan', avatar: 'A', color: '#00A86B', memberSince: 'Dec 2023', completedVaults: 12, outstanding: 0, lifetimeSplit: 2010, baseMemories: 18, overseasVaults: 5, restaurantsVisited: 30, successfulSplits: 50, lastActivity: 'yesterday' },
  { id: 'jia', name: 'Jia Ling', username: '@jialing', avatar: 'J', color: '#4A1D6E', memberSince: 'May 2024', completedVaults: 4, outstanding: 8.4, lifetimeSplit: 540, baseMemories: 5, overseasVaults: 0, restaurantsVisited: 15, successfulSplits: 21, lastActivity: '5 days ago' },
  { id: 'daniel', name: 'Daniel', username: '@dan_lim', avatar: 'D', color: '#0284C7', memberSince: 'Jun 2024', completedVaults: 3, outstanding: 0, lifetimeSplit: 410, baseMemories: 4, overseasVaults: 1, restaurantsVisited: 12, successfulSplits: 18, lastActivity: '2 weeks ago' },
  { id: 'nadia', name: 'Nadia', username: '@nadia_r', avatar: 'N', color: '#E6A15C', memberSince: 'Feb 2024', completedVaults: 7, outstanding: 0, lifetimeSplit: 990, baseMemories: 8, overseasVaults: 3, restaurantsVisited: 26, successfulSplits: 39, lastActivity: '4 days ago' },
  { id: 'ryan', name: 'Ryan', username: '@ryan_ng', avatar: 'R', color: '#C0001F', memberSince: 'Jul 2024', completedVaults: 2, outstanding: -5.5, lifetimeSplit: 260, baseMemories: 3, overseasVaults: 0, restaurantsVisited: 9, successfulSplits: 12, lastActivity: '3 weeks ago' },
  { id: 'mei', name: 'Mei', username: '@mei_chua', avatar: 'M', color: '#FF2D87', memberSince: 'Jan 2024', completedVaults: 9, outstanding: 0, lifetimeSplit: 1330, baseMemories: 10, overseasVaults: 4, restaurantsVisited: 31, successfulSplits: 44, lastActivity: 'yesterday' },
  { id: 'faiz', name: 'Faiz', username: '@faiz_a', avatar: 'F', color: '#0033A0', memberSince: 'Aug 2024', completedVaults: 5, outstanding: 15.0, lifetimeSplit: 720, baseMemories: 6, overseasVaults: 2, restaurantsVisited: 19, successfulSplits: 28, lastActivity: '6 days ago' },
  { id: 'sophia', name: 'Sophia', username: '@sophia_w', avatar: 'S', color: '#00A86B', memberSince: 'Mar 2024', completedVaults: 6, outstanding: 0, lifetimeSplit: 880, baseMemories: 7, overseasVaults: 3, restaurantsVisited: 24, successfulSplits: 35, lastActivity: 'last week' },
];

export const getFriendsByIds = (ids: string[]): Friend[] => {
  return friends.filter(f => ids.includes(f.id));
};

export const getFriendByUsername = (username: string): Friend | undefined => {
  const handle = username.startsWith('@') ? username : `@${username}`;
  return friends.find(f => f.username === handle);
};

export const searchFriends = (query: string): Friend[] => {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return friends.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.username.toLowerCase().includes(q)
  );
};
